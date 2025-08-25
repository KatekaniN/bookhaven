import { NextRequest, NextResponse } from "next/server";
import { OpenLibraryAPI } from "../../../lib/openLibrary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "24");

    // Get a mix of highly-rated books from different popular genres
    const featuredBooks = await getFeaturedBooks(limit);

    return NextResponse.json({
      success: true,
      data: featuredBooks,
    });
  } catch (error) {
    console.error("Error fetching featured books:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured books" },
      { status: 500 }
    );
  }
}

async function getFeaturedBooks(limit: number) {
  const featuredBooks: any[] = [];

  // Popular genres that tend to have well-reviewed books
  const popularGenres = [
    "bestseller",
    "award winner",
    "literary fiction",
    "mystery thriller",
    "science fiction",
    "contemporary fiction",
    "historical fiction",
    "fantasy",
    "romance",
    "biography",
  ];

  try {
    // Get a mix of books from different popular categories
    const genresToProcess = Math.min(
      popularGenres.length,
      Math.ceil(limit / 8)
    );
    const booksPerGenre = Math.ceil(limit / genresToProcess);

    for (const genre of popularGenres.slice(0, genresToProcess)) {
      try {
        const searchResult = await OpenLibraryAPI.searchByGenre(
          genre,
          booksPerGenre + 2
        );
        const books = searchResult.docs
          .filter(
            (book) =>
              book.cover_i && // Has cover image
              book.author_name && // Has author
              book.first_publish_year && // Has publish year
              book.first_publish_year > 1985 && // Relatively recent
              book.title && // Has title
              !book.title.toLowerCase().includes("untitled") // Not untitled
          )
          .slice(0, booksPerGenre)
          .map((book) => ({
            ...book,
            featured_reason: `Popular in ${genre}`,
            featured_score: Math.random() * 0.3 + 0.7, // High score for featured books
          }));

        featuredBooks.push(...books);
      } catch (genreError) {
        console.error(`Error fetching ${genre} books:`, genreError);
      }
    }

    // Also get some trending/popular books
    try {
      const trendingLimit = Math.max(4, Math.floor(limit * 0.3)); // 30% trending books
      const trendingResult = await OpenLibraryAPI.getTrendingBooks(
        trendingLimit + 2
      );
      const trendingBooks = trendingResult.docs
        .filter(
          (book) =>
            book.cover_i &&
            book.author_name &&
            book.title &&
            !book.title.toLowerCase().includes("untitled")
        )
        .slice(0, trendingLimit)
        .map((book) => ({
          ...book,
          featured_reason: "Community favorite",
          featured_score: Math.random() * 0.2 + 0.8,
        }));

      featuredBooks.push(...trendingBooks);
    } catch (trendingError) {
      console.error("Error fetching trending books:", trendingError);
    }

    // Remove duplicates and sort by featured score
    const uniqueFeatured = featuredBooks
      .filter(
        (book, index, self) =>
          index === self.findIndex((b) => b.key === book.key)
      )
      .sort((a, b) => b.featured_score - a.featured_score)
      .slice(0, limit);

    return uniqueFeatured;
  } catch (error) {
    console.error("Error in getFeaturedBooks:", error);

    // Fallback to trending books if the above fails
    try {
      const fallbackResult = await OpenLibraryAPI.getTrendingBooks(limit);
      return fallbackResult.docs
        .filter((book) => book.cover_i && book.author_name)
        .slice(0, limit)
        .map((book) => ({
          ...book,
          featured_reason: "Popular choice",
          featured_score: 0.7,
        }));
    } catch (fallbackError) {
      console.error("Fallback featured books failed:", fallbackError);
      return [];
    }
  }
}
