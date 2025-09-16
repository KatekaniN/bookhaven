"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  StarIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpenIcon,
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

  // Enhanced popular authors with better diversity and balance
  const popularAuthors = useMemo(
    () => ({
      Fantasy: {
        classics: ["J.R.R. Tolkien", "Ursula K. Le Guin"],
        contemporary: ["Brandon Sanderson", "Neil Gaiman", "Terry Pratchett"],
        diverse: ["N.K. Jemisin", "Nnedi Okorafor", "Liu Cixin"],
        emerging: ["Rebecca Roanhorse", "Silvia Moreno-Garcia"],
      },
      "Science Fiction": {
        classics: ["Isaac Asimov", "Philip K. Dick"],
        contemporary: [
          "Ursula K. Le Guin",
          "Arthur C. Clarke",
          "Kim Stanley Robinson",
        ],
        diverse: ["Octavia Butler", "Liu Cixin", "Becky Chambers"],
        emerging: ["Martha Wells", "Andy Weir"],
      },
      Mystery: {
        classics: ["Agatha Christie", "Arthur Conan Doyle"],
        contemporary: ["Gillian Flynn", "Tana French", "Louise Penny"],
        diverse: ["Walter Mosley", "Keigo Higashino", "Attica Locke"],
        emerging: ["Tana French", "Kate Atkinson"],
      },
      Romance: {
        classics: ["Jane Austen", "Charlotte Brontë"],
        contemporary: ["Nicholas Sparks", "Nora Roberts", "Julia Quinn"],
        diverse: ["Beverly Jenkins", "Alyssa Cole", "Jasmine Guillory"],
        emerging: ["Emily Henry", "Casey McQuiston"],
      },
      Thriller: {
        classics: ["Stephen King", "Patricia Highsmith"],
        contemporary: ["Dan Brown", "John Grisham", "Michael Crichton"],
        diverse: ["Attica Locke", "S.A. Cosby", "Oyinkan Braithwaite"],
        emerging: ["Riley Sager", "Ruth Ware"],
      },
      "Non-Fiction": {
        classics: ["Malcolm Gladwell", "Bill Bryson"],
        contemporary: ["Mary Roach", "Michelle Obama", "Trevor Noah"],
        diverse: [
          "Ta-Nehisi Coates",
          "Chimamanda Ngozi Adichie",
          "Yuval Noah Harari",
        ],
        emerging: ["Ibram X. Kendi", "Cathy Park Hong"],
      },
      Biography: {
        classics: ["Walter Isaacson", "David McCullough"],
        contemporary: ["Ron Chernow", "Doris Kearns Goodwin"],
        diverse: ["Maya Angelou", "Frederick Douglass"],
        emerging: ["Tara Westover", "Michelle Obama"],
      },
      History: {
        classics: ["David McCullough", "Barbara Tuchman"],
        contemporary: ["Yuval Noah Harari", "Bill Bryson"],
        diverse: ["Howard Zinn", "Jill Lepore"],
        emerging: ["Isabel Wilkerson", "Nikole Hannah-Jones"],
      },
      "Self-Help": {
        classics: ["Dale Carnegie", "Stephen Covey"],
        contemporary: ["Tony Robbins", "Brené Brown"],
        diverse: ["Robin DiAngelo", "James Clear"],
        emerging: ["Atomic Habits", "Untamed"],
      },
      Business: {
        classics: ["Jim Collins", "Peter Drucker"],
        contemporary: ["Malcolm Gladwell", "Daniel Kahneman"],
        diverse: ["Sheryl Sandberg", "Arlan Hamilton"],
        emerging: ["Seth Godin", "Ryan Holiday"],
      },
      "Young Adult": {
        classics: ["S.E. Hinton", "Judy Blume"],
        contemporary: ["Rick Riordan", "Suzanne Collins", "John Green"],
        diverse: ["Angie Thomas", "Elizabeth Acevedo", "Nic Stone"],
        emerging: ["Adam Silvera", "Becky Albertalli"],
      },
      "Literary Fiction": {
        classics: ["Toni Morrison", "Gabriel García Márquez"],
        contemporary: ["Margaret Atwood", "Haruki Murakami"],
        diverse: [
          "Chimamanda Ngozi Adichie",
          "Jhumpa Lahiri",
          "Colson Whitehead",
        ],
        emerging: ["Ocean Vuong", "Carmen Maria Machado"],
      },
      Horror: {
        classics: ["Stephen King", "H.P. Lovecraft"],
        contemporary: ["Clive Barker", "Shirley Jackson"],
        diverse: ["Tananarive Due", "Victor LaValle"],
        emerging: ["Grady Hendrix", "Silvia Moreno-Garcia"],
      },
      Comedy: {
        classics: ["David Sedaris", "Bill Bryson"],
        contemporary: ["Tina Fey", "Mindy Kaling"],
        diverse: ["Trevor Noah", "Ali Wong"],
        emerging: ["Samantha Irby", "Casey McQuiston"],
      },
      Poetry: {
        classics: ["Maya Angelou", "Robert Frost"],
        contemporary: ["Rupi Kaur", "Lang Leav"],
        diverse: ["Ocean Vuong", "Warsan Shire"],
        emerging: ["Amanda Gorman", "Morgan Harper Nichols"],
      },
    }),
    []
  );

  // Curated fallback books for when API fails or returns poor results
  const fallbackBooks = {
    Fantasy: [
      { title: "The Hobbit", author: "J.R.R. Tolkien" },
      { title: "The Way of Kings", author: "Brandon Sanderson" },
      { title: "The Name of the Wind", author: "Patrick Rothfuss" },
      { title: "The Fifth Season", author: "N.K. Jemisin" },
    ],
    "Science Fiction": [
      { title: "Dune", author: "Frank Herbert" },
      { title: "The Martian", author: "Andy Weir" },
      { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin" },
      { title: "Project Hail Mary", author: "Andy Weir" },
    ],
    Mystery: [
      { title: "Gone Girl", author: "Gillian Flynn" },
      { title: "The Thursday Murder Club", author: "Richard Osman" },
      { title: "In the Woods", author: "Tana French" },
      { title: "The Silent Patient", author: "Alex Michaelides" },
    ],
    Romance: [
      { title: "Pride and Prejudice", author: "Jane Austen" },
      {
        title: "The Seven Husbands of Evelyn Hugo",
        author: "Taylor Jenkins Reid",
      },
      { title: "Red, White & Royal Blue", author: "Casey McQuiston" },
      { title: "Beach Read", author: "Emily Henry" },
    ],
  };

  const fetchBooksAndAuthors = useCallback(async () => {
    setIsLoading(true);
    try {
      const allBooks: BookForRating[] = [];
      const authorSet = new Set<string>();

      // Fetch popular and highly-rated books from selected genres
      // Process all genres but limit API calls per genre
      for (const genre of selectedGenres.slice(0, 5)) {
        // Increased to 5 genres
        try {
          // Search for popular books in the genre, with better filtering
          const response = await OpenLibraryAPI.searchByGenre(genre, 24); // fetch a bit more for better selection

          // Enhanced filtering and sorting
          const genreBooks = response.docs
            .filter((book) => {
              // Keep defensive checks. Don’t require ratings_count (many OL entries lack this)
              if (!book.title) return false;
              if (!book.author_name?.[0]) return false;
              if (!book.cover_i) return false; // keep visual quality
              const title = book.title.toLowerCase();
              if (title.includes("vol.")) return false;
              if (title.includes("part ")) return false;
              if (book.title.length < 4 || book.title.length > 120)
                return false;

              // Ensure relevance: prefer items whose subjects include the selected genre
              const subjects = (book.subject || []).map((s) => s.toLowerCase());
              const hasGenreSubject = subjects.some((s) =>
                s.includes(genre.toLowerCase())
              );
              // Allow some without explicit subjects if publish year is reasonable
              const yearOk = (book.first_publish_year || 1900) > 1950;
              return hasGenreSubject || yearOk;
            })
            .sort((a, b) => {
              // Enhanced scoring algorithm
              const calculateScore = (book: any) => {
                // Popularity component (30% weight)
                const popularity = Math.log(
                  (book.edition_count || 1) * (book.want_to_read_count || 1)
                );
                const popularityScore = popularity * 0.3;

                // Quality component (40% weight) - prioritize books with good ratings
                const quality =
                  (book.ratings_average || 3.8) *
                  Math.log((book.ratings_count || 5) + 1);
                const qualityScore = quality * 0.4;

                // Recency component (20% weight) - favor books from 1980-2020 with slight preference for newer
                const year = book.first_publish_year || 2000;
                let recencyScore = 0;
                if (year >= 1980 && year <= 2020) {
                  recencyScore = ((year - 1980) / 40) * 0.2;
                } else if (year > 2020) {
                  recencyScore = 0.15;
                } else {
                  recencyScore = 0.1;
                }

                // Availability bonus (10% weight)
                const availabilityScore =
                  (book.cover_i ? 0.07 : 0) +
                  (book.ratings_count && book.ratings_count > 50 ? 0.03 : 0);

                return (
                  popularityScore +
                  qualityScore +
                  recencyScore +
                  availabilityScore
                );
              };

              const scoreA = calculateScore(a);
              const scoreB = calculateScore(b);
              return scoreB - scoreA;
            })
            .slice(0, 12) // Take top per-genre selection
            .map((book) => ({
              id: book.key,
              title: book.title,
              author: book.author_name?.[0] || "Unknown Author",
              cover: book.cover_i
                ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
                : "/placeholder-book.svg",
              subjects:
                book.subject && book.subject.length > 0
                  ? book.subject.slice(0, 3)
                  : [genre],
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

          // Fallback: try a simpler search if the genre-specific search fails
          try {
            console.log(`Trying fallback search for ${genre}...`);
            const fallbackResponse =
              await OpenLibraryAPI.getPopularBooksByGenre(genre, 16);

            const fallbackBooks = fallbackResponse.docs
              .filter(
                (book) => book.title && book.author_name?.[0] && book.cover_i
              )
              .slice(0, 8)
              .map((book) => ({
                id: book.key,
                title: book.title,
                author: book.author_name?.[0] || "Unknown Author",
                cover: book.cover_i
                  ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
                  : "/placeholder-book.svg",
                subjects: [genre],
              }));

            allBooks.push(...fallbackBooks);
            fallbackBooks.forEach((book) => {
              if (book.author && book.author !== "Unknown Author") {
                authorSet.add(book.author);
              }
            });

            console.log(
              `Fallback search for ${genre} found ${fallbackBooks.length} books`
            );
          } catch (fallbackError) {
            console.error(
              `Fallback search also failed for ${genre}:`,
              fallbackError
            );
            // Skip this genre entirely if both searches fail
          }
        }
      }

      // Add popular authors from genres with balanced selection
      const genreAuthors: AuthorForRating[] = [];
      selectedGenres.forEach((genre) => {
        const genreAuthorData =
          popularAuthors[genre as keyof typeof popularAuthors];
        if (genreAuthorData) {
          // Create balanced selection: 2 classics, 3 contemporary, 2 diverse, 1 emerging
          const selectedAuthors = [
            ...genreAuthorData.classics.slice(0, 2),
            ...genreAuthorData.contemporary.slice(0, 3),
            ...genreAuthorData.diverse.slice(0, 2),
            ...genreAuthorData.emerging.slice(0, 1),
          ];

          selectedAuthors.forEach((authorName: string) => {
            if (!genreAuthors.find((a) => a.name === authorName)) {
              genreAuthors.push({
                name: authorName,
                bookCount: Math.floor(Math.random() * 50) + 10, // Simulated count
                genres: [genre],
              });
            }
          });
        }
      });

      // Remove duplicates and shuffle results
      const uniqueBooks = allBooks.filter(
        (book, index, self) => index === self.findIndex((b) => b.id === book.id)
      );

      // Final fallback: if we have very few books, try to get some popular ones
      if (uniqueBooks.length < 5) {
        console.log(
          "Too few books found, trying general popular books fallback..."
        );
        try {
          const popularResponse = await OpenLibraryAPI.getTrendingBooks(20);
          const popularBooks = popularResponse.docs
            .filter(
              (book) => book.title && book.author_name?.[0] && book.cover_i
            )
            .slice(0, 15)
            .map((book) => ({
              id: book.key,
              title: book.title,
              author: book.author_name?.[0] || "Unknown Author",
              cover: book.cover_i
                ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
                : "/placeholder-book.svg",
              subjects:
                book.subject && book.subject.length > 0
                  ? book.subject.slice(0, 3)
                  : ["Fiction"],
            }));

          uniqueBooks.push(...popularBooks);
          console.log(`Added ${popularBooks.length} popular books as fallback`);
        } catch (fallbackError) {
          console.error("Final fallback also failed:", fallbackError);
        }
      }

      const shuffledBooks = uniqueBooks
        .sort(() => 0.5 - Math.random())
        .slice(0, 24); // maintain a rich pool

      const shuffledAuthors = genreAuthors
        .sort(() => 0.5 - Math.random())
        .slice(0, 20); // Increased to 20 authors (was 15)

      setBooks(shuffledBooks);
      setAuthors(shuffledAuthors);

      console.log(
        `Final results: ${shuffledBooks.length} books, ${shuffledAuthors.length} authors`
      );
    } catch (error) {
      console.error("Error fetching books and authors:", error);
      toast.error("Failed to load recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenres, popularAuthors]);

  useEffect(() => {
    fetchBooksAndAuthors();
  }, [selectedGenres, fetchBooksAndAuthors]);

  const handleBookRating = (
    book: BookForRating,
    rating: number,
    isLiked: boolean
  ) => {
    const existingRatingIndex = bookRatings.findIndex(
      (r) => r.bookId === book.id
    );

    const shouldBeLiked = rating >= 3 || isLiked;
    const newRating: UserPreference = {
      id: `book-${book.id}-${Date.now()}`,
      userId: "", // Will be set when saving
      bookId: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      preferenceType: "book",
      rating,
      isLiked: shouldBeLiked,
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
    const shouldBeLiked = rating >= 3 || isLiked;
    const newRating: UserPreference = {
      id: `author-${author.name}-${Date.now()}`,
      userId: "", // Will be set when saving
      authorName: author.name,
      preferenceType: "author",
      rating,
      isLiked: shouldBeLiked,
      weight: rating * 2,
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
              <StarIconSolid className={`${size} text-secondary-400`} />
            ) : (
              <StarIcon
                className={`${size} text-gray-300 hover:text-secondary-500`}
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
            ? "text-primary-500 fill-current"
            : "text-gray-300 hover:text-primary-600"
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
                        const target = e.target as HTMLImageElement;
                        if (target && target.src !== "/placeholder-book.svg") {
                          target.src = "/placeholder-book.svg";
                        }
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
                        handleBookRating(book, newRating, newRating >= 4)
                      }
                      size="h-5 w-5"
                    />
                    <LikeButton
                      isLiked={rating?.isLiked || false}
                      onToggle={() =>
                        handleBookRating(
                          book,
                          rating?.isLiked ? rating?.rating || 0 : 5,
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
                            rating?.isLiked ? rating?.rating || 0 : 5, // Fix: Set to 5 when liking, keep current when unliking
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
                            newRating >= 4 // Fix: Auto-like when rating 4+ stars
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
            <span className="text-gray-600 dark:text-gray-300 flex items-center">
              <BookOpenIcon className="w-4 h-4 mr-1" />
              {bookRatings.length} books rated
            </span>
            <span className="text-gray-600 dark:text-gray-300 flex items-center">
              <HeartIcon className="w-4 h-4 mr-1" />
              {authorRatings.length} authors rated
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
