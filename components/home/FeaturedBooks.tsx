"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ClockIcon } from "@heroicons/react/24/outline";

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

async function fetchFeaturedBooks(): Promise<FeaturedBook[]> {
  try {
    const response = await fetch("/api/featured?limit=4", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch featured books");
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching featured books:", error);

    // Fallback to trending books from OpenLibrary
    try {
      const fallbackResult = await OpenLibraryAPI.getTrendingBooks(4);
      return fallbackResult.docs
        .filter((book) => book.cover_i && book.author_name)
        .slice(0, 4)
        .map((book) => ({
          ...book,
          featured_reason: "Popular choice",
          featured_score: 0.7,
        }));
    } catch (fallbackError) {
      console.error("Fallback featured books failed:", fallbackError);
      throw fallbackError;
    }
  }
}

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

const shortenFeaturedReason = (reason: string): string => {
  // Create shorter, more concise versions of common featured reasons
  const shortenMap: { [key: string]: string } = {
    "Popular in bestseller": "Bestseller",
    "Popular in fiction": "Popular",
    "Popular in science fiction": "Sci-fi hit",
    "Popular in fantasy": "Fantasy hit",
    "Popular in mystery": "Mystery hit",
    "Popular in romance": "Romance hit",
    "Popular in horror": "Horror pick",
    "Popular in biography": "Biography",
    "Popular in history": "History",
    "Popular choice": "Popular",
    "Staff pick": "Staff pick",
    "New release": "New",
    "Award winner": "Award winner",
    "Trending now": "Trending",
    "Editor's choice": "Editor pick",
    "Reader favorite": "Reader fav",
  };

  // Check for exact matches first
  if (shortenMap[reason]) {
    return shortenMap[reason];
  }

  // Handle pattern matches
  for (const [pattern, replacement] of Object.entries(shortenMap)) {
    if (reason.toLowerCase().includes(pattern.toLowerCase())) {
      return replacement;
    }
  }

  // If reason is too long, truncate intelligently
  if (reason.length > 12) {
    // Try to find a good breaking point
    const words = reason.split(" ");
    if (words.length > 1) {
      return words[0];
    }
    return reason.substring(0, 10) + "...";
  }

  return reason;
};

export function FeaturedBooks() {
  const queryClient = useQueryClient();

  const {
    data: books,
    isLoading,
    error,
    refetch,
  } = useQuery<FeaturedBook[]>({
    queryKey: ["featured-books"],
    queryFn: fetchFeaturedBooks,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (renamed from cacheTime)
  });

  // Auto-refresh hook - refreshes every hour
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 60 * 60 * 1000, // 1 hour
    enabled: true,
    onRefresh: async () => {
      // Invalidate and refetch featured books
      await queryClient.invalidateQueries({ queryKey: ["featured-books"] });
      await refetch();
    },
  });

  if (isLoading) {
    return (
      <section>
        <div className="flex justify-center py-12">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="text-center py-12">
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-lg">
            <p className="text-red-600 dark:text-red-400 font-medium">
              Failed to load featured books. Please try again later.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Featured Books
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-gray-600 dark:text-gray-300">
              Handpicked selections from our community
            </p>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
              <ClockIcon className="h-3 w-3" />
              <span>Refreshes in {getFormattedTimeUntilNext()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={manualRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 border border-primary-200 dark:border-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <a
            href="/featured"
            className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 border border-primary-200 dark:border-primary-800"
          >
            View all →
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {books?.map((book: FeaturedBook) => (
          <div key={book.key} className="flex flex-col items-center">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 overflow-hidden">
              <BookCard book={formatBookForCard(book)} />
            </div>
            {book.featured_reason && (
              <div className="mt-3 w-40">
                {" "}
                {/* Match BookCard width */}
                <div className="px-3 py-1.5 bg-gradient-to-t from-primary-500 to-primary-700 text-white rounded-full text-xs font-medium shadow-md text-center overflow-hidden text-ellipsis whitespace-nowrap hover:from-primary-600 hover:to-primary-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  {shortenFeaturedReason(book.featured_reason)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
