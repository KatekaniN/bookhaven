import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { OpenLibraryAPI, OpenLibraryBook } from "../../../lib/openLibrary";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// Simple recommendation algorithm based on user preferences and ratings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const userEmail = session.user.email;

    // In a real app, you would fetch user preferences from database
    // For now, we'll use a simple recommendation algorithm

    // Get user preferences (you would fetch this from your database)
    const userPreferences = getUserPreferences(userEmail);

    const recommendations = await generateRecommendations(
      userPreferences,
      limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
      },
      { status: 500 }
    );
  }
}

// Simulate getting user preferences (replace with actual database call)
function getUserPreferences(userEmail: string) {
  // This would be replaced with actual database lookup
  return {
    genres: ["fiction", "mystery", "science"],
    ratings: {
      books: [],
      authors: [],
    },
    favoriteAuthors: [],
    dislikedGenres: [],
  };
}

// Simple recommendation algorithm
async function generateRecommendations(preferences: any, limit: number) {
  const recommendations: Array<
    OpenLibraryBook & {
      recommendation_score: number;
      recommendation_reason: string;
    }
  > = [];

  // Generate recommendations based on preferred genres
  for (const genre of preferences.genres.slice(0, 3)) {
    try {
      const searchResult = await OpenLibraryAPI.searchByGenre(genre, 5);
      const books = searchResult.docs;

      books.forEach((book: OpenLibraryBook) => {
        // Simple scoring algorithm
        let score = 0.5; // Base score

        // Boost score for preferred genres
        if (
          preferences.genres.some((g: string) =>
            book.subject?.some((s: string) =>
              s.toLowerCase().includes(g.toLowerCase())
            )
          )
        ) {
          score += 0.3;
        }

        // Boost score for favorite authors
        if (
          preferences.favoriteAuthors.some((author: string) =>
            book.author_name?.some((a: string) =>
              a.toLowerCase().includes(author.toLowerCase())
            )
          )
        ) {
          score += 0.4;
        }

        // Reduce score for disliked genres
        if (
          preferences.dislikedGenres.some((g: string) =>
            book.subject?.some((s: string) =>
              s.toLowerCase().includes(g.toLowerCase())
            )
          )
        ) {
          score -= 0.2;
        }

        recommendations.push({
          ...book,
          recommendation_score: score,
          recommendation_reason: `Based on your interest in ${genre}`,
        });
      });
    } catch (error) {
      console.error(`Error fetching books for genre ${genre}:`, error);
    }
  }

  // Sort by recommendation score and remove duplicates
  const uniqueRecommendations = recommendations
    .filter(
      (book, index, self) => index === self.findIndex((b) => b.key === book.key)
    )
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);

  return uniqueRecommendations;
}
