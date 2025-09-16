import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BookClub } from "@/types";

// GET - Fetch available book clubs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limitParam = searchParams.get("limit");
    const searchQuery = searchParams.get("q");

    // Order by createdAt to avoid relying on a possibly missing memberCount field
    let bookClubsQuery = query(
      collection(db, "bookClubs"),
      orderBy("createdAt", "desc")
    );

    // Add category filter if provided
    if (category && category !== "all") {
      bookClubsQuery = query(bookClubsQuery, where("category", "==", category));
    }

    // Add limit if provided
    if (limitParam) {
      const limitValue = parseInt(limitParam);
      bookClubsQuery = query(bookClubsQuery, firestoreLimit(limitValue));
    }

    let snapshot = await getDocs(bookClubsQuery);
    let bookClubs: BookClub[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as BookClub[];

    // Auto-seed a few empty clubs if none exist yet (first authenticated request)
    if (bookClubs.length === 0) {
      const seedNow = new Date();
      const seeds = [
        {
          name: "Science Fiction Circle",
          description:
            "Exploring space operas, hard sci-fi, and speculative tech.",
          ownerId: "system",
          members: [],
          isPrivate: false,
          tags: [
            "sci-fi",
            "space",
            "technology",
            "hard-sf",
            "dystopian",
            "time-travel",
            "cyberpunk",
            "first-contact",
            "ai",
            "post-apocalyptic",
          ],
          category: "Science Fiction",
          coverImage: "/bookclub/sci-fi-bc.png",
          createdAt: seedNow,
          updatedAt: seedNow,
        },
        {
          name: "Mystery & Thrillers",
          description: "From cozy whodunits to psychological thrillers.",
          ownerId: "system",
          members: [],
          isPrivate: false,
          tags: [
            "mystery",
            "thriller",
            "detective",
            "suspense",
            "crime",
            "noir",
            "whodunit",
            "police-procedural",
            "psychological",
            "locked-room",
          ],
          category: "Mystery",
          coverImage: "/bookclub/myster-bc.png",
          createdAt: seedNow,
          updatedAt: seedNow,
        },
        {
          name: "Literary Salon",
          description: "Thoughtful reads and meaningful discussion.",
          ownerId: "system",
          members: [],
          isPrivate: false,
          tags: [
            "literary",
            "classics",
            "award-winners",
            "thoughtful",
            "booker",
            "pulitzer",
            "modern-classics",
            "contemporary",
            "translated",
          ],
          category: "Literary Fiction",
          coverImage: "/bookclub/classic-lit-br.png",
          createdAt: seedNow,
          updatedAt: seedNow,
        },
      ];

      await Promise.all(
        seeds.map((c) =>
          addDoc(collection(db, "bookClubs"), {
            ...c,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        )
      );

      // Re-query after seeding
      snapshot = await getDocs(bookClubsQuery);
      bookClubs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BookClub[];
    }

    // Apply search filter if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      bookClubs = bookClubs.filter(
        (club) =>
          club.name.toLowerCase().includes(query) ||
          club.description.toLowerCase().includes(query) ||
          club.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ bookClubs });
  } catch (error) {
    console.error("Error fetching book clubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch book clubs" },
      { status: 500 }
    );
  }
}

// POST - Create a new book club
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      isPublic = true,
      tags = [],
      coverImage,
      currentBook,
      memberLimit,
    } = body;

    // Validate required fields
    if (!name || !description || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, description, category" },
        { status: 400 }
      );
    }

    const newBookClub: Omit<BookClub, "id"> = {
      name,
      description,
      coverImage,
      ownerId: session.user.email,
      members: [session.user.email],
      isPrivate: !isPublic,
      currentBook,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberLimit,
    };

    const docRef = await addDoc(collection(db, "bookClubs"), {
      ...newBookClub,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      id: docRef.id,
      ...newBookClub,
      message: "Book club created successfully",
    });
  } catch (error) {
    console.error("Error creating book club:", error);
    return NextResponse.json(
      { error: "Failed to create book club" },
      { status: 500 }
    );
  }
}
