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
    const refresh = url.searchParams.get("refresh") === "true";
    const userEmail = session.user.email;

    // In a real app, you would fetch user preferences from database
    // For now, we'll use a simple recommendation algorithm

    // Get user preferences (you would fetch this from your database)
    const userPreferences = getUserPreferences(userEmail);

    const recommendations = await generateRecommendations(
      userPreferences,
      limit,
      refresh
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
async function generateRecommendations(
  preferences: any,
  limit: number,
  refresh: boolean = false
) {
  const recommendations: Array<
    OpenLibraryBook & {
      recommendation_score: number;
      recommendation_reason: string;
    }
  > = [];

  // Add some randomization when refreshing
  const genresToUse = refresh
    ? [...preferences.genres].sort(() => Math.random() - 0.5) // Randomize genre order
    : preferences.genres;

  // Generate recommendations based on preferred genres
  for (const genre of genresToUse.slice(0, 3)) {
    try {
      // Vary the number of books fetched and add randomness for refresh
      const booksToFetch = refresh ? Math.floor(Math.random() * 10) + 5 : 5;
      const searchResult = await OpenLibraryAPI.searchByGenre(
        genre,
        booksToFetch
      );
      let books = searchResult.docs;

      // If refreshing, randomize the book selection
      if (refresh) {
        books = books.sort(() => Math.random() - 0.5);
      }

      books.forEach((book: OpenLibraryBook) => {
        // Simple scoring algorithm with randomization for refresh
        let score = refresh ? Math.random() * 0.3 + 0.4 : 0.5; // Base score with variation

        // Boost score for preferred genres
        if (
          preferences.genres.some((g: string) =>
            book.subject?.some((s: string) =>
              s.toLowerCase().includes(g.toLowerCase())
            )
          )
        ) {
          score += refresh ? Math.random() * 0.4 + 0.2 : 0.3;
        }

        // Boost score for favorite authors
        if (
          preferences.favoriteAuthors.some((author: string) =>
            book.author_name?.some((a: string) =>
              a.toLowerCase().includes(author.toLowerCase())
            )
          )
        ) {
          score += refresh ? Math.random() * 0.5 + 0.3 : 0.4;
        }

        // Reduce score for disliked genres
        if (
          preferences.dislikedGenres.some((g: string) =>
            book.subject?.some((s: string) =>
              s.toLowerCase().includes(g.toLowerCase())
            )
          )
        ) {
          score -= refresh ? Math.random() * 0.3 + 0.1 : 0.2;
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
  let uniqueRecommendations = recommendations
    .filter(
      (book, index, self) => index === self.findIndex((b) => b.key === book.key)
    )
    .sort((a, b) => b.recommendation_score - a.recommendation_score);

  // If refreshing, add some randomization to the final selection
  if (refresh) {
    uniqueRecommendations = uniqueRecommendations.sort(
      () => Math.random() - 0.5
    );
  }

  return uniqueRecommendations.slice(0, limit);
}
