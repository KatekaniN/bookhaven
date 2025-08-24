"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeftIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from "@heroicons/react/24/solid";
import { useAppStore } from "../../../stores/useAppStore";

interface BookData {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating?: number;
  reviewCount?: number;
  subjects?: string[];
  description?: string;
  fullDescription?: string;
  isbn?: string;
  pages?: number;
  publisher?: string;
  published?: string;
  language?: string;
  publishYear?: number;
  authors?: string[];
  publishers?: string[];
  languages?: string[];
}

// Fallback data for discover books
const DISCOVER_BOOKS = [
  {
    id: "discover-1",
    title: "The House in the Cerulean Sea",
    author: "TJ Klune",
    cover: "https://covers.openlibrary.org/b/isbn/9781250217288-L.jpg",
    rating: 4.5,
    reviewCount: 87000,
    subjects: ["Fantasy", "LGBTQ+", "Romance"],
    mood: "Cozy & Comfortable",
    description: "A magical island, a dangerous task, a burning secret.",
    fullDescription:
      "Linus Baker leads a quiet, solitary life. At forty, he lives in a tiny house with a devious cat and his old records. As a Case Worker at the Department in Charge of Magical Youth, he spends his days overseeing the well-being of children in government-sanctioned orphanages. When Linus is unexpectedly summoned by Extremely Upper Management, he's given a curious and highly classified assignment: travel to Marsyas Island Orphanage, where six dangerous children reside: a gnome, a sprite, a wyvern, an unidentifiable forest creature, a were-Pomeranian, and the Antichrist. Linus must set aside his fears and determine whether or not they're likely to bring about the end of days.",
    isbn: "9781250217288",
    pages: 394,
    publisher: "Tor Books",
    published: "2020",
    language: "English",
  },
  // Add more discover books as needed
];

async function fetchBookFromOpenLibrary(
  bookId: string
): Promise<BookData | null> {
  try {
    // Handle Open Library book IDs (works/OL21703979W, etc.)
    const cleanId = bookId.replace(/^works\//, "");

    const response = await fetch(
      `https://openlibrary.org/works/${cleanId}.json`
    );
    if (!response.ok) return null;

    const workData = await response.json();

    // Get cover image
    let cover = "/placeholder-book.svg";
    if (workData.covers && workData.covers.length > 0) {
      cover = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
    }

    // Get authors
    let authors: string[] = [];
    if (workData.authors) {
      for (const authorRef of workData.authors) {
        try {
          const authorResponse = await fetch(
            `https://openlibrary.org${authorRef.author.key}.json`
          );
          if (authorResponse.ok) {
            const authorData = await authorResponse.json();
            authors.push(authorData.name);
          }
        } catch (e) {
          // Continue if author fetch fails
        }
      }
    }

    return {
      id: bookId,
      title: workData.title || "Unknown Title",
      author: authors[0] || "Unknown Author",
      authors,
      cover,
      description:
        workData.description?.value ||
        workData.description ||
        "No description available",
      fullDescription:
        workData.description?.value ||
        workData.description ||
        "No description available",
      subjects: workData.subjects?.slice(0, 5) || [],
      published: workData.first_publish_date,
      language: "English", // Default
    };
  } catch (error) {
    console.error("Failed to fetch book from Open Library:", error);
    return null;
  }
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const { userBooks, addUserBook } = useAppStore();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isInLibrary, setIsInLibrary] = useState(false);

  useEffect(() => {
    async function loadBook() {
      setLoading(true);

      // First check if it's a discover book (starts with "discover-")
      if (bookId.startsWith("discover-")) {
        const discoverBook = DISCOVER_BOOKS.find((b) => b.id === bookId);
        if (discoverBook) {
          setBook(discoverBook);
          setLoading(false);
          return;
        }
      }

      // Try to fetch from Open Library
      const openLibraryBook = await fetchBookFromOpenLibrary(bookId);
      if (openLibraryBook) {
        setBook(openLibraryBook);
      } else {
        toast.error("Book not found");
        router.back();
      }

      setLoading(false);
    }

    loadBook();
  }, [bookId, router]);

  useEffect(() => {
    if (book) {
      // Check if book is already in user's library
      const inLibrary = userBooks.some(
        (userBook) => userBook.id === book.id || userBook.title === book.title
      );
      setIsInLibrary(inLibrary);
    }
  }, [book, userBooks]);

  const handleAddToLibrary = (
    status: "want-to-read" | "currently-reading" = "want-to-read"
  ) => {
    if (!book || isInLibrary) return;

    const userBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      description: book.description || book.fullDescription || "",
      pages: book.pages || 200, // Default page count
      publishedYear: book.published
        ? parseInt(book.published)
        : new Date().getFullYear(),
      genre: book.subjects || ["General"],
      mood: ["Unknown"],
      isbn: book.isbn || "",
      rating: book.rating || 0,
      status,
      dateAdded: new Date().toISOString().split("T")[0],
    };

    addUserBook(userBook);
    setIsInLibrary(true);
    toast.success(`Added to ${status.replace("-", " ")}!`);
  };

  const handleShare = () => {
    if (navigator.share && book) {
      navigator.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author}`,
        url: window.location.href,
      });
    } else if (book) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Book not found
          </h1>
          <button
            onClick={handleGoBack}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleGoBack}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isLiked ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={() => setIsSaved(!isSaved)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isSaved ? (
                  <BookmarkSolidIcon className="h-6 w-6 text-primary-600" />
                ) : (
                  <BookmarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ShareIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Image
                src={book.cover}
                alt={book.title}
                width={400}
                height={600}
                className="w-full max-w-sm mx-auto rounded-lg shadow-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-book.svg";
                }}
              />

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {!isInLibrary ? (
                  <>
                    <button
                      onClick={() => handleAddToLibrary("want-to-read")}
                      className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Want to Read
                    </button>
                    <button
                      onClick={() => handleAddToLibrary("currently-reading")}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Start Reading
                    </button>
                  </>
                ) : (
                  <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-lg text-center font-medium">
                    ✓ In Your Library
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Author */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                by {book.author}
              </p>
            </div>

            {/* Rating and Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {book.rating && (
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-medium">{book.rating}</span>
                  {book.reviewCount && (
                    <span className="ml-1">
                      ({book.reviewCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {book.pages && <div>{book.pages} pages</div>}

              {book.published && <div>Published {book.published}</div>}

              {book.publisher && <div>{book.publisher}</div>}
            </div>

            {/* Genres/Subjects */}
            {book.subjects && book.subjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Genres
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Description
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {book.fullDescription ||
                    book.description ||
                    "No description available."}
                </p>
              </div>
            </div>

            {/* Book Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800 rounded-lg p-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Book Details
                </h3>
                <div className="space-y-2 text-sm">
                  {book.isbn && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        ISBN:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.isbn}
                      </span>
                    </div>
                  )}
                  {book.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Language:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.language}
                      </span>
                    </div>
                  )}
                  {book.pages && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Pages:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.pages}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Publication
                </h3>
                <div className="space-y-2 text-sm">
                  {book.publisher && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Publisher:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.publisher}
                      </span>
                    </div>
                  )}
                  {book.published && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Published:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {book.published}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
