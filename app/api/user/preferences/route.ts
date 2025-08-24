import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// In a real app, this would connect to your database
// For now, we'll use a simple in-memory store
const userPreferences = new Map();

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/user/preferences - Starting...");

    const session = await getServerSession(authOptions);
    console.log(
      "Session:",
      session ? "Found" : "Not found",
      session?.user?.email
    );

    if (!session?.user?.email) {
      console.log("Unauthorized - no session or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { preferences, bookRatings, authorRatings } = body;

    // Validate the data
    if (!preferences?.genres || !Array.isArray(preferences.genres)) {
      console.log("Invalid preferences data");
      return NextResponse.json(
        { error: "Invalid preferences data" },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;

    // Store user preferences
    const userData = {
      preferences: {
        genres: preferences.genres,
        topics: preferences.topics || [],
        languages: preferences.languages || ["en"],
      },
      ratings: {
        books: bookRatings || [],
        authors: authorRatings || [],
      },
      updatedAt: new Date().toISOString(),
    };

    userPreferences.set(userEmail, userData);
    console.log("Successfully saved preferences for user:", userEmail);

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

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;
    const userData = userPreferences.get(userEmail);

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
