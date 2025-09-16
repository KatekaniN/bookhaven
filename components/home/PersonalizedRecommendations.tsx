"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ClockIcon } from "@heroicons/react/24/outline";

interface RecommendedBook {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  recommendation_score: number;
  recommendation_reason: string;
}

// Cache configuration
const CACHE_KEY = "personalized_recommendations_cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface PersonalizedRecommendationsProps {
  limit?: number;
  className?: string;
}

export function PersonalizedRecommendations({
  limit = 8,
  className = "",
}: PersonalizedRecommendationsProps) {
  const { data: session, status } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const fetchRecommendations = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first (unless forcing refresh)
        if (!forceRefresh) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Treat empty cached data as invalid to avoid showing "no recommendations" indefinitely
            const cacheIsFresh = Date.now() - timestamp < CACHE_DURATION;
            if (cacheIsFresh && Array.isArray(data) && data.length > 0) {
              console.log(
                "📖 PersonalizedRecommendations: Cache hit - using stored data"
              );
              setRecommendations(data);
              setLastRefreshTime(new Date(timestamp));
              setLoading(false);
              return;
            } else {
              console.log(
                "📖 PersonalizedRecommendations: Cache expired - fetching fresh data"
              );
              // If cache was empty, force a fresh pull
            }
          }
        } else {
          console.log(
            "📖 PersonalizedRecommendations: Force refresh - fetching fresh data"
          );
        }

        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(forceRefresh && {
            refresh: "true",
            timestamp: Date.now().toString(),
          }),
        });

        const response = await fetch(`/api/recommendations?${params}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.NODE_ENV === "development" && session?.user?.email
              ? { "x-user-email": session.user.email }
              : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const result = await response.json();
        const freshData = result.data || [];
        const currentTime = Date.now();

        if (freshData.length === 0) {
          // No fallback: honor server response for live-only data
          setRecommendations([]);
          setLastRefreshTime(new Date(currentTime));
          // Clear cache to avoid persisting empty results for long
          localStorage.removeItem(CACHE_KEY);
        } else {
          setRecommendations(freshData);
          setLastRefreshTime(new Date(currentTime));
          // Cache the results
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              data: freshData,
              timestamp: currentTime,
            })
          );

          console.log(
            "📖 PersonalizedRecommendations: Fresh data cached successfully"
          );
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError(err instanceof Error ? err.message : "Unknown error");

        // No fallback: keep UI empty to reflect lack of live data
      } finally {
        setLoading(false);
      }
    },
    [limit, session?.user?.email]
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

  // Auto-refresh hook - refreshes every hour
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 60 * 60 * 1000, // 1 hour
    enabled: !!session?.user?.email,
    onRefresh: () => fetchRecommendations(true),
    initialTimestamp: getInitialTimestamp(),
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchRecommendations();
    }
  }, [session, limit, fetchRecommendations]);

  const normalizeId = (key: string) =>
    key?.startsWith("/")
      ? key.slice(1)
      : key || Math.random().toString(36).slice(2);
  const formatBookForCard = (book: RecommendedBook) => {
    return {
      id: normalizeId(book.key),
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

  const shortenRecommendationReason = (reason: string): string => {
    // Create shorter, more concise versions of common recommendation reasons
    const shortenMap: { [key: string]: string } = {
      "Based on your interest in fiction": "Fiction pick",
      "Based on your interest in science fiction": "Sci-fi pick",
      "Based on your interest in fantasy": "Fantasy pick",
      "Based on your interest in mystery": "Mystery pick",
      "Based on your interest in romance": "Romance pick",
      "Based on your interest in horror": "Horror pick",
      "Based on your interest in biography": "Biography",
      "Based on your interest in history": "History pick",
      "Based on your interest in science": "Science pick",
      "Because you liked": "Similar read",
      "Popular book": "Trending",
      "Highly rated": "Top rated",
      "New release": "New",
      "Award winner": "Award winner",
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
    if (reason.length > 15) {
      // Try to find a good breaking point
      const words = reason.split(" ");
      if (words.length > 2) {
        return words.slice(0, 2).join(" ");
      }
      return reason.substring(0, 12) + "...";
    }

    return reason;
  };

  if (status === "loading") {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400">
              Sign in to see personalized recommendations
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <LoadingSpinner />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Finding books you&apos;ll love...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-lg">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Unable to load recommendations: {error}
            </p>
            <button
              onClick={() => fetchRecommendations()}
              className="px-6 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No recommendations available yet.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Complete your onboarding to get personalized book recommendations!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommended for You
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              Books curated based on your preferences
            </p>
            {lastRefreshTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <ClockIcon className="h-3 w-3" />
                <span>Next refresh in {getFormattedTimeUntilNext()}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={manualRefresh}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 border border-primary-200 dark:border-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendations.map((book) => (
          <div
            key={`${book.key}-${book.recommendation_reason ?? ""}`}
            className="relative flex flex-col items-center"
          >
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 overflow-hidden">
              <BookCard book={formatBookForCard(book)} />
            </div>
            {book.recommendation_reason && (
              <div className="mt-3 w-40">
                {" "}
                {/* Match default BookCard width */}
                <div className="py-1.5 px-2 bg-gradient-to-t from-primary-500 to-primary-700 text-white rounded-full text-xs font-medium shadow-md overflow-hidden text-ellipsis whitespace-nowrap w-full text-center hover:from-primary-600 hover:to-primary-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
                  {shortenRecommendationReason(book.recommendation_reason)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-yellow-50/80 dark:bg-yellow-900/20 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/50 rounded-lg shadow-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Note:</strong> Showing fallback recommendations due to:{" "}
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
