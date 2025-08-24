"use client";

import { useState, useEffect, useMemo } from "react";
import { BookCard } from "../../components/books/BookCard";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAppStore } from "../../stores/useAppStore";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

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

// Expanded mock book database
const ALL_BOOKS = [
  {
    id: "discover-1",
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    cover: "https://covers.openlibrary.org/b/isbn/9781250217288-L.jpg",
    rating: 4.5,
    reviewCount: 45623,
    subjects: ["Fantasy", "LGBTQ+", "Feel-good"],
    mood: "Light & Fun",
    description:
      "A magical story about found family and love in unexpected places.",
  },
  {
    id: "discover-2",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cover: "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg",
    rating: 4.2,
    reviewCount: 78291,
    subjects: ["Thriller", "Mystery", "Psychological"],
    mood: "Dark & Mysterious",
    description:
      "A woman refuses to speak after allegedly murdering her husband.",
  },
  {
    id: "discover-3",
    title: "Educated",
    author: "Tara Westover",
    cover: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    rating: 4.4,
    reviewCount: 92145,
    subjects: ["Memoir", "Biography", "Education"],
    mood: "Educational",
    description: "A powerful memoir about education and family.",
  },
  {
    id: "discover-4",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    cover: "https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg",
    rating: 4.3,
    reviewCount: 156789,
    subjects: ["Historical Fiction", "Mystery", "Nature"],
    mood: "Emotional & Deep",
    description:
      "A mystery about a young woman who raised herself in the marshes.",
  },
  {
    id: "discover-5",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    rating: 4.6,
    reviewCount: 125000,
    subjects: ["Historical Fiction", "Romance", "LGBTQ+"],
    mood: "Emotional & Deep",
    description: "A reclusive Hollywood icon finally tells her story.",
  },
  {
    id: "discover-6",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    rating: 4.8,
    reviewCount: 89000,
    subjects: ["Self-Help", "Productivity", "Psychology"],
    mood: "Educational",
    description: "Transform your life with the power of atomic habits.",
  },
  {
    id: "discover-7",
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    rating: 4.4,
    reviewCount: 198000,
    subjects: ["Fantasy", "Philosophy", "Self-Discovery"],
    mood: "Cozy & Comfortable",
    description:
      "Between life and death lies a library of infinite possibilities.",
  },
  {
    id: "discover-8",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    cover: "https://covers.openlibrary.org/b/isbn/9780571364886-L.jpg",
    rating: 4.2,
    reviewCount: 67000,
    subjects: ["Science Fiction", "Literary Fiction", "AI"],
    mood: "Emotional & Deep",
    description:
      "An artificial friend observes the world with wonder and heartbreak.",
  },
  {
    id: "discover-9",
    title: "Dune",
    author: "Frank Herbert",
    cover: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    rating: 4.5,
    reviewCount: 145000,
    subjects: ["Science Fiction", "Adventure", "Politics"],
    mood: "Fast-paced & Exciting",
    description: "An epic tale of power, betrayal, and the future of humanity.",
  },
  {
    id: "discover-10",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    cover: "https://covers.openlibrary.org/b/isbn/9780241425442-L.jpg",
    rating: 4.4,
    reviewCount: 87000,
    subjects: ["Mystery", "Comedy", "Crime"],
    mood: "Light & Fun",
    description: "Four retirees meet weekly to investigate cold cases.",
  },
  {
    id: "discover-11",
    title: "Becoming",
    author: "Michelle Obama",
    cover: "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
    rating: 4.8,
    reviewCount: 189000,
    subjects: ["Memoir", "Politics", "Biography"],
    mood: "Educational",
    description: "The deeply personal memoir of the former First Lady.",
  },
  {
    id: "discover-12",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    cover: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
    rating: 4.7,
    reviewCount: 98000,
    subjects: ["Finance", "Psychology", "Business"],
    mood: "Educational",
    description: "Timeless lessons on wealth, greed, and happiness.",
  },
  {
    id: "discover-13",
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    cover: "https://covers.openlibrary.org/b/isbn/9780385490818-L.jpg",
    rating: 4.4,
    reviewCount: 178000,
    subjects: ["Dystopian", "Feminism", "Political Fiction"],
    mood: "Dark & Mysterious",
    description: "A story of resistance in a dystopian future.",
  },
  {
    id: "discover-14",
    title: "Circe",
    author: "Madeline Miller",
    cover: "https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg",
    rating: 4.5,
    reviewCount: 123000,
    subjects: ["Fantasy", "Mythology", "Feminism"],
    mood: "Emotional & Deep",
    description: "The untold story of the Greek goddess Circe.",
  },
  {
    id: "discover-15",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    cover: "https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg",
    rating: 4.6,
    reviewCount: 156000,
    subjects: ["LGBTQ+", "Historical Fiction", "Mythology"],
    mood: "Emotional & Deep",
    description: "The love story between Achilles and Patroclus.",
  },
  {
    id: "discover-16",
    title: "The Alchemist",
    author: "Paulo Coelho",
    cover: "https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg",
    rating: 4.2,
    reviewCount: 187000,
    subjects: ["Philosophy", "Adventure", "Inspiration"],
    mood: "Cozy & Comfortable",
    description: "A philosophical tale about destiny and following dreams.",
  },
  {
    id: "discover-17",
    title: "Project Hail Mary",
    author: "Andy Weir",
    cover: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    rating: 4.7,
    reviewCount: 98765,
    subjects: ["Science Fiction", "Adventure", "Humor"],
    mood: "Fast-paced & Exciting",
    description:
      "A lone astronaut must save humanity in this thrilling sci-fi adventure.",
  },
  {
    id: "discover-18",
    title: "The Spanish Love Deception",
    author: "Elena Armas",
    cover: "https://covers.openlibrary.org/b/isbn/9781668003862-L.jpg",
    rating: 4.1,
    reviewCount: 67890,
    subjects: ["Romance", "Contemporary", "Comedy"],
    mood: "Light & Fun",
    description: "A fake dating romance with plenty of laughs and chemistry.",
  },
];

export default function DiscoverPage() {
  const { addUserBook } = useAppStore();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [displayedBooks, setDisplayedBooks] = useState<typeof ALL_BOOKS>([]);
  const [booksPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Filter books based on current criteria
  const filteredBooks = useMemo(() => {
    let filtered = ALL_BOOKS;

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
  }, [searchQuery, selectedGenres, selectedMood]);

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
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Find books that match your mood and interests. Use our smart filters
            to discover hidden gems.
          </p>
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
