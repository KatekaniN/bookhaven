import { NextRequest, NextResponse } from "next/server";
import { OpenLibraryAPI } from "../../../../lib/openLibrary";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const response = await OpenLibraryAPI.searchBooks(query, limit, offset);

    const formattedBooks = response.docs.map((book) =>
      OpenLibraryAPI.formatBookData(book)
    );

    return NextResponse.json({
      books: formattedBooks,
      totalCount: response.numFound,
      page: Math.floor(offset / limit) + 1,
      limit,
      hasMore: offset + limit < response.numFound,
    });
  } catch (error) {
    console.error("Book search error:", error);
    return NextResponse.json(
      { error: "Failed to search books" },
      { status: 500 }
    );
  }
}
