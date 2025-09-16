import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BuddyRead } from "@/types";

// GET - Fetch available buddy reads
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const searchQuery = searchParams.get("q");
    const status = searchParams.get("status") || "active";

    const colRef = collection(db, "buddyReads");
    let primaryQuery = query(
      colRef,
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );

    // Add limit if provided
    if (limitParam) {
      const limitValue = parseInt(limitParam);
      primaryQuery = query(primaryQuery, firestoreLimit(limitValue));
    }

  const snapshot = await getDocs(primaryQuery);

  let buddyReads: BuddyRead[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BuddyRead[];

  // Results are already ordered by Firestore index (createdAt desc)

    // Apply search filter if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
    buddyReads = buddyReads.filter(
        (read) =>
          read.bookTitle.toLowerCase().includes(query) ||
          read.bookAuthor.toLowerCase().includes(query) ||
      read.description.toLowerCase().includes(query) ||
      Array.isArray((read as any).tags) && (read as any).tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ buddyReads });
  } catch (error) {
    console.error("Error fetching buddy reads:", error);
    return NextResponse.json(
      { error: "Failed to fetch buddy reads" },
      { status: 500 }
    );
  }
}

// POST - Create a new buddy read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookTitle,
      bookAuthor,
      bookCover,
      bookId,
      description,
      targetEndDate,
      maxParticipants = 6,
      isPrivate = false,
      tags = [],
    } = body;

    // Validate required fields
    if (!bookTitle || !bookAuthor || !description || !targetEndDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: bookTitle, bookAuthor, description, targetEndDate",
        },
        { status: 400 }
      );
    }

    const newBuddyRead: any = {
      bookTitle,
      bookAuthor,
      bookId,
      hostId: session.user.email,
      participants: [
        {
          id: session.user.email,
          name: session.user.name || "Host",
          avatar: session.user.image,
          joinedAt: new Date(),
          progress: 0,
        },
      ],
      startDate: new Date(),
      targetEndDate: new Date(targetEndDate),
      maxParticipants,
      description,
      isPrivate,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "active",
    };
    if (bookCover) newBuddyRead.bookCover = bookCover;

    const docRef = await addDoc(collection(db, "buddyReads"), {
      ...newBuddyRead,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      startDate: serverTimestamp(),
      targetEndDate: new Date(targetEndDate),
    });

    return NextResponse.json({
      id: docRef.id,
      ...newBuddyRead,
      message: "Buddy read created successfully",
    });
  } catch (error) {
    console.error("Error creating buddy read:", error);
    return NextResponse.json(
      { error: "Failed to create buddy read" },
      { status: 500 }
    );
  }
}
