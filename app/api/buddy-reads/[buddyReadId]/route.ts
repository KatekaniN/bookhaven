import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userDataSync } from "@/lib/userDataSync";

interface RouteParams {
  params: {
    buddyReadId: string;
  };
}

// POST - Join a buddy read
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { buddyReadId } = params;
    const userEmail = session.user.email;

    // Check if buddy read exists
    const buddyReadRef = doc(db, "buddyReads", buddyReadId);
    const buddyReadSnap = await getDoc(buddyReadRef);

    if (!buddyReadSnap.exists()) {
      return NextResponse.json(
        { error: "Buddy read not found" },
        { status: 404 }
      );
    }

    const buddyReadData = buddyReadSnap.data();

    // Check if user is already a participant
    if (
      buddyReadData.participants &&
      buddyReadData.participants.some((p: any) => p.id === userEmail)
    ) {
      return NextResponse.json(
        { error: "Already participating in this buddy read" },
        { status: 400 }
      );
    }

    // Check participant limit
    if (
      buddyReadData.participants &&
      buddyReadData.participants.length >= buddyReadData.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Buddy read is full" },
        { status: 400 }
      );
    }

    // Check if buddy read is still active
    if (buddyReadData.status !== "active") {
      return NextResponse.json(
        { error: "Cannot join inactive buddy read" },
        { status: 400 }
      );
    }

    const newParticipant = {
      id: userEmail,
      name: session.user.name || "Anonymous",
      avatar: session.user.image,
      joinedAt: new Date(),
      progress: 0,
    };

    // Add user to buddy read participants
    const updatedParticipants = [
      ...(buddyReadData.participants || []),
      newParticipant,
    ];

    await updateDoc(buddyReadRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });

    // Add participation to user's data
    await userDataSync.initializeUser(userEmail);
    await userDataSync.joinBuddyRead(buddyReadId, "participant");

    return NextResponse.json({
      message: "Successfully joined buddy read",
      buddyReadId,
    });
  } catch (error) {
    console.error("Error joining buddy read:", error);
    return NextResponse.json(
      { error: "Failed to join buddy read" },
      { status: 500 }
    );
  }
}

// DELETE - Leave a buddy read
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { buddyReadId } = params;
    const userEmail = session.user.email;

    // Check if buddy read exists
    const buddyReadRef = doc(db, "buddyReads", buddyReadId);
    const buddyReadSnap = await getDoc(buddyReadRef);

    if (!buddyReadSnap.exists()) {
      return NextResponse.json(
        { error: "Buddy read not found" },
        { status: 404 }
      );
    }

    const buddyReadData = buddyReadSnap.data();

    // Check if user is a participant
    if (
      !buddyReadData.participants ||
      !buddyReadData.participants.some((p: any) => p.id === userEmail)
    ) {
      return NextResponse.json(
        { error: "Not a participant in this buddy read" },
        { status: 400 }
      );
    }

    // Check if user is the host (hosts need to transfer host role or cancel the buddy read)
    if (buddyReadData.hostId === userEmail) {
      return NextResponse.json(
        {
          error:
            "Hosts cannot leave. Transfer host role or cancel the buddy read first.",
        },
        { status: 400 }
      );
    }

    // Remove user from buddy read participants
    const updatedParticipants = buddyReadData.participants.filter(
      (p: any) => p.id !== userEmail
    );

    await updateDoc(buddyReadRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });

    // Update user's participation data
    await userDataSync.initializeUser(userEmail);
    await userDataSync.leaveBuddyRead(buddyReadId);

    return NextResponse.json({
      message: "Successfully left buddy read",
      buddyReadId,
    });
  } catch (error) {
    console.error("Error leaving buddy read:", error);
    return NextResponse.json(
      { error: "Failed to leave buddy read" },
      { status: 500 }
    );
  }
}

// PATCH - Update reading progress
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { buddyReadId } = params;
    const userEmail = session.user.email;
    const body = await request.json();
    const { progress } = body;

    if (typeof progress !== "number" || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: "Progress must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Check if buddy read exists
    const buddyReadRef = doc(db, "buddyReads", buddyReadId);
    const buddyReadSnap = await getDoc(buddyReadRef);

    if (!buddyReadSnap.exists()) {
      return NextResponse.json(
        { error: "Buddy read not found" },
        { status: 404 }
      );
    }

    const buddyReadData = buddyReadSnap.data();

    // Check if user is a participant
    const participantIndex = buddyReadData.participants?.findIndex(
      (p: any) => p.id === userEmail
    );
    if (participantIndex === -1 || participantIndex === undefined) {
      return NextResponse.json(
        { error: "Not a participant in this buddy read" },
        { status: 400 }
      );
    }

    // Update participant's progress
    const updatedParticipants = [...buddyReadData.participants];
    updatedParticipants[participantIndex] = {
      ...updatedParticipants[participantIndex],
      progress,
    };

    await updateDoc(buddyReadRef, {
      participants: updatedParticipants,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      message: "Progress updated successfully",
      progress,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
