import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { userDataSync } from "@/lib/userDataSync";

interface RouteParams {
  params: {
    clubId: string;
  };
}

// POST - Join a book club
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clubId } = params;
    const userEmail = session.user.email;

    // Check if book club exists
    const clubRef = doc(db, "bookClubs", clubId);
    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      return NextResponse.json(
        { error: "Book club not found" },
        { status: 404 }
      );
    }

    const clubData = clubSnap.data();

    // Check if user is already a member
    if (clubData.members && clubData.members.includes(userEmail)) {
      return NextResponse.json(
        { error: "Already a member of this book club" },
        { status: 400 }
      );
    }

    // Check member limit
    if (
      clubData.memberLimit &&
      clubData.members &&
      clubData.members.length >= clubData.memberLimit
    ) {
      return NextResponse.json({ error: "Book club is full" }, { status: 400 });
    }

    // Add user to book club members
    await updateDoc(clubRef, {
      members: arrayUnion(userEmail),
      updatedAt: serverTimestamp(),
    });

    // Add membership to user's data
    await userDataSync.initializeUser(userEmail);
    await userDataSync.joinBookClub(clubId, "member");

    return NextResponse.json({
      message: "Successfully joined book club",
      clubId,
    });
  } catch (error) {
    console.error("Error joining book club:", error);
    return NextResponse.json(
      { error: "Failed to join book club" },
      { status: 500 }
    );
  }
}

// DELETE - Leave a book club
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { clubId } = params;
    const userEmail = session.user.email;

    // Check if book club exists
    const clubRef = doc(db, "bookClubs", clubId);
    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      return NextResponse.json(
        { error: "Book club not found" },
        { status: 404 }
      );
    }

    const clubData = clubSnap.data();

    // Check if user is a member
    if (!clubData.members || !clubData.members.includes(userEmail)) {
      return NextResponse.json(
        { error: "Not a member of this book club" },
        { status: 400 }
      );
    }

    // Check if user is the owner (owners cannot leave, they need to transfer ownership first)
    if (clubData.ownerId === userEmail) {
      return NextResponse.json(
        { error: "Club owners cannot leave. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Remove user from book club members
    await updateDoc(clubRef, {
      members: arrayRemove(userEmail),
      updatedAt: serverTimestamp(),
    });

    // Update user's membership data
    await userDataSync.initializeUser(userEmail);
    await userDataSync.leaveBookClub(clubId);

    return NextResponse.json({
      message: "Successfully left book club",
      clubId,
    });
  } catch (error) {
    console.error("Error leaving book club:", error);
    return NextResponse.json(
      { error: "Failed to leave book club" },
      { status: 500 }
    );
  }
}
