"use client";

import { useState, useEffect, useMemo } from "react";
import { BookCard } from "../../components/books/BookCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAppStore } from "../../stores/useAppStore";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  FunnelIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  reviewCount: number;
  subjects: string[];
  mood: string;
  description: string;
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
    icon: "☕",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  {
    name: "Fast-paced & Exciting",
    icon: "⚡",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  {
    name: "Emotional & Deep",
    icon: "💙",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    name: "Light & Fun",
    icon: "🌟",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    name: "Dark & Mysterious",
    icon: "🌙",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  {
    name: "Educational",
    icon: "📚",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
];

// Function to fetch real books from OpenLibrary API
const fetchDiscoverBooks = async (): Promise<Book[]> => {
  try {
    const searches = [
      "fantasy",
      "science fiction",
      "mystery",
      "romance",
      "thriller",
      "biography",
      "philosophy",
      "horror",
      "young adult",
      "historical fiction",
    ];

    const allBooks: Book[] = [];

    for (const search of searches) {
      const response = await fetch(
        `https://openlibrary.org/search.json?subject=${search}&limit=5&sort=rating`
      );
      const data = await response.json();

      if (data.docs) {
        const books = data.docs
          .map((book: any) => {
            const workId =
              book.key?.replace("/works/", "") || `work_${Math.random()}`;
            const isbn = book.isbn?.[0];
            const cover = isbn
              ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
              : "/placeholder-book.jpg";

            // Map subjects to moods
            const subjects = book.subject?.slice(0, 3) || [search];
            let mood = "Educational";
            if (
              subjects.some(
                (s: string) =>
                  s.toLowerCase().includes("romance") ||
                  s.toLowerCase().includes("love")
              )
            ) {
              mood = "Emotional & Deep";
            } else if (
              subjects.some(
                (s: string) =>
                  s.toLowerCase().includes("thriller") ||
                  s.toLowerCase().includes("mystery")
              )
            ) {
              mood = "Dark & Mysterious";
            } else if (
              subjects.some(
                (s: string) =>
                  s.toLowerCase().includes("comedy") ||
                  s.toLowerCase().includes("humor")
              )
            ) {
              mood = "Light & Fun";
            } else if (
              subjects.some(
                (s: string) =>
                  s.toLowerCase().includes("science") ||
                  s.toLowerCase().includes("adventure")
              )
            ) {
              mood = "Fast-paced & Exciting";
            } else if (
              subjects.some(
                (s: string) =>
                  s.toLowerCase().includes("fantasy") ||
                  s.toLowerCase().includes("cozy")
              )
            ) {
              mood = "Cozy & Comfortable";
            }

            return {
              id: `works/${workId}`,
              title: book.title || "Unknown Title",
              author: book.author_name?.[0] || "Unknown Author",
              cover,
              rating: 4.0 + Math.random() * 1.0, // Generate realistic ratings
              reviewCount: Math.floor(Math.random() * 100000) + 10000,
              subjects: subjects.map(
                (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
              ),
              mood,
              description:
                book.first_sentence?.[0] || `A captivating ${search} book.`,
            };
          })
          .filter((book: Book) => book.title !== "Unknown Title");

        allBooks.push(...books);
      }
    }

    // Remove duplicates and limit to 50 books
    const uniqueBooks = allBooks
      .filter(
        (book, index, self) =>
          index === self.findIndex((b) => b.title === book.title)
      )
      .slice(0, 50);

    return uniqueBooks;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
};

export default function DiscoverPage() {
  const { addUserBook, clearOldDiscoverBooks } = useAppStore();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [booksPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const loadBooks = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      // Clear old discover books from cache first
      if (forceRefresh) {
        clearOldDiscoverBooks();
      }

      const books = await fetchDiscoverBooks();
      setAllBooks(books);
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error("Failed to load books:", error);
      toast.error("Failed to load books. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh hook - refreshes every hour
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 60 * 60 * 1000, // 1 hour
    enabled: true,
    onRefresh: () => loadBooks(true),
  });

  // Load books on component mount
  useEffect(() => {
    loadBooks();
  }, [clearOldDiscoverBooks]);

  // Filter books based on current criteria
  const filteredBooks = useMemo(() => {
    let filtered = allBooks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.subjects.some((subject) =>
            subject.toLowerCase().includes(query)
          ) ||
          book.description.toLowerCase().includes(query)
      );
    }

    // Apply genre filter
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((book) =>
        selectedGenres.some((genre) =>
          book.subjects.some((subject) =>
            subject.toLowerCase().includes(genre.toLowerCase())
          )
        )
      );
    }

    // Apply mood filter
    if (selectedMood) {
      filtered = filtered.filter((book) => book.mood === selectedMood);
    }

    return filtered;
  }, [allBooks, searchQuery, selectedGenres, selectedMood]);

  // Update displayed books when filters change
  useEffect(() => {
    setCurrentPage(1);
    const booksToShow = filteredBooks.slice(0, booksPerPage);
    setDisplayedBooks(booksToShow);
  }, [filteredBooks, booksPerPage]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => {
      const newGenres = prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre];

      if (newGenres.length !== prev.length) {
        toast.success(
          newGenres.includes(genre)
            ? `Added ${genre} filter`
            : `Removed ${genre} filter`
        );
      }

      return newGenres;
    });
  };

  const handleMoodSelect = (mood: string) => {
    const newMood = selectedMood === mood ? "" : mood;
    setSelectedMood(newMood);

    if (newMood) {
      toast.success(`Looking for ${newMood.toLowerCase()} books`);
    } else {
      toast.success("Mood filter cleared");
    }
  };

  const loadMoreBooks = () => {
    setIsLoading(true);

    // Simulate loading delay
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = currentPage * booksPerPage;
      const endIndex = startIndex + booksPerPage;
      const newBooks = filteredBooks.slice(startIndex, endIndex);

      setDisplayedBooks((prev) => [...prev, ...newBooks]);
      setCurrentPage(nextPage);
      setIsLoading(false);

      if (newBooks.length > 0) {
        toast.success(`Loaded ${newBooks.length} more books`);
      } else {
        toast.success("No more books to load");
      }
    }, 800);
  };

  const clearAllFilters = () => {
    setSelectedGenres([]);
    setSelectedMood("");
    setSearchQuery("");
    toast.success("All filters cleared");
  };

  const hasActiveFilters =
    selectedGenres.length > 0 || selectedMood || searchQuery.trim();
  const hasMoreBooks = displayedBooks.length < filteredBooks.length;
  const totalBooksFound = filteredBooks.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Discover Your Next Great Read
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find books that match your mood and interests. Use our smart
              filters to discover hidden gems.
            </p>
            {lastRefreshTime && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                  <ClockIcon className="h-3 w-3" />
                  <span>
                    Books refresh automatically in {getFormattedTimeUntilNext()}
                  </span>
                </div>
                <button
                  onClick={manualRefresh}
                  disabled={isLoading}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Refreshing..." : "Refresh now"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Bar 
        <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>*/}

        {/* Filter Toggle for Mobile */}
        <div className="lg:hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                {selectedGenres.length + (selectedMood ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div
          className={`space-y-6 sm:space-y-8 mb-8 sm:mb-12 ${
            showFilters ? "block" : "hidden lg:block"
          }`}
        >
          {/* Mood Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-primary-500" />
              What's your reading mood?
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {moods.map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => handleMoodSelect(mood.name)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center hover:scale-105 ${
                    selectedMood === mood.name
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">{mood.icon}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {mood.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select genres you enjoy
            </h3>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${
                    selectedGenres.includes(genre)
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {hasActiveFilters ? "Filtered Results" : "Recommended for You"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalBooksFound === 0
                ? "No books found"
                : totalBooksFound === 1
                ? "1 book found"
                : `${totalBooksFound} books found`}{" "}
              • Showing {displayedBooks.length} books
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm sm:text-base self-start sm:self-auto"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Results */}
        {totalBooksFound === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No books found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button onClick={clearAllFilters} className="btn btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
              {displayedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMoreBooks && (
              <div className="text-center mt-8 sm:mt-12">
                <button
                  onClick={loadMoreBooks}
                  disabled={isLoading}
                  className="btn btn-outline min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `Load More Books (${
                      filteredBooks.length - displayedBooks.length
                    } remaining)`
                  )}
                </button>
              </div>
            )}

            {/* Books Loaded Counter */}
            <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
              Loaded {displayedBooks.length} of {totalBooksFound} books
            </div>
          </>
        )}
      </div>
    </div>
  );
}
