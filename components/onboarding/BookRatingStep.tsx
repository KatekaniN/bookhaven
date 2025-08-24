"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  StarIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { UserPreference } from "../../types";
import toast from "react-hot-toast";

interface BookRatingStepProps {
  selectedGenres: string[];
  onRatingsChange: (
    bookRatings: UserPreference[],
    authorRatings: UserPreference[]
  ) => void;
  initialBookRatings?: UserPreference[];
  initialAuthorRatings?: UserPreference[];
}

interface BookForRating {
  id: string;
  title: string;
  author: string;
  cover: string;
  subjects: string[];
}

interface AuthorForRating {
  name: string;
  bookCount: number;
  genres: string[];
}

export default function BookRatingStep({
  selectedGenres,
  onRatingsChange,
  initialBookRatings = [],
  initialAuthorRatings = [],
}: BookRatingStepProps) {
  const [activeTab, setActiveTab] = useState<"books" | "authors">("books");
  const [books, setBooks] = useState<BookForRating[]>([]);
  const [authors, setAuthors] = useState<AuthorForRating[]>([]);
  const [bookRatings, setBookRatings] =
    useState<UserPreference[]>(initialBookRatings);
  const [authorRatings, setAuthorRatings] =
    useState<UserPreference[]>(initialAuthorRatings);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [currentAuthorIndex, setCurrentAuthorIndex] = useState(0);

  // Popular authors by genre
  const popularAuthors = {
    Fantasy: [
      "J.R.R. Tolkien",
      "Brandon Sanderson",
      "Neil Gaiman",
      "Terry Pratchett",
    ],
    "Science Fiction": [
      "Isaac Asimov",
      "Philip K. Dick",
      "Ursula K. Le Guin",
      "Arthur C. Clarke",
    ],
    Mystery: [
      "Agatha Christie",
      "Arthur Conan Doyle",
      "Gillian Flynn",
      "Tana French",
    ],
    Romance: ["Jane Austen", "Nicholas Sparks", "Nora Roberts", "Julia Quinn"],
    Thriller: ["Stephen King", "Dan Brown", "John Grisham", "Michael Crichton"],
    "Non-Fiction": [
      "Malcolm Gladwell",
      "Bill Bryson",
      "Mary Roach",
      "Michelle Obama",
    ],
    Biography: [
      "Walter Isaacson",
      "David McCullough",
      "Ron Chernow",
      "Doris Kearns Goodwin",
    ],
    History: [
      "Yuval Noah Harari",
      "Bill Bryson",
      "David McCullough",
      "Barbara Tuchman",
    ],
    "Self-Help": [
      "Tony Robbins",
      "Dale Carnegie",
      "Stephen Covey",
      "Brené Brown",
    ],
    Business: [
      "Malcolm Gladwell",
      "Daniel Kahneman",
      "Jim Collins",
      "Seth Godin",
    ],
    "Young Adult": [
      "Rick Riordan",
      "Suzanne Collins",
      "John Green",
      "Sarah J. Maas",
    ],
    "Literary Fiction": [
      "Margaret Atwood",
      "Toni Morrison",
      "Gabriel García Márquez",
      "Haruki Murakami",
    ],
    Horror: [
      "Stephen King",
      "H.P. Lovecraft",
      "Clive Barker",
      "Shirley Jackson",
    ],
    Comedy: ["David Sedaris", "Bill Bryson", "Tina Fey", "Mindy Kaling"],
    Poetry: ["Maya Angelou", "Rupi Kaur", "Robert Frost", "Lang Leav"],
  };

  useEffect(() => {
    fetchBooksAndAuthors();
  }, [selectedGenres]);

  const fetchBooksAndAuthors = async () => {
    setIsLoading(true);
    try {
      const allBooks: BookForRating[] = [];
      const authorSet = new Set<string>();

      // Fetch popular and highly-rated books from selected genres
      for (const genre of selectedGenres.slice(0, 3)) {
        // Limit to 3 genres to avoid too many API calls
        try {
          // Search for popular books in the genre, sorted by rating and edition count
          const response = await OpenLibraryAPI.searchByGenre(genre, 15);

          // Filter and sort books by relevance and rating indicators
          const genreBooks = response.docs
            .filter(
              (book) =>
                book.title &&
                book.author_name?.[0] &&
                book.cover_i && // Only include books with covers
                book.first_publish_year &&
                book.first_publish_year > 1950 && // Focus on more modern books
                book.title.length < 100 // Avoid very long titles that might be metadata issues
            )
            .sort((a, b) => {
              // Prioritize books with more editions and recent publication
              const scoreA =
                (a.edition_count || 1) * (a.want_to_read_count || 1) +
                (2025 - (a.first_publish_year || 1950)) * 0.1;
              const scoreB =
                (b.edition_count || 1) * (b.want_to_read_count || 1) +
                (2025 - (b.first_publish_year || 1950)) * 0.1;
              return scoreB - scoreA;
            })
            .slice(0, 8) // Take top 8 books per genre
            .map((book) => ({
              id: book.key,
              title: book.title,
              author: book.author_name?.[0] || "Unknown Author",
              cover: book.cover_i
                ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
                : "/placeholder-book.svg",
              subjects: book.subject?.slice(0, 3) || [genre],
            }));

          allBooks.push(...genreBooks);

          // Collect authors
          genreBooks.forEach((book) => {
            if (book.author && book.author !== "Unknown Author") {
              authorSet.add(book.author);
            }
          });
        } catch (error) {
          console.error(`Error fetching books for ${genre}:`, error);
        }
      }

      // Add popular authors from genres
      const genreAuthors: AuthorForRating[] = [];
      selectedGenres.forEach((genre) => {
        const genreAuthorList =
          popularAuthors[genre as keyof typeof popularAuthors] || [];
        genreAuthorList.forEach((authorName) => {
          if (!genreAuthors.find((a) => a.name === authorName)) {
            genreAuthors.push({
              name: authorName,
              bookCount: Math.floor(Math.random() * 50) + 10, // Simulated count
              genres: [genre],
            });
          }
        });
      });

      // Remove duplicates and shuffle results
      const uniqueBooks = allBooks.filter(
        (book, index, self) => index === self.findIndex((b) => b.id === book.id)
      );

      const shuffledBooks = uniqueBooks
        .sort(() => 0.5 - Math.random())
        .slice(0, 18); // Increased to 18 for better selection

      const shuffledAuthors = genreAuthors
        .sort(() => 0.5 - Math.random())
        .slice(0, 15); // Increased to 15 authors

      setBooks(shuffledBooks);
      setAuthors(shuffledAuthors);
    } catch (error) {
      console.error("Error fetching books and authors:", error);
      toast.error("Failed to load recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookRating = (
    book: BookForRating,
    rating: number,
    isLiked: boolean
  ) => {
    const existingRatingIndex = bookRatings.findIndex(
      (r) => r.bookId === book.id
    );
    const newRating: UserPreference = {
      id: `book-${book.id}-${Date.now()}`,
      userId: "", // Will be set when saving
      bookId: book.id,
      preferenceType: "book",
      rating,
      isLiked,
      weight: rating * 2, // Convert 1-5 to 2-10 weight
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let updatedRatings;
    if (existingRatingIndex >= 0) {
      updatedRatings = [...bookRatings];
      updatedRatings[existingRatingIndex] = newRating;
    } else {
      updatedRatings = [...bookRatings, newRating];
    }

    setBookRatings(updatedRatings);
    onRatingsChange(updatedRatings, authorRatings);
  };

  const handleAuthorRating = (
    author: AuthorForRating,
    rating: number,
    isLiked: boolean
  ) => {
    const existingRatingIndex = authorRatings.findIndex(
      (r) => r.authorName === author.name
    );
    const newRating: UserPreference = {
      id: `author-${author.name}-${Date.now()}`,
      userId: "", // Will be set when saving
      authorName: author.name,
      preferenceType: "author",
      rating,
      isLiked,
      weight: rating * 2, // Convert 1-5 to 2-10 weight
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let updatedRatings;
    if (existingRatingIndex >= 0) {
      updatedRatings = [...authorRatings];
      updatedRatings[existingRatingIndex] = newRating;
    } else {
      updatedRatings = [...authorRatings, newRating];
    }

    setAuthorRatings(updatedRatings);
    onRatingsChange(bookRatings, updatedRatings);
  };

  const getBookRating = (bookId: string) => {
    return bookRatings.find((r) => r.bookId === bookId);
  };

  const getAuthorRating = (authorName: string) => {
    return authorRatings.find((r) => r.authorName === authorName);
  };

  const StarRating = ({
    rating,
    onRate,
    size = "h-6 w-6",
  }: {
    rating: number;
    onRate: (rating: number) => void;
    size?: string;
  }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="transition-transform hover:scale-110"
          >
            {star <= rating ? (
              <StarIconSolid className={`${size} text-yellow-400`} />
            ) : (
              <StarIcon
                className={`${size} text-gray-300 hover:text-yellow-400`}
              />
            )}
          </button>
        ))}
      </div>
    );
  };

  const LikeButton = ({
    isLiked,
    onToggle,
  }: {
    isLiked: boolean;
    onToggle: () => void;
  }) => (
    <button onClick={onToggle} className="transition-transform hover:scale-110">
      <HeartIcon
        className={`h-6 w-6 ${
          isLiked
            ? "text-red-500 fill-current"
            : "text-gray-300 hover:text-red-400"
        }`}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">
          Loading personalized recommendations...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Rate books & authors you know
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help us understand your taste to provide better recommendations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("books")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "books"
              ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Books ({bookRatings.length} rated)
        </button>
        <button
          onClick={() => setActiveTab("authors")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "authors"
              ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Authors ({authorRatings.length} rated)
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === "books" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Swipe through books and rate the ones you know
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setCurrentBookIndex(Math.max(0, currentBookIndex - 3))
                }
                disabled={currentBookIndex === 0}
                className="p-1 rounded-full disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                {Math.min(currentBookIndex + 3, books.length)} of {books.length}
              </span>
              <button
                onClick={() =>
                  setCurrentBookIndex(
                    Math.min(books.length - 3, currentBookIndex + 3)
                  )
                }
                disabled={currentBookIndex >= books.length - 3}
                className="p-1 rounded-full disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {books.slice(currentBookIndex, currentBookIndex + 3).map((book) => {
              const rating = getBookRating(book.id);
              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow h-64 flex flex-col"
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <Image
                      src={book.cover}
                      alt={book.title}
                      width={60}
                      height={90}
                      className="rounded-md object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/placeholder-book.svg";
                      }}
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 text-sm leading-tight mb-1">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {book.author}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {book.subjects.slice(0, 2).map((subject) => (
                          <span
                            key={subject}
                            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded truncate"
                          >
                            {subject.length > 12
                              ? `${subject.slice(0, 12)}...`
                              : subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <StarRating
                      rating={rating?.rating || 0}
                      onRate={(newRating) =>
                        handleBookRating(
                          book,
                          newRating,
                          rating?.isLiked || false
                        )
                      }
                      size="h-5 w-5"
                    />
                    <LikeButton
                      isLiked={rating?.isLiked || false}
                      onToggle={() =>
                        handleBookRating(
                          book,
                          rating?.rating || 3,
                          !rating?.isLiked
                        )
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Authors Tab */}
      {activeTab === "authors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Rate authors whose work you enjoy
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setCurrentAuthorIndex(Math.max(0, currentAuthorIndex - 4))
                }
                disabled={currentAuthorIndex === 0}
                className="p-1 rounded-full disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-500">
                {Math.min(currentAuthorIndex + 4, authors.length)} of{" "}
                {authors.length}
              </span>
              <button
                onClick={() =>
                  setCurrentAuthorIndex(
                    Math.min(authors.length - 4, currentAuthorIndex + 4)
                  )
                }
                disabled={currentAuthorIndex >= authors.length - 4}
                className="p-1 rounded-full disabled:opacity-50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authors
              .slice(currentAuthorIndex, currentAuthorIndex + 4)
              .map((author) => {
                const rating = getAuthorRating(author.name);
                return (
                  <div
                    key={author.name}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow h-48 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {author.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {author.bookCount}+ books
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {author.genres.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                      <LikeButton
                        isLiked={rating?.isLiked || false}
                        onToggle={() =>
                          handleAuthorRating(
                            author,
                            rating?.rating || 3,
                            !rating?.isLiked
                          )
                        }
                      />
                    </div>

                    <div className="mt-auto">
                      <StarRating
                        rating={rating?.rating || 0}
                        onRate={(newRating) =>
                          handleAuthorRating(
                            author,
                            newRating,
                            rating?.isLiked || false
                          )
                        }
                        size="h-5 w-5"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex space-x-4">
            <span className="text-gray-600 dark:text-gray-300">
              📚 {bookRatings.length} books rated
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              ✍️ {authorRatings.length} authors rated
            </span>
          </div>
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {bookRatings.length + authorRatings.length} total preferences
          </span>
        </div>
      </div>
    </div>
  );
}
