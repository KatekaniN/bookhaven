const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const COVERS_BASE_URL = "https://covers.openlibrary.org/b";

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
  static async searchBooks(
    query: string,
    limit: number = 20,
    offset: number = 0,
    sortBy: string = "relevance"
  ): Promise<BookSearchResponse> {
    const searchParams = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
      fields:
        "key,title,author_name,first_publish_year,isbn,cover_i,publisher,language,subject,ratings_average,ratings_count,want_to_read_count,currently_reading_count,already_read_count",
    });

    // Add sort parameter if not relevance
    if (sortBy !== "relevance") {
      const sortMap: { [key: string]: string } = {
        title_asc: "title asc",
        title_desc: "title desc",
        year_newest: "new",
        year_oldest: "old",
        rating_highest: "rating desc",
        popularity_highest: "want_to_read_count desc",
      };

      const sortValue = sortMap[sortBy];
      if (sortValue) {
        searchParams.append("sort", sortValue);
      }
    }

    const response = await fetch(
      `${OPEN_LIBRARY_BASE_URL}/search.json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
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
    return this.searchBooks(`subject:"${genre}"`, limit, offset, "relevance");
  }

  static async searchByAuthor(
    author: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<BookSearchResponse> {
    return this.searchBooks(`author:"${author}"`, limit, offset, "relevance");
  }

  static async searchByISBN(isbn: string): Promise<BookSearchResponse> {
    return this.searchBooks(`isbn:${isbn}`, 1, 0, "relevance");
  }

  static async getTrendingBooks(
    limit: number = 20
  ): Promise<BookSearchResponse> {
    // Use a search for popular books (this is a simplified approach)
    return this.searchBooks("*", limit, 0, "popularity_highest");
  }

  static async getPopularBooksByGenre(
    genre: string,
    limit: number = 20
  ): Promise<BookSearchResponse> {
    // Search for popular books in genre, sorted by want-to-read count
    const searchParams = new URLSearchParams({
      q: `subject:"${genre}" AND has_fulltext:true`,
      limit: limit.toString(),
      offset: "0",
      sort: "want_to_read_count desc",
      fields:
        "key,title,author_name,first_publish_year,isbn,cover_i,publisher,language,subject,ratings_average,ratings_count,want_to_read_count,currently_reading_count,already_read_count,edition_count",
    });

    const response = await fetch(
      `${OPEN_LIBRARY_BASE_URL}/search.json?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    return response.json();
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
