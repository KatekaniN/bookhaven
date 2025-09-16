"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  Bars3BottomLeftIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { BookCard } from "../../components/books/BookCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { Book } from "../../types";
import toast from "react-hot-toast";

// Cache configuration
const CACHE_KEY = "explore_books_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedData {
  books: Book[];
  timestamp: number;
  query: string;
  category: string;
}

// Search categories using OpenLibrary subject queries
const SEARCH_CATEGORIES = [
  { id: "popular", label: "Popular Books", query: "fiction" },
  { id: "mystery", label: "Mystery & Thriller", query: "subject:mystery" },
  { id: "romance", label: "Romance", query: "subject:romance" },
  { id: "fantasy", label: "Fantasy", query: "subject:fantasy" },
  { id: "science", label: "Science Fiction", query: "subject:science_fiction" },
  { id: "fiction", label: "Fiction", query: "subject:fiction" },
  { id: "nonfiction", label: "Non-Fiction", query: "subject:biography" },
  { id: "classics", label: "Classics", query: "subject:classics" },
  { id: "young_adult", label: "Young Adult", query: "subject:young_adult" },
];

// Sort options
const SORT_OPTIONS = [
  { id: "relevance", label: "Most Relevant" },
  { id: "rating", label: "Highest Rated" },
  { id: "title", label: "Title A-Z" },
  { id: "author", label: "Author A-Z" },
  { id: "year", label: "Publication Year" },
];

// Filter options
const FILTER_OPTIONS = {
  minRating: [
    { value: 0, label: "Any Rating" },
    { value: 3, label: "3+ Stars" },
    { value: 4, label: "4+ Stars" },
    { value: 4.5, label: "4.5+ Stars" },
  ],
  publishedAfter: [
    { value: 0, label: "Any Year" },
    { value: 2020, label: "After 2020" },
    { value: 2015, label: "After 2015" },
    { value: 2010, label: "After 2010" },
    { value: 2000, label: "After 2000" },
  ],
};

export default function ExplorePage() {
  const { data: session } = useSession();

  // State management
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("popular");
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minRating: 0,
    publishedAfter: 0,
  });
  const [retryCount, setRetryCount] = useState(0);

  // Cache utilities
  const getCachedData = useCallback((cacheKey: string): CachedData | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);
      const now = Date.now();

      if (now - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  }, []);

  const setCachedData = useCallback((cacheKey: string, data: CachedData) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }, []);

  // Format OpenLibrary data to Book interface with mood detection
  const formatBookData = useCallback((book: any): Book => {
    // Determine mood based on subjects
    let mood = "Educational";
    const subjects = book.subject?.map((s: string) => s.toLowerCase()) || [];

    if (
      subjects.some((s: string) => s.includes("romance") || s.includes("love"))
    ) {
      mood = "Emotional & Deep";
    } else if (
      subjects.some(
        (s: string) =>
          s.includes("mystery") || s.includes("thriller") || s.includes("crime")
      )
    ) {
      mood = "Dark & Mysterious";
    } else if (
      subjects.some((s: string) => s.includes("humor") || s.includes("comedy"))
    ) {
      mood = "Light & Fun";
    } else if (
      subjects.some(
        (s: string) => s.includes("adventure") || s.includes("action")
      )
    ) {
      mood = "Fast-paced & Exciting";
    } else if (
      subjects.some((s: string) => s.includes("fantasy") || s.includes("magic"))
    ) {
      mood = "Cozy & Comfortable";
    }

    return {
      id: book.key || `book_${Math.random()}`,
      title: book.title || "Unknown Title",
      author: book.author_name?.[0] || "Unknown Author",
      authors: book.author_name || ["Unknown Author"],
      cover: book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "/placeholder-book.jpg",
      rating: 3.5 + Math.random() * 1.5, // Generate reasonable ratings
      reviewCount: Math.floor(Math.random() * 1000) + 100,
      subjects: book.subject?.slice(0, 3) || ["Fiction"],
      description: `A ${mood.toLowerCase()} book in the ${
        book.subject?.[0] || "fiction"
      } genre.`,
      publishYear:
        book.first_publish_year || 2000 + Math.floor(Math.random() * 24),
      languages: ["en"],
      openLibraryKey: book.key || "",
      isbn: undefined,
      publisher: undefined,
      pages: Math.floor(Math.random() * 400) + 100,
    };
  }, []);

  // Fetch books with robust error handling
  const fetchBooks = useCallback(
    async (category: string, searchTerm?: string) => {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `${CACHE_KEY}_${category}_${searchTerm || ""}`;
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        console.log("Using cached data for", category);
        setBooks(cachedData.books);
        setLoading(false);
        return;
      }

      try {
        const categoryConfig = SEARCH_CATEGORIES.find((c) => c.id === category);
        const query = searchTerm || categoryConfig?.query || "fiction";

        console.log(`Fetching books for: ${query}`);

        // Try primary search
        let result;
        try {
          result = await OpenLibraryAPI.searchBooks(query, 50, 0, "relevance");
        } catch (primaryError) {
          console.warn("Primary search failed, trying fallback:", primaryError);

          // Fallback to simpler query
          const fallbackQuery = query.split(" ")[0] || "fiction";
          result = await OpenLibraryAPI.searchBooks(
            fallbackQuery,
            30,
            0,
            "relevance"
          );
        }

        if (!result || !result.docs || result.docs.length === 0) {
          throw new Error("No books found");
        }

        // Format and filter valid books
        const formattedBooks = result.docs
          .filter((book: any) => book.title && book.author_name?.[0])
          .map(formatBookData)
          .filter((book: Book) => book.title !== "Unknown Title");

        if (formattedBooks.length === 0) {
          throw new Error("No valid books found in results");
        }

        setBooks(formattedBooks);

        // Cache the results
        setCachedData(cacheKey, {
          books: formattedBooks,
          timestamp: Date.now(),
          query,
          category,
        });

        setRetryCount(0);
        toast.success(`Found ${formattedBooks.length} books!`);
      } catch (error: any) {
        console.error("Error fetching books:", error);
        setError(error.message || "Failed to fetch books");

        // Retry logic for API failures
        if (retryCount < 2) {
          console.log(`Retrying... (attempt ${retryCount + 1})`);
          setRetryCount((prev) => prev + 1);
          setTimeout(() => fetchBooks(category, searchTerm), 2000);
        } else {
          toast.error("Failed to load books. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData, formatBookData, retryCount]
  );

  // Apply filters and sorting
  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...books];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.subjects.some((subject) => subject.toLowerCase().includes(query))
      );
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      filtered = filtered.filter(
        (book) => (book.rating || 0) >= filters.minRating
      );
    }

    // Apply year filter
    if (filters.publishedAfter > 0) {
      filtered = filtered.filter(
        (book) => (book.publishYear || 0) >= filters.publishedAfter
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "year":
        filtered.sort((a, b) => (b.publishYear || 0) - (a.publishYear || 0));
        break;
      default:
        // Keep relevance order from API
        break;
    }

    setFilteredBooks(filtered);
  }, [books, searchQuery, filters, sortBy]);

  // Handle search
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        fetchBooks(selectedCategory, searchQuery.trim());
      }
    },
    [searchQuery, selectedCategory, fetchBooks]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setSelectedCategory(categoryId);
      setSearchQuery("");
      setRetryCount(0);
      fetchBooks(categoryId);
    },
    [fetchBooks]
  );

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    // Clear cache for current category
    const cacheKey = `${CACHE_KEY}_${selectedCategory}_${searchQuery || ""}`;
    localStorage.removeItem(cacheKey);
    setRetryCount(0);
    fetchBooks(selectedCategory, searchQuery || undefined);
  }, [selectedCategory, searchQuery, fetchBooks]);

  // Initial load
  useEffect(() => {
    fetchBooks(selectedCategory);
  }, [selectedCategory, fetchBooks]);

  // Apply filters when they change
  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

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

        {/* Floating magical elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-32 right-20 w-24 h-24 bg-secondary-200/30 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-40 h-40 bg-accent-200/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

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

        {/* Soft light rays */}
        <div className="absolute top-0 left-1/4 w-px h-64 bg-gradient-to-b from-secondary-200/20 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-48 bg-gradient-to-b from-primary-200/15 to-transparent transform -rotate-6"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent mb-4">
            Explore Books
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover amazing books from our curated collection. Search, filter,
            and sort to find your next great read.
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search books, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-32 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              >
                Search
              </button>
            </div>
          </form>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SEARCH_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category.id
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Sort and Filter Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  showFilters
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
              </button>
            </div>

            {/* Refresh Button and Results Count */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredBooks.length} book
                {filteredBooks.length !== 1 ? "s" : ""} found
              </span>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minRating: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {FILTER_OPTIONS.minRating.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Published After
                  </label>
                  <select
                    value={filters.publishedAfter}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        publishedAfter: Number(e.target.value),
                      })
                    }
                    className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {FILTER_OPTIONS.publishedAfter.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() =>
                    setFilters({ minRating: 0, publishedAfter: 0 })
                  }
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                {retryCount > 0
                  ? `Retrying... (${retryCount + 1}/3)`
                  : "Loading amazing books..."}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex justify-center py-16">
            <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border border-red-200 dark:border-red-800">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Unable to Load Books
              </h3>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRefresh}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                No Books Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search terms or filters
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Clear Search
                </button>
                <button
                  onClick={() =>
                    setFilters({ minRating: 0, publishedAfter: 0 })
                  }
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
