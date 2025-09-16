const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const COVERS_BASE_URL = "https://covers.openlibrary.org/b";
const API_PROXY_URL = "/api/openlibrary"; // Prefer proxy in the browser only

export interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  publisher?: string[];
  language?: string[];
  subject?: string[];
  ratings_average?: number;
  ratings_count?: number;
  want_to_read_count?: number;
  currently_reading_count?: number;
  already_read_count?: number;
  edition_count?: number;
}

export interface BookSearchResponse {
  numFound: number;
  start: number;
  docs: OpenLibraryBook[];
}

export interface BookDetails {
  key: string;
  title: string;
  description?: string | { value: string };
  authors?: Array<{ key: string }>;
  subjects?: string[];
  covers?: number[];
  isbn_10?: string[];
  isbn_13?: string[];
  publish_date?: string;
  publishers?: string[];
  number_of_pages?: number;
  physical_format?: string;
  works?: Array<{ key: string }>;
}

export class OpenLibraryAPI {
  private static normalizeSubjectKey(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }
  private static slugSubject(genre: string): string {
    // Convert to OpenLibrary subject_key format (lowercase underscores)
    return genre
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  static async searchBooks(
    query: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: string = "relevance"
  ): Promise<BookSearchResponse> {
    // // Ensure query is a proper string
    const q = String(query ?? "").trim();
    const searchParams = new URLSearchParams({
      q,
      limit: limit.toString(),
      offset: offset.toString(),
      // Include subject field for better genre categorization
      fields: "key,title,author_name,first_publish_year,cover_i,subject",
    });
    // Don't add sort parameter - it might cause 500 errors

    // Server vs browser: in browser use our proxy; on the server try OpenLibrary and fall back to proxy on 5xx
    const isServer = typeof window === "undefined";
    const primaryEndpoint = isServer
      ? `${OPEN_LIBRARY_BASE_URL}/search.json`
      : API_PROXY_URL;
    const fallbackEndpoint = API_PROXY_URL;
    const url = `${primaryEndpoint}?${searchParams.toString()}`;
    // Debug log only on server to avoid noisy client logs
    if (isServer) {
      console.log(`🔗 OpenLibrary fetch: ${url}`);
    }
    // Simple retry with no aggressive timeouts
    const maxRetries = 2;
    let attempt = 0;
    let lastErr: any = null;
    while (attempt <= maxRetries) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return response.json();
        }
        if (isServer && response.status >= 500) {
          // Try proxy fallback once on server
          const proxyUrl = `${fallbackEndpoint}?${searchParams.toString()}`;
          const proxyResp = await fetch(proxyUrl);
          if (proxyResp.ok) return proxyResp.json();
        }
        // Retry on 5xx
        if (response.status >= 500 && response.status < 600) {
          const delay =
            250 * Math.pow(2, attempt) + Math.floor(Math.random() * 120);
          await new Promise((r) => setTimeout(r, delay));
          attempt++;
          continue;
        }
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      } catch (e: any) {
        lastErr = e;
        if (attempt >= maxRetries) break;
        const delay =
          250 * Math.pow(2, attempt) + Math.floor(Math.random() * 120);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
      }
    }
    throw new Error(`Search failed: ${lastErr?.message || "Unknown error"}`);
  }

  static async getBookDetails(bookKey: string): Promise<BookDetails> {
    const response = await fetch(`${OPEN_LIBRARY_BASE_URL}${bookKey}.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch book details: ${response.statusText}`);
    }

    return response.json();
  }

  static async getAuthorDetails(authorKey: string) {
    const response = await fetch(`${OPEN_LIBRARY_BASE_URL}${authorKey}.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch author details: ${response.statusText}`);
    }

    return response.json();
  }

  static getCoverUrl(coverId: number, size: "S" | "M" | "L" = "M"): string {
    return `${COVERS_BASE_URL}/id/${coverId}-${size}.jpg`;
  }

  static async searchByGenre(
    genre: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<BookSearchResponse> {
    // Prefer subject-based search to keep results relevant to the genre
    // Use a conservative query that prioritizes subject and falls back to title mentions
    const g = genre.trim();
    const subjectKey = this.slugSubject(g);
    const query = `subject:\"${g}\" OR subject_key:${subjectKey} OR title:\"${g}\"`;
    return this.searchBooks(query, limit, offset, "relevance");
  }

  static async searchByAuthor(
    author: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<BookSearchResponse> {
    return this.searchBooks(author, limit, offset, "relevance");
  }

  static async searchByISBN(isbn: string): Promise<BookSearchResponse> {
    return this.searchBooks(`isbn:${isbn}`, 1, 0, "relevance");
  }

  static async getTrendingBooks(
    limit: number = 20
  ): Promise<BookSearchResponse> {
    // Use a simple term to avoid heavy filters that might 500
    return this.searchBooks("fiction", limit, 0, "relevance");
  }

  static async getPopularBooksByGenre(
    genre: string,
    limit: number = 20
  ): Promise<BookSearchResponse> {
    // Use the same subject-focused approach as searchByGenre
    const g = genre.trim();
    const subjectKey = this.slugSubject(g);
    const query = `subject:\"${g}\" OR subject_key:${subjectKey}`;
    return this.searchBooks(query, limit, 0, "relevance");
  }

  static formatBookData(book: OpenLibraryBook) {
    // Extract just the ID part from the key (e.g., "/works/OL15601954W" -> "works/OL15601954W")
    const bookId = book.key.startsWith("/") ? book.key.slice(1) : book.key;

    return {
      id: bookId,
      title: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      authors: book.author_name || [],
      cover: book.cover_i
        ? this.getCoverUrl(book.cover_i)
        : "/placeholder-book.svg",
      publishYear: book.first_publish_year,
      isbn: book.isbn?.[0],
      rating: book.ratings_average,
      reviewCount: book.ratings_count,
      subjects: book.subject?.slice(0, 5) || [],
      publishers: book.publisher || [],
      languages: book.language || [],
      wantToReadCount: book.want_to_read_count,
      currentlyReadingCount: book.currently_reading_count,
      alreadyReadCount: book.already_read_count,
    };
  }
}

// Helper function to debounce search requests
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
