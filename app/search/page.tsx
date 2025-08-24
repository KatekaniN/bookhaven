"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BookCard } from "../../components/books/BookCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { debounce } from "../../lib/openLibrary";

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
  page: number;
  results?: any;
  allResults?: any[];
}

const SEARCH_STATE_KEY = "bookhaven_search_state";

async function searchBooks(
  query: string,
  filters: SearchFilters,
  page: number = 1
) {
  const response = await fetch(
    `/api/books/search?q=${encodeURIComponent(query)}&limit=20&offset=${
      (page - 1) * 20
    }`
  );

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
      page: 1,
    };
  };

  const [searchState, setSearchState] = useState<SearchState>(getInitialState);
  const [showFilters, setShowFilters] = useState(false);

  const { query, searchInput, filters, page } = searchState;

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
    queryKey: ["search-books", query, filters, page],
    queryFn: () => searchBooks(query, filters, page),
    enabled: query.length > 0,
  });

  // Save search results when data changes
  useEffect(() => {
    if (data) {
      setSearchState((prev) => {
        const newState = {
          ...prev,
          results: data,
          allResults:
            page === 1
              ? data.books
              : [...(prev.allResults || []), ...data.books],
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

  const clearFilters = () => {
    setSearchState((prev) => ({
      ...prev,
      filters: {},
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Search Books
        </h1>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or keyword..."
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${
              hasActiveFilters ? "btn-primary" : "btn-outline"
            } flex items-center space-x-2`}
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-white dark:bg-gray-800 text-primary-500 dark:text-primary-400 rounded-full w-5 h-5 text-xs flex items-center justify-center">
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

      {/* Filters Panel */}
      {showFilters && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filter Results
            </h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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
                className="input"
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
                className="input"
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
                  className="input text-sm"
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
                  className="input text-sm"
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
                className="input"
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
        {query && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Search Results for "{query}"
              </h2>
              {data && (
                <p className="text-gray-600 dark:text-gray-400">
                  {data.totalCount.toLocaleString()} books found
                </p>
              )}
            </div>
          </div>
        )}

        {!query ? (
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
          (!searchState.allResults && data?.books.length === 0) ? (
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
              {(searchState.allResults || data?.books || []).map(
                (book: any) => (
                  <BookCard key={book.id} book={book} />
                )
              )}
            </div>

            {/* Pagination */}
            {(searchState.results?.hasMore || data?.hasMore) && (
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
  );
}
