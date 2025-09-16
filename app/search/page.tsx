"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import { debounce } from "../../lib/openLibrary";

// Dynamic imports for code splitting
const BookCard = dynamic(
  () =>
    import("../../components/books/BookCard").then((mod) => ({
      default: mod.BookCard,
    })),
  {
    loading: () => (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-96"></div>
    ),
    ssr: false,
  }
);

interface SearchFilters {
  author?: string;
  genre?: string;
  publishYear?: { min?: number; max?: number };
  rating?: { min?: number; max?: number };
  language?: string;
}

interface SearchState {
  query: string;
  searchInput: string;
  filters: SearchFilters;
  sortBy: string;
  page: number;
  results?: any;
  allResults?: any[];
}

const SEARCH_STATE_KEY = "bookhaven_search_state";

async function searchBooks(
  query: string,
  filters: SearchFilters,
  sortBy: string = "relevance",
  page: number = 1
) {
  const params = new URLSearchParams();

  if (query) {
    params.append("q", query);
  }

  if (filters.genre) {
    params.append("genre", filters.genre);
  }

  if (filters.author) {
    params.append("author", filters.author);
  }

  if (filters.language) {
    params.append("language", filters.language);
  }

  if (filters.publishYear?.min) {
    params.append("yearMin", filters.publishYear.min.toString());
  }

  if (filters.publishYear?.max) {
    params.append("yearMax", filters.publishYear.max.toString());
  }

  if (sortBy !== "relevance") {
    params.append("sortBy", sortBy);
  }

  params.append("limit", "24");
  params.append("offset", ((page - 1) * 24).toString());

  const response = await fetch(`/api/books/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json();
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialGenre = searchParams.get("genre") || "";

  // Try to restore search state from session storage
  const getInitialState = (): SearchState => {
    if (typeof window !== "undefined") {
      try {
        const savedState = sessionStorage.getItem(SEARCH_STATE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // If we have URL params, they take precedence
          if (initialQuery || initialGenre) {
            return {
              query: initialQuery,
              searchInput: initialQuery,
              filters: { genre: initialGenre || undefined },
              sortBy: "relevance",
              page: 1,
            };
          }
          return parsedState;
        }
      } catch (error) {
        console.error("Failed to parse saved search state:", error);
      }
    }
    return {
      query: initialQuery,
      searchInput: initialQuery,
      filters: { genre: initialGenre || undefined },
      sortBy: "relevance",
      page: 1,
    };
  };

  const [searchState, setSearchState] = useState<SearchState>(getInitialState);
  const [showFilters, setShowFilters] = useState(false);

  const { query, searchInput, filters, sortBy, page } = searchState;

  // Save search state to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(searchState));
      } catch (error) {
        console.error("Failed to save search state:", error);
      }
    }
  }, [searchState]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchQuery: string) => {
        setSearchState((prev) => ({
          ...prev,
          query: searchQuery,
          page: 1,
        }));
      }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["search-books", query, filters, sortBy, page],
    queryFn: () => searchBooks(query, filters, sortBy, page),
    enabled:
      query.length > 0 ||
      !!(filters.genre && filters.genre.length > 0) ||
      !!(filters.author && filters.author.length > 0),
  });

  // Save search results when data changes
  useEffect(() => {
    if (data && (data as any).books) {
      setSearchState((prev) => {
        const newState = {
          ...prev,
          results: data,
          allResults:
            page === 1
              ? (data as any).books
              : [...(prev.allResults || []), ...(data as any).books],
        };
        return newState;
      });
    }
  }, [data, page]);

  const handleSearchInputChange = (value: string) => {
    setSearchState((prev) => ({
      ...prev,
      searchInput: value,
    }));
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setSearchState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1,
    }));
  };

  const handleSortChange = (newSortBy: string) => {
    setSearchState((prev) => ({
      ...prev,
      sortBy: newSortBy,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setSearchState((prev) => ({
      ...prev,
      filters: {},
      sortBy: "relevance",
      page: 1,
    }));
  };

  const loadMoreResults = () => {
    setSearchState((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      filters[key as keyof SearchFilters] !== undefined &&
      filters[key as keyof SearchFilters] !== ""
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Magical Background Elements */}
      <div className="absolute inset-0">
        {/* Magical paper texture overlay */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-15"
          style={{
            backgroundImage: "url(/home/paper-texture.png)",
            backgroundSize: "512px 512px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Small floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-secondary-300 rounded-full opacity-60 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-1 h-1 bg-primary-300 rounded-full opacity-40 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-accent-300 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 bg-secondary-200 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            Search Books
          </h1>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, ISBN, or keyword..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-2 border-primary-300 dark:border-primary-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-lg transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              {/* Sort Dropdown */}
              <div className="flex-shrink-0 relative">
                <ArrowsUpDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer shadow-lg transition-all duration-200 hover:shadow-xl min-w-[160px]"
                >
                  <option value="relevance">Relevance</option>
                  <option value="title_asc">Title A-Z</option>
                  <option value="title_desc">Title Z-A</option>
                  <option value="year_newest">Newest First</option>
                  <option value="year_oldest">Oldest First</option>
                  <option value="rating_highest">Highest Rated</option>
                  <option value="popularity_highest">Most Popular</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn ${
                  hasActiveFilters
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-transparent hover:from-primary-600 hover:to-secondary-600"
                    : "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                } flex items-center space-x-2 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105`}
              >
                <FunnelIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                    {
                      Object.keys(filters).filter(
                        (key) => filters[key as keyof SearchFilters]
                      ).length
                    }
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Filter Results
              </h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium px-3 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  placeholder="Enter author name"
                  value={filters.author || ""}
                  onChange={(e) =>
                    handleFilterChange("author", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>

              {/* Genre Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genre
                </label>
                <select
                  value={filters.genre || ""}
                  onChange={(e) =>
                    handleFilterChange("genre", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="">All genres</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Science Fiction">Science Fiction</option>
                  <option value="Romance">Romance</option>
                  <option value="Mystery">Mystery</option>
                  <option value="Thriller">Thriller</option>
                  <option value="Historical Fiction">Historical Fiction</option>
                  <option value="Young Adult">Young Adult</option>
                  <option value="Biography">Biography</option>
                  <option value="Self-Help">Self-Help</option>
                </select>
              </div>

              {/* Publication Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Publication Year
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="From"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={filters.publishYear?.min || ""}
                    onChange={(e) =>
                      handleFilterChange("publishYear", {
                        ...filters.publishYear,
                        min: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200"
                  />
                  <input
                    type="number"
                    placeholder="To"
                    min="1800"
                    max={new Date().getFullYear()}
                    value={filters.publishYear?.max || ""}
                    onChange={(e) =>
                      handleFilterChange("publishYear", {
                        ...filters.publishYear,
                        max: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={filters.language || ""}
                  onChange={(e) =>
                    handleFilterChange("language", e.target.value || undefined)
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 backdrop-blur-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer transition-all duration-200"
                >
                  <option value="">All languages</option>
                  <option value="eng">English</option>
                  <option value="spa">Spanish</option>
                  <option value="fre">French</option>
                  <option value="ger">German</option>
                  <option value="ita">Italian</option>
                  <option value="por">Portuguese</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          {(query || filters.genre || filters.author) && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {query
                    ? `Search Results for "${query}"`
                    : filters.genre
                    ? `Books in "${filters.genre}"`
                    : `Books by "${filters.author}"`}
                </h2>
                <div className="flex items-center space-x-4 mt-1">
                  {data && (data as any).totalCount !== undefined && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {(data as any).totalCount.toLocaleString()} books found
                    </p>
                  )}
                  {sortBy !== "relevance" && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      • Sorted by{" "}
                      {sortBy === "title_asc"
                        ? "Title A-Z"
                        : sortBy === "title_desc"
                        ? "Title Z-A"
                        : sortBy === "year_newest"
                        ? "Newest First"
                        : sortBy === "year_oldest"
                        ? "Oldest First"
                        : sortBy === "rating_highest"
                        ? "Highest Rated"
                        : sortBy === "popularity_highest"
                        ? "Most Popular"
                        : sortBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {!query && !filters.genre && !filters.author ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Start your search
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a book title, author name, or keyword to find books
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">Failed to search books</div>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : searchState.allResults?.length === 0 ||
            (!searchState.allResults && (data as any)?.books?.length === 0) ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No books found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or filters
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-outline">
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {(searchState.allResults || (data as any)?.books || []).map(
                  (book: any) => (
                    <BookCard key={book.id} book={book} />
                  )
                )}
              </div>

              {/* Pagination */}
              {(searchState.results?.hasMore || (data as any)?.hasMore) && (
                <div className="text-center mt-12">
                  <button onClick={loadMoreResults} className="btn btn-outline">
                    Load More Results
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
