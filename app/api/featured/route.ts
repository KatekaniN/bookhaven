import { NextRequest, NextResponse } from "next/server";
import { OpenLibraryAPI } from "../../../lib/openLibrary";

// Always fetch fresh data from OpenLibrary for live results only
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

  const matchesTheme = (
    book: any,
    theme: { label: string; queries: string[] }
  ) => {
    const subjects: string[] = (book.subject || []).map((s: string) =>
      s.toLowerCase()
    );
    const title: string = (book.title || "").toLowerCase();
    const haystack = [title, ...subjects].join(" ");
    return (
      theme.queries.some((q) => haystack.includes(q.toLowerCase())) ||
      haystack.includes(theme.label.toLowerCase())
    );
  };

  // Popular genres that tend to have well-reviewed books
  // Prefer canonical OpenLibrary subject terms and include a few themed aliases
  const themes: Array<{ label: string; queries: string[] }> = [
    { label: "fantasy", queries: ["Fantasy"] },
    { label: "science fiction", queries: ["Science Fiction", "Sci-Fi"] },
    { label: "mystery", queries: ["Mystery", "Mystery Thriller"] },
    { label: "romance", queries: ["Romance"] },
    { label: "historical", queries: ["Historical Fiction", "History"] },
    { label: "literary", queries: ["Literary Fiction"] },
    { label: "thriller", queries: ["Thriller"] },
    { label: "horror", queries: ["Horror"] },
    { label: "biography", queries: ["Biography", "Autobiography"] },
    { label: "young adult", queries: ["Young Adult", "YA"] },
    { label: "self-help", queries: ["Self-Help", "Self Help"] },
    { label: "graphic novels", queries: ["Graphic Novels", "Comics"] },
  ];

  try {
    // Get a mix of books from different popular categories
    const genresToProcess = Math.min(
      themes.length,
      Math.max(3, Math.ceil(limit / 6))
    );
    const booksPerGenre = Math.max(3, Math.ceil(limit / genresToProcess));

    for (const theme of themes.slice(0, genresToProcess)) {
      try {
        // Debug
        // console.log(`⭐ Featured: fetching theme ${theme.label}`);
        // Try each query variant for this theme, stop at first that yields results
        let docs: any[] = [];
        for (const q of theme.queries) {
          // Add larger random offset and date-based seeding for true daily variation
          const today = new Date().toDateString();
          const dailySeed = today.split(" ").join("").charCodeAt(0);
          const randomOffset =
            Math.floor(Math.random() * 50) + (dailySeed % 30);

          const res = await OpenLibraryAPI.searchByGenre(
            q,
            booksPerGenre + 15, // Get more books to choose from
            randomOffset
          );
          if (res?.docs?.length) {
            docs = res.docs;
            break;
          }
        }
        // If we didn't get docs from searchByGenre variants, try popular-by-genre
        if (!docs.length) {
          for (const q of theme.queries) {
            const res = await OpenLibraryAPI.getPopularBooksByGenre(
              q,
              booksPerGenre + 4
            );
            if (res?.docs?.length) {
              docs = res.docs;
              break;
            }
          }
        }

        // Slightly relaxed filter (author optional; title+cover required)
        const filtered = (docs || []).filter(
          (book: any) =>
            book.cover_i &&
            book.title &&
            !book.title.toLowerCase().includes("untitled") &&
            matchesTheme(book, theme)
        );

        const books = filtered.slice(0, booksPerGenre).map((book: any) => ({
          ...book,
          featured_reason: `Enchanted pick from Book Haven: ${theme.label}`,
          featured_score:
            Math.random() * 0.3 + 0.7 + (Date.now() % 1000) / 10000, // Add time-based variation
        }));

        featuredBooks.push(...books);
      } catch (genreError) {
        console.error(`Error fetching ${theme.label} books:`, genreError);
      }
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
    // Return empty list on error to avoid synthetic fallbacks
    return [];
  }
}
