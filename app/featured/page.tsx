"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";

// Dynamic imports for performance
const BookCard = dynamic(
  () =>
    import("../../components/books/BookCard").then((mod) => ({
      default: mod.BookCard,
    })),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
      </div>
    ),
  }
);

interface FeaturedBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  featured_reason: string;
  featured_score: number;
}

// Cache key for localStorage
const FEATURED_BOOKS_CACHE_KEY = "bookhaven_featured_books";
const FEATURED_PAGE_CACHE_KEY = "bookhaven_featured_page";
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache management
const getCachedData = (key: string) => {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error reading from cache:", error);
    return null;
  }
};

const setCachedData = (key: string, data: any) => {
  if (typeof window === "undefined") return;

  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error writing to cache:", error);
  }
};

export default function FeaturedPage() {
  const [books, setBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [initialLoad, setInitialLoad] = useState(true);
  const booksPerPage = 12; // Show 12 books per page (2 pages total for 24 books)

  useEffect(() => {
    // Try to load cached data first
    const cachedBooks = getCachedData(FEATURED_BOOKS_CACHE_KEY);
    const cachedPage = getCachedData(FEATURED_PAGE_CACHE_KEY);

    if (cachedBooks && Array.isArray(cachedBooks) && cachedBooks.length > 0) {
      setBooks(cachedBooks);
      setCurrentPage(cachedPage || 1);
      setInitialLoad(false);
    } else {
      fetchFeaturedBooks();
    }
  }, []);

  // Save page to cache when it changes
  useEffect(() => {
    if (!initialLoad) {
      setCachedData(FEATURED_PAGE_CACHE_KEY, currentPage);
    }
  }, [currentPage, initialLoad]);

  const fetchFeaturedBooks = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/featured?limit=24", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch featured books");
      }

      const result = await response.json();
      const newBooks = result.data || [];

      setBooks(newBooks);
      setCurrentPage(1); // Reset to first page on refresh
      setInitialLoad(false);

      // Cache the new data
      setCachedData(FEATURED_BOOKS_CACHE_KEY, newBooks);
      setCachedData(FEATURED_PAGE_CACHE_KEY, 1);
    } catch (err) {
      console.error("Error fetching featured books:", err);
      setError(err instanceof Error ? err.message : "Unknown error");

      // Fallback to trending books
      try {
        const fallbackResult = await OpenLibraryAPI.getTrendingBooks(24);
        const fallbackBooks = fallbackResult.docs
          .filter((book) => book.cover_i && book.author_name)
          .slice(0, 24)
          .map((book) => ({
            ...book,
            featured_reason: "Popular choice",
            featured_score: 0.7,
          }));

        setBooks(fallbackBooks);
        setInitialLoad(false);

        // Cache fallback data
        setCachedData(FEATURED_BOOKS_CACHE_KEY, fallbackBooks);
        setCachedData(FEATURED_PAGE_CACHE_KEY, 1);
      } catch (fallbackError) {
        console.error("Fallback featured books failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBookForCard = (book: FeaturedBook) => {
    return {
      id: book.key,
      title: book.title,
      author: book.author_name?.[0] || "Unknown Author",
      authors: book.author_name || [],
      cover: book.cover_i
        ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
        : "/placeholder-book.jpg",
      publishYear: book.first_publish_year,
      rating: undefined,
      reviewCount: undefined,
      subjects: book.subject?.slice(0, 3) || [],
      publishers: [],
      languages: [],
      wantToReadCount: undefined,
      currentlyReadingCount: undefined,
      alreadyReadCount: undefined,
    };
  };

  // Pagination logic
  const totalPages = Math.ceil(books.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const currentBooks = books.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-8">
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading featured books...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6 lg:px-8 xl:px-12 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Featured Books
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Handpicked selections from our community - the best books across all
            genres
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Showing {books.length} featured books
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> {error}. Showing fallback recommendations.
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => fetchFeaturedBooks(true)}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Loading..." : "Refresh Featured Books"}
          </button>
        </div>

        {/* Books Grid */}
        {books.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {currentBooks.map((book: FeaturedBook) => (
                <div key={book.key} className="flex flex-col">
                  <Suspense
                    fallback={
                      <div className="animate-pulse">
                        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                      </div>
                    }
                  >
                    <BookCard book={formatBookForCard(book)} />
                  </Suspense>
                  {book.featured_reason && (
                    <div className="mt-2 px-2 py-1 bg-primary-100 dark:bg-primary-900 rounded-full text-xs text-primary-700 dark:text-primary-300 inline-block max-w-fit mx-auto">
                      {book.featured_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => goToPage(i + 1)}
                    className={`px-3 py-2 rounded transition-colors ${
                      currentPage === i + 1
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No featured books available at the moment.
            </p>
            <button
              onClick={() => fetchFeaturedBooks(true)}
              className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
