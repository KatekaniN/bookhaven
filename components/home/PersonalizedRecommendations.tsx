"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";

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

  useEffect(() => {
    if (session?.user?.email) {
      fetchRecommendations();
    }
  }, [session, limit]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recommendations?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const result = await response.json();
      setRecommendations(result.data || []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err instanceof Error ? err.message : "Unknown error");

      // Fallback to generic recommendations
      try {
        const fallbackBooks = await OpenLibraryAPI.getTrendingBooks(limit);
        const formattedBooks = fallbackBooks.docs.map((book) => ({
          ...book,
          recommendation_score: 0.5,
          recommendation_reason: "Popular book",
        }));
        setRecommendations(formattedBooks);
      } catch (fallbackError) {
        console.error("Fallback recommendations failed:", fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatBookForCard = (book: RecommendedBook) => {
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

  if (status === "loading") {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to see personalized recommendations
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Finding books you'll love...
          </span>
        </div>
      </div>
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Unable to load recommendations: {error}
          </p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No recommendations available yet.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Complete your onboarding to get personalized book recommendations!
          </p>
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
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Books curated based on your preferences
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recommendations.map((book) => (
          <div key={book.key} className="relative">
            <BookCard book={formatBookForCard(book)} />
            {book.recommendation_reason && (
              <div className="mt-2 px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded text-xs text-purple-700 dark:text-purple-300">
                {book.recommendation_reason}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Note:</strong> Showing fallback recommendations due to:{" "}
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
