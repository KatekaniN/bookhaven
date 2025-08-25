import { NextRequest, NextResponse } from "next/server";
import { OpenLibraryAPI } from "../../../../lib/openLibrary";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const genre = searchParams.get("genre");
  const author = searchParams.get("author");
  const language = searchParams.get("language");
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const sortBy = searchParams.get("sortBy") || "relevance";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  // At least one search parameter must be provided
  if (!query && !genre && !author && !language && !yearMin && !yearMax) {
    return NextResponse.json(
      {
        error:
          "At least one search parameter (q, genre, author, language, or year) is required",
      },
      { status: 400 }
    );
  }

  try {
    let searchQuery = query;

    // Build search query based on filters
    if (genre) {
      // Map common genre names to OpenLibrary subject searches
      const genreMap: { [key: string]: string } = {
        "Cozy Fantasy": "fantasy",
        "Fast-paced Thriller": "thriller",
        "Romantic Comedy": "romance",
        "Science Fiction": "science fiction",
        "Historical Fiction": "historical fiction",
        Mystery: "mystery",
        "Young Adult": "young adult",
        "Self-Help": "self help",
        Fantasy: "fantasy",
        Romance: "romance",
        Thriller: "thriller",
        Fiction: "fiction",
        Biography: "biography",
      };

      const mappedGenre = genreMap[genre] || genre.toLowerCase();
      searchQuery = query
        ? `${query} subject:${mappedGenre}`
        : `subject:${mappedGenre}`;
    }

    if (author && !searchQuery.includes("author:")) {
      searchQuery = searchQuery
        ? `${searchQuery} author:${author}`
        : `author:${author}`;
    }

    // Add language filter
    if (language) {
      const languageQuery = `language:${language.toLowerCase()}`;
      searchQuery = searchQuery
        ? `${searchQuery} ${languageQuery}`
        : languageQuery;
    }

    // Add year range filter
    if (yearMin || yearMax) {
      let yearFilter = "";
      if (yearMin && yearMax) {
        yearFilter = `first_publish_year:[${yearMin} TO ${yearMax}]`;
      } else if (yearMin) {
        yearFilter = `first_publish_year:[${yearMin} TO *]`;
      } else if (yearMax) {
        yearFilter = `first_publish_year:[* TO ${yearMax}]`;
      }

      if (yearFilter) {
        searchQuery = searchQuery ? `${searchQuery} ${yearFilter}` : yearFilter;
      }
    }

    const response = await OpenLibraryAPI.searchBooks(
      searchQuery,
      limit,
      offset,
      sortBy
    );

    const formattedBooks = response.docs.map((book) =>
      OpenLibraryAPI.formatBookData(book)
    );

    return NextResponse.json({
      books: formattedBooks,
      totalCount: response.numFound,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < response.numFound,
      searchQuery: searchQuery,
    });
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    );
  }
}
