import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { OpenLibraryAPI, OpenLibraryBook } from "../../../lib/openLibrary";
import { UserDataStore } from "../../../lib/userDataStore";
import { getFirestoreAdmin } from "../../../lib/server/firebaseAdmin";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// Simple recommendation algorithm based on user preferences and ratings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Determine user email (dev header fallback to avoid flaky cookies during dev hot reloads)
    let userEmail = session?.user?.email as string | undefined;
    if (!userEmail && process.env.NODE_ENV === "development") {
      const headerEmail = request.headers.get("x-user-email") || undefined;
      if (headerEmail) {
        userEmail = headerEmail;
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const refresh = url.searchParams.get("refresh") === "true";
    // Get user preferences from Firestore (admin) first; fall back to in-memory store
    const db = getFirestoreAdmin();
    let userPrefs: any = null;
    if (db) {
      try {
        const snap = await db.collection("users").doc(userEmail).get();
        if (snap.exists) {
          userPrefs = snap.data();
          // sync memory store for other routes
          UserDataStore.set(userEmail, userPrefs);
        }
      } catch (e) {
        console.warn(
          "Firestore read failed in recommendations, using memory store:",
          e
        );
      }
    }
    if (!userPrefs) {
      userPrefs = getUserPreferences(userEmail);
    }

    console.log("📖 Recommendations: User preferences found:", {
      hasPreferences: !!userPrefs,
      genresCount: userPrefs?.preferences?.genres?.length || 0,
      bookRatingsCount: userPrefs?.ratings?.books?.length || 0,
      authorRatingsCount: userPrefs?.ratings?.authors?.length || 0,
    });

    // Check if user has completed onboarding
    if (!userPrefs || !userPrefs.preferences?.genres?.length) {
      console.log("📖 Recommendations: No onboarding data found for user");

      // Try to provide some fallback recommendations based on popular books
      try {
        const fallbackRecommendations = await generateFallbackRecommendations(
          limit
        );
        if (fallbackRecommendations.length > 0) {
          console.log(
            `📖 Recommendations: Providing ${fallbackRecommendations.length} fallback recommendations`
          );
          return NextResponse.json({
            success: true,
            data: fallbackRecommendations,
            message:
              "Showing popular books - complete your preferences for personalized recommendations",
          });
        }
      } catch (error) {
        console.error("Failed to generate fallback recommendations:", error);
      }

      return NextResponse.json({
        success: false,
        message:
          "Please complete onboarding to get personalized recommendations",
        data: [],
      });
    }

    const recommendations = await generateRecommendations(
      userPrefs,
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

// Get user preferences from the shared store
function getUserPreferences(userEmail: string) {
  const userData = UserDataStore.get(userEmail);

  if (!userData) {
    console.log("📖 Recommendations: No user data found in preferences store");
    return null;
  }

  console.log("📖 Recommendations: Found user data:", {
    hasGenres: !!userData.preferences?.genres?.length,
    genresCount: userData.preferences?.genres?.length || 0,
    bookRatingsCount: userData.ratings?.books?.length || 0,
    authorRatingsCount: userData.ratings?.authors?.length || 0,
  });

  return userData;
}

// Generate fallback recommendations for users without preferences
async function generateFallbackRecommendations(limit: number) {
  const fallbackRecommendations: Array<
    OpenLibraryBook & {
      recommendation_score: number;
      recommendation_reason: string;
    }
  > = [];

  // Popular genres to show when user has no preferences
  const popularGenres = ["Fantasy", "Science Fiction", "Mystery", "Fiction"];

  for (const genre of popularGenres.slice(0, 2)) {
    try {
      const searchResult = await OpenLibraryAPI.searchByGenre(genre, 6);
      const books = searchResult.docs;

      books.forEach((book: OpenLibraryBook) => {
        fallbackRecommendations.push({
          ...book,
          recommendation_score: Math.random() * 0.5 + 0.5,
          recommendation_reason: `Popular ${genre} book`,
        });
      });
    } catch (error) {
      console.error(`Error fetching fallback books for genre ${genre}:`, error);
    }
  }

  return fallbackRecommendations
    .filter(
      (book, index, self) => index === self.findIndex((b) => b.key === book.key)
    )
    .sort((a, b) => b.recommendation_score - a.recommendation_score)
    .slice(0, limit);
}
// Simple recommendation algorithm
async function generateRecommendations(
  userData: any,
  limit: number,
  refresh: boolean = false
) {
  const recommendations: Array<
    OpenLibraryBook & {
      recommendation_score: number;
      recommendation_reason: string;
    }
  > = [];

  const preferences = userData.preferences;
  const ratings = userData.ratings;

  // Extract favorite authors from ratings
  const favoriteAuthors = ratings.authors
    .filter((author: any) => author.rating >= 4)
    .map((author: any) => author.name);

  // Extract favorite genres from ratings and preferences
  const userGenres = preferences.genres || [];

  console.log("📖 Generating recommendations for genres:", userGenres);

  // Add some randomization when refreshing
  const genresToUse = refresh
    ? [...userGenres].sort(() => Math.random() - 0.5) // Randomize genre order
    : userGenres;

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
          userGenres.some((g: string) =>
            book.subject?.some((s: string) =>
              s.toLowerCase().includes(g.toLowerCase())
            )
          )
        ) {
          score += refresh ? Math.random() * 0.4 + 0.2 : 0.3;
        }

        // Boost score for favorite authors
        if (
          favoriteAuthors.some((author: string) =>
            book.author_name?.some((a: string) =>
              a.toLowerCase().includes(author.toLowerCase())
            )
          )
        ) {
          score += refresh ? Math.random() * 0.5 + 0.3 : 0.4;
        }

        // Boost score based on user's book ratings (similar books)
        const userLikedBooks = ratings.books.filter((b: any) => b.rating >= 4);
        if (userLikedBooks.length > 0) {
          // Simple similarity check based on title/author keywords
          const bookKeywords = [
            ...book.title.toLowerCase().split(" "),
            ...(book.author_name?.[0]?.toLowerCase().split(" ") || []),
          ];

          const hasSimilarity = userLikedBooks.some((likedBook: any) => {
            const likedKeywords = [
              ...likedBook.title.toLowerCase().split(" "),
              ...likedBook.author.toLowerCase().split(" "),
            ];
            return bookKeywords.some((keyword) =>
              likedKeywords.some(
                (likedKeyword) =>
                  keyword.length > 3 && likedKeyword.includes(keyword)
              )
            );
          });

          if (hasSimilarity) {
            score += refresh ? Math.random() * 0.3 + 0.1 : 0.2;
          }
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

  console.log(`📖 Generated ${uniqueRecommendations.length} recommendations`);
  return uniqueRecommendations.slice(0, limit);
}
