import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { UserDataStore } from "../../../../lib/userDataStore";
import { getFirestoreAdmin } from "../../../../lib/server/firebaseAdmin";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/user/preferences - Starting...");
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );
    console.log("Cookies:", request.cookies.getAll());

    const session = await getServerSession(authOptions);
    console.log(
      "Session:",
      session ? "Found" : "Not found",
      session?.user?.email
    );
    console.log("Full session object:", JSON.stringify(session, null, 2));

    // Determine user email either from session, or (in development only) from header fallback
    let userEmail = session?.user?.email as string | undefined;
    if (!userEmail && process.env.NODE_ENV === "development") {
      const headerEmail = request.headers.get("x-user-email") || undefined;
      if (headerEmail) {
        console.log(
          "Dev fallback: using x-user-email header for auth",
          headerEmail
        );
        userEmail = headerEmail;
      }
    }

    if (!userEmail) {
      console.log("Unauthorized - no session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { preferences, bookRatings, authorRatings, completedAt } = body;

    // Validate the data
    if (!preferences?.genres || !Array.isArray(preferences.genres)) {
      console.log("Invalid preferences data");
      return NextResponse.json(
        { error: "Invalid preferences data" },
        { status: 400 }
      );
    }

    // Store user preferences with all the data
    const userData = {
      preferences: {
        genres: preferences.genres,
        topics: preferences.topics || [],
        languages: preferences.languages || ["en"],
        readingGoal: preferences.readingGoal,
        readingPace: preferences.readingPace,
        bookFormats: preferences.bookFormats || [],
      },
      ratings: {
        books: bookRatings || [],
        authors: authorRatings || [],
      },
      completedAt: completedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Try to persist to Firestore (admin) if configured; fall back to in-memory store
    const db = getFirestoreAdmin();
    if (db) {
      try {
        await db
          .collection("users")
          .doc(userEmail)
          .set(userData, { merge: true });
        console.log("Firestore: preferences saved for", userEmail);
      } catch (e) {
        console.warn(
          "Firestore save failed, falling back to in-memory store:",
          e
        );
        UserDataStore.set(userEmail, userData);
      }
    } else {
      UserDataStore.set(userEmail, userData);
    }
    console.log("Successfully saved preferences for user:", userEmail);
    console.log("All users in store:", UserDataStore.getAllUsers());

    return NextResponse.json({
      success: true,
      message: "Preferences saved successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      {
        error: "Failed to save preferences",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userEmail = session?.user?.email as string | undefined;
    // Dev header fallback to stabilize local testing
    if (!userEmail && process.env.NODE_ENV === "development") {
      const headerEmail = request.headers.get("x-user-email") || undefined;
      if (headerEmail) userEmail = headerEmail;
    }

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prefer Firestore (admin) if configured
    let userData = null as any;
    const db = getFirestoreAdmin();
    if (db) {
      try {
        const snap = await db.collection("users").doc(userEmail).get();
        if (snap.exists) {
          userData = snap.data();
          // Keep in-memory store in sync for other routes
          UserDataStore.set(userEmail, userData);
        }
      } catch (e) {
        console.warn(
          "Firestore read failed, falling back to in-memory store:",
          e
        );
      }
    }

    if (!userData) {
      userData = UserDataStore.get(userEmail);
    }

    if (!userData) {
      return NextResponse.json({
        preferences: { genres: [], topics: [], languages: ["en"] },
        ratings: { books: [], authors: [] },
      });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch preferences",
      },
      { status: 500 }
    );
  }
}
