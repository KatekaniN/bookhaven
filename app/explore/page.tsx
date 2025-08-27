"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BookCard } from "../../components/books/BookCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAppStore } from "../../stores/useAppStore";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { useUserPreferences, UserData } from "../../hooks/useUserPreferences";
import { useSession } from "next-auth/react";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  FunnelIcon,
  ClockIcon,
  Bars3BottomLeftIcon,
  XMarkIcon,
  HomeIcon,
  BoltIcon,
  HeartIcon,
  SunIcon,
  MoonIcon,
  BookOpenIcon,
  RocketLaunchIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  CursorArrowRaysIcon,
  StarIcon,
  CalendarIcon,
  LanguageIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  likelihoodScore: number; // 0-100 percentage likelihood user will like this book
  reviewCount: number;
  subjects: string[];
  mood: string;
  description: string;
  publishYear?: number;
}

const genres = [
  "Fantasy",
  "Romance",
  "Mystery",
  "Science Fiction",
  "Thriller",
  "Historical Fiction",
  "Young Adult",
  "Contemporary",
  "Horror",
  "Biography",
  "Self-Help",
  "Business",
  "Philosophy",
  "Poetry",
  "LGBTQ+",
  "Adventure",
  "Crime",
  "Comedy",
];

const moods = [
  {
    name: "Cozy & Comfortable",
    icon: HomeIcon,
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    description: "Perfect for quiet evenings",
  },
  {
    name: "Fast-paced & Exciting",
    icon: RocketLaunchIcon,
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    description: "Action-packed adventures",
  },
  {
    name: "Emotional & Deep",
    icon: HeartIcon,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    description: "Thought-provoking reads",
  },
  {
    name: "Light & Fun",
    icon: SunIcon,
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    description: "Easy, enjoyable reads",
  },
  {
    name: "Dark & Mysterious",
    icon: MoonIcon,
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    description: "Intriguing mysteries",
  },
  {
    name: "Educational",
    icon: AcademicCapIcon,
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    description: "Learn something new",
  },
];

const sortOptions = [
  { value: "relevance", label: "Most Relevant", icon: CursorArrowRaysIcon },
  { value: "rating", label: "Best Match", icon: StarIcon },
  { value: "new", label: "Newest First", icon: CalendarIcon },
  { value: "old", label: "Oldest First", icon: BookOpenIcon },
  { value: "title", label: "Title A-Z", icon: LanguageIcon },
];

// Enhanced fetch function combining both search and discovery
const fetchBooks = async (
  searchQuery: string = "",
  selectedGenres: string[] = [],
  selectedMood: string = "",
  sortBy: string = "relevance",
  page: number = 1,
  limit: number = 24,
  calculateLikelihood?: (book: any, subjects: string[], mood: string) => number
): Promise<Book[]> => {
  try {
    const allBooks: Book[] = [];

    if (searchQuery.trim()) {
      // Search mode - use search API
      const searchResult = await OpenLibraryAPI.searchBooks(
        searchQuery,
        limit,
        (page - 1) * limit,
        sortBy
      );
      if (searchResult.docs) {
        const searchBooks = searchResult.docs
          .filter((book) => book.cover_i && book.author_name?.[0] && book.title)
          .map((book) => formatBookData(book, calculateLikelihood));
        allBooks.push(...searchBooks);
      }
    } else {
      // Discovery mode - fetch from multiple sources
      const searchTerms =
        selectedGenres.length > 0
          ? selectedGenres
          : [
              "fiction",
              "mystery",
              "romance",
              "science fiction",
              "fantasy",
              "biography",
            ];

      const bookPromises = searchTerms.slice(0, 4).map(async (term) => {
        const result = await OpenLibraryAPI.searchBooks(
          term,
          Math.ceil(limit / 4),
          Math.floor(Math.random() * 20),
          sortBy
        );
        return (
          result.docs?.filter(
            (book) => book.cover_i && book.author_name?.[0] && book.title
          ) || []
        );
      });

      const results = await Promise.all(bookPromises);
      const discoveryBooks = results
        .flat()
        .map((book) => formatBookData(book, calculateLikelihood));
      allBooks.push(...discoveryBooks);
    }

    // Apply mood filter
    let filteredBooks = allBooks;
    if (selectedMood) {
      filteredBooks = allBooks.filter((book) => book.mood === selectedMood);
    }

    // Apply genre filter (for discovery mode)
    if (selectedGenres.length > 0 && !searchQuery.trim()) {
      filteredBooks = filteredBooks.filter((book) =>
        selectedGenres.some((genre) =>
          book.subjects.some((subject) =>
            subject.toLowerCase().includes(genre.toLowerCase())
          )
        )
      );
    }

    // Remove duplicates and apply sorting
    const uniqueBooks = filteredBooks.filter(
      (book, index, self) =>
        index ===
        self.findIndex(
          (b) => b.title === book.title && b.author === book.author
        )
    );

    // Apply client-side sorting
    uniqueBooks.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.likelihoodScore || 0) - (a.likelihoodScore || 0);
        case "new":
          // Sort by publication year (newer first)
          return (b.publishYear || 0) - (a.publishYear || 0);
        case "old":
          // Sort by publication year (older first)
          return (a.publishYear || 0) - (b.publishYear || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "relevance":
        default:
          // Keep original order for relevance (API already sorted by relevance)
          return 0;
      }
    });

    return uniqueBooks.slice(0, limit);
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

const formatBookData = (
  book: any,
  calculateLikelihood?: (book: any, subjects: string[], mood: string) => number
): Book => {
  const primarySubject = book.subject?.[0] || "Fiction";

  // Enhanced mood detection
  let mood = "Educational";
  const subjects = book.subject?.map((s: string) => s.toLowerCase()) || [];

  if (
    subjects.some((s: string) => s.includes("romance") || s.includes("love"))
  ) {
    mood = "Emotional & Deep";
  } else if (
    subjects.some(
      (s: string) =>
        s.includes("thriller") || s.includes("mystery") || s.includes("crime")
    )
  ) {
    mood = "Dark & Mysterious";
  } else if (
    subjects.some(
      (s: string) =>
        s.includes("comedy") || s.includes("humor") || s.includes("funny")
    )
  ) {
    mood = "Light & Fun";
  } else if (
    subjects.some(
      (s: string) =>
        s.includes("science") || s.includes("adventure") || s.includes("action")
    )
  ) {
    mood = "Fast-paced & Exciting";
  } else if (
    subjects.some(
      (s: string) =>
        s.includes("fantasy") || s.includes("cozy") || s.includes("comfort")
    )
  ) {
    mood = "Cozy & Comfortable";
  }

  const bookSubjects = book.subject?.slice(0, 3) || [primarySubject];

  return {
    id: book.key || `book_${Math.random()}`,
    title: book.title || "Unknown Title",
    author: book.author_name?.[0] || "Unknown Author",
    cover: book.cover_i
      ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
      : "/placeholder-book.jpg",
    likelihoodScore: calculateLikelihood
      ? calculateLikelihood(book, bookSubjects, mood)
      : Math.floor(Math.random() * 35) + 60,
    reviewCount: Math.floor(Math.random() * 50000) + 1000,
    subjects: bookSubjects,
    mood,
    description:
      book.first_sentence?.[0] || `An engaging ${mood.toLowerCase()} book.`,
    publishYear:
      book.first_publish_year ||
      book.publish_year?.[0] ||
      2000 + Math.floor(Math.random() * 24), // Use actual year or generate reasonable fallback
  };
};

export default function SearchDiscoverPage() {
  const searchParams = useSearchParams();
  const { addUserBook, clearOldDiscoverBooks } = useAppStore();
  const { data: session } = useSession();
  const { userData } = useUserPreferences();

  // State management
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedSort, setSelectedSort] = useState("relevance");
  const [isLoading, setIsLoading] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(!!searchParams?.get("q"));

  const booksPerPage = 24;

  // Calculate likelihood score based on user preferences
  const calculateLikelihoodScore = (
    book: any,
    bookSubjects: string[],
    mood: string
  ): number => {
    if (!userData) {
      // If no user data, return random score between 60-95
      return Math.floor(Math.random() * 35) + 60;
    }

    let score = 50; // Base score

    // Genre/Subject matching (40% weight)
    const userGenres = userData.preferences?.genres || [];
    const genreMatches = bookSubjects.filter((subject) =>
      userGenres.some(
        (userGenre) =>
          subject.toLowerCase().includes(userGenre.toLowerCase()) ||
          userGenre.toLowerCase().includes(subject.toLowerCase())
      )
    ).length;

    if (genreMatches > 0) {
      score += Math.min(genreMatches * 10, 40); // Max 40 points for genres
    }

    // Author preference (20% weight)
    const userAuthorRatings = userData.ratings?.authors || [];
    const authorMatch = userAuthorRatings.find(
      (a) =>
        a.name
          .toLowerCase()
          .includes(book.author_name?.[0]?.toLowerCase() || "") ||
        (book.author_name?.[0]?.toLowerCase() || "").includes(
          a.name.toLowerCase()
        )
    );
    if (authorMatch) {
      score += (authorMatch.rating - 3) * 10; // Convert 1-5 rating to -20 to +20 points
    }

    // Book rating history (20% weight)
    const userBookRatings = userData.ratings?.books || [];
    if (userBookRatings.length > 0) {
      const avgUserRating =
        userBookRatings.reduce((sum, book) => sum + book.rating, 0) /
        userBookRatings.length;
      const ratingBonus = (avgUserRating - 3) * 5; // Convert average to bonus/penalty
      score += ratingBonus;
    }

    // Topic/Interest matching (10% weight)
    const userTopics = userData.preferences?.topics || [];
    const topicMatches = userTopics.filter(
      (topic) =>
        bookSubjects.some((subject) =>
          subject.toLowerCase().includes(topic.toLowerCase())
        ) || mood.toLowerCase().includes(topic.toLowerCase())
    ).length;

    if (topicMatches > 0) {
      score += Math.min(topicMatches * 5, 10); // Max 10 points for topics
    }

    // Publication year preference (10% weight)
    const currentYear = new Date().getFullYear();
    const bookYear = book.first_publish_year || book.publish_year?.[0];
    if (bookYear) {
      const yearDiff = currentYear - bookYear;
      if (yearDiff <= 5) score += 10; // Recent books get bonus
      else if (yearDiff <= 10) score += 5;
      else if (yearDiff > 50) score += 5; // Classic books get small bonus
    }

    // Ensure score stays within 0-100 range
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  // Auto-refresh for discovery mode
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 60 * 60 * 1000,
    enabled: !isSearchMode,
    onRefresh: () => loadBooks(true),
  });

  // Load books function
  const loadBooks = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      if (forceRefresh) clearOldDiscoverBooks();

      const books = await fetchBooks(
        searchQuery,
        selectedGenres,
        selectedMood,
        selectedSort,
        1,
        booksPerPage * 2, // Load more initially
        calculateLikelihoodScore
      );

      setAllBooks(books);
      setDisplayedBooks(books.slice(0, booksPerPage));
      setCurrentPage(1);
      setLastRefreshTime(new Date());

      if (books.length > 0) {
        toast.success(`Found ${books.length} books!`);
      }
    } catch (error) {
      console.error("Failed to load books:", error);
      toast.error("Failed to load books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Search handler
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const isEnteringSearchMode = !!searchQuery.trim();
    const wasInSearchMode = isSearchMode;

    setIsSearchMode(isEnteringSearchMode);

    // Auto-adjust sort based on search mode
    if (isEnteringSearchMode && !wasInSearchMode) {
      // Entering search mode - default to newest first
      setSelectedSort("new");
    } else if (!isEnteringSearchMode && wasInSearchMode) {
      // Exiting search mode - reset to relevance
      setSelectedSort("relevance");
    }

    await loadBooks();
  };

  // Filter handlers
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const newGenres = prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre];
      return newGenres;
    });
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood((prev) => (prev === mood ? "" : mood));
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedMood("");
    setSelectedSort("relevance");
    setSearchQuery("");
    setIsSearchMode(false);
  };

  const loadMoreBooks = () => {
    const nextPage = currentPage + 1;
    const startIndex = currentPage * booksPerPage;
    const endIndex = startIndex + booksPerPage;
    const newBooks = allBooks.slice(startIndex, endIndex);

    if (newBooks.length > 0) {
      setDisplayedBooks((prev) => [...prev, ...newBooks]);
      setCurrentPage(nextPage);
      toast.success(`Loaded ${newBooks.length} more books`);
    }
  };

  // Load books on filter changes
  useEffect(() => {
    if (
      selectedGenres.length > 0 ||
      selectedMood ||
      selectedSort !== "relevance"
    ) {
      loadBooks();
    }
  }, [selectedGenres, selectedMood, selectedSort]);

  // Initial load
  useEffect(() => {
    loadBooks();
  }, []);

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedMood ||
    searchQuery.trim() ||
    selectedSort !== "relevance";
  const hasMoreBooks = displayedBooks.length < allBooks.length;
  const totalBooksFound = allBooks.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="relative">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent mb-4">
              {isSearchMode ? "Search Results" : "Discover Amazing Books"}
            </h1>
            <div className="flex flex-col items-center gap-3">
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                {isSearchMode
                  ? `Found ${totalBooksFound} books matching your search`
                  : "Find your next favorite book with our smart discovery tools"}
              </p>

              {!isSearchMode && lastRefreshTime && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  <span>
                    Fresh recommendations • Auto-refresh in{" "}
                    {getFormattedTimeUntilNext()}
                  </span>
                  <button
                    onClick={manualRefresh}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline"
                  >
                    Refresh now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-primary-500 z-10" />
              <input
                type="text"
                placeholder="Search by title, author, genre, or mood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-40 py-5 text-lg rounded-2xl border-2 border-primary-200 dark:border-primary-800 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:border-primary-300 dark:group-hover:border-primary-700"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-xl hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>

        {/* Smart Filter Toggle */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-primary-200 dark:border-primary-800 rounded-xl text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Filters & Sort</span>
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                {selectedGenres.length +
                  (selectedMood ? 1 : 0) +
                  (selectedSort !== "relevance" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Enhanced Filters */}
        <div
          className={`space-y-8 mb-12 ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          {/* Mood Selection */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-3 text-primary-500" />
              What's your reading mood?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => handleMoodSelect(mood.name)}
                  className={`group p-4 rounded-xl border-2 transition-all duration-300 text-center hover:scale-105 ${
                    selectedMood === mood.name
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg scale-105"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                    <mood.icon className="h-8 w-8 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {mood.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {mood.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Genre & Sort Controls */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Genres */}
            <div className="lg:col-span-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Select Genres
              </h3>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                      selectedGenres.includes(genre)
                        ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg"
                        : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <Bars3BottomLeftIcon className="h-5 w-5 mr-2" />
                Sort By
              </h3>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortChange(option.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                      selectedSort === option.value
                        ? "bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 shadow-md"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <option.icon className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
                    <span className="font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="text-center">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                <XMarkIcon className="h-5 w-5" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {isSearchMode ? "Search Results" : "Recommended Books"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isLoading
                  ? "Loading..."
                  : totalBooksFound === 0
                  ? "No books found"
                  : `${totalBooksFound} books • Showing ${displayedBooks.length}`}
              </p>
            </div>
          </div>

          {/* Books Grid */}
          {isLoading && displayedBooks.length === 0 ? (
            <div className="flex justify-center py-16">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
                  Finding amazing books for you...
                </p>
              </div>
            </div>
          ) : totalBooksFound === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 border border-white/20 dark:border-gray-700/20 shadow-xl">
                <MagnifyingGlassIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No books found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 font-semibold"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {displayedBooks.map((book) => (
                  <div key={book.id} className="group">
                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 overflow-hidden">
                      <BookCard
                        book={{
                          id: book.id,
                          title: book.title,
                          author: book.author,
                          authors: [book.author],
                          cover: book.cover,
                          likelihoodScore: book.likelihoodScore,
                          publishYear: book.publishYear,
                          reviewCount: book.reviewCount,
                          subjects: book.subjects,
                          mood: book.mood,
                          description: book.description,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {hasMoreBooks && (
                <div className="text-center mt-12">
                  <button
                    onClick={loadMoreBooks}
                    className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all duration-300 hover:scale-105 shadow-lg font-semibold"
                  >
                    Load More Books ({allBooks.length - displayedBooks.length}{" "}
                    remaining)
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
