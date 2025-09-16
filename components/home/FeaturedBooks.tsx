"use client";

import { useState, useEffect, useCallback } from "react";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useDailyRefresh } from "../../lib/dailyRefresh";

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

// Cache configuration
const CACHE_KEY = "featured_books_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for fresher content

async function fetchFeaturedBooks(
  forceRefresh = false
): Promise<FeaturedBook[]> {
  // Check cache first (unless forcing refresh)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_DURATION) {
          console.log("⭐ FeaturedBooks: Cache hit - using stored data");
          return data;
        } else {
          console.log("⭐ FeaturedBooks: Cache expired - fetching fresh data");
        }
      }
    } catch (error) {
      console.warn("Failed to read featured books cache:", error);
    }
  } else {
    console.log("⭐ FeaturedBooks: Force refresh - fetching fresh data");
  }

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
    const freshData: FeaturedBook[] = result.data || [];

    // Cache the results
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data: freshData,
        timestamp: Date.now(),
      })
    );

    console.log("⭐ FeaturedBooks: Fresh data cached successfully");
    return freshData;
  } catch (error) {
    console.error("Error fetching featured books:", error);
    // No fallback; surface error to UI
    throw error;
  }
}

const normalizeId = (key: string) =>
  key?.startsWith("/")
    ? key.slice(1)
    : key || Math.random().toString(36).slice(2);
const formatBookForCard = (book: FeaturedBook) => {
  // Normalize key to id without a leading slash for correct routing
  const id = normalizeId(book.key);
  return {
    id,
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
    "Popular in bestseller": "Book Haven Gem",
    "Popular in fiction": "Enchanted Pick",
    "Popular in science fiction": "Starlit Tale",
    "Popular in fantasy": "Magical Read",
    "Popular in mystery": "Whimsical Mystery",
    "Popular in romance": "Heartfelt Story",
    "Popular in horror": "Spooky Favorite",
    "Popular in biography": "Inspiring Life",
    "Popular in history": "Timeless Journey",
    "Popular choice": "Community Favorite",
    "Staff pick": "Librarian's Choice",
    "New release": "Fresh Arrival",
    "Award winner": "Celebrated Work",
    "Trending now": "Buzzing Read",
    "Editor's choice": "Curator's Pick",
    "Reader favorite": "Beloved Book",
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
  const [books, setBooks] = useState<FeaturedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { checkAndRefresh, getDailyRandomOffset } = useDailyRefresh();

  const loadFeaturedBooks = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        // Check for daily refresh
        const refreshedToday = checkAndRefresh();
        const shouldForceRefresh = forceRefresh || refreshedToday;

        const data = await fetchFeaturedBooks(shouldForceRefresh);
        setBooks(data);

        // Get timestamp from cache or use current time
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            setLastRefreshTime(new Date(timestamp));
          } else {
            setLastRefreshTime(new Date());
          }
        } catch {
          setLastRefreshTime(new Date());
        }
      } catch (err) {
        console.error("Error loading featured books:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load featured books"
        );
      } finally {
        setLoading(false);
      }
    },
    [checkAndRefresh]
  );

  // Get initial timestamp from cache for auto-refresh synchronization
  const getInitialTimestamp = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        return timestamp;
      }
    } catch (error) {
      console.warn("Failed to get initial timestamp from cache:", error);
    }
    return undefined;
  };

  // Auto-refresh hook - refreshes every 30 minutes
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 30 * 60 * 1000, // 30 minutes for fresher content
    enabled: true,
    onRefresh: () => loadFeaturedBooks(true),
    initialTimestamp: getInitialTimestamp(),
  });

  useEffect(() => {
    loadFeaturedBooks();
  }, [loadFeaturedBooks]);

  if (loading) {
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
              <span>Auto-refresh in {getFormattedTimeUntilNext()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadFeaturedBooks(true)}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 border border-primary-200 dark:border-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Refreshing..." : "Refresh"}
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
          <div
            key={`${book.key}-${book.featured_reason ?? ""}`}
            className="flex flex-col items-center"
          >
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
