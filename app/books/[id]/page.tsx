"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  ArrowLeftIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  StarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";
import { useAppStore } from "../../../stores/useAppStore";
import { OpenLibraryAPI } from "../../../lib/openLibrary";
import type { Book } from "../../../types";

// Hardcoded discover books for fallback
const DISCOVER_BOOKS: Book[] = [
  {
    id: "discover-1",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    authors: ["Taylor Jenkins Reid"],
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    description:
      "A reclusive Hollywood icon finally tells her story to a young journalist.",
    pages: 400,
    publishYear: 2017,
    subjects: ["Historical Fiction", "Romance"],
    languages: ["English"],
    isbn: "9781501161933",
    rating: 4.2,
    openLibraryKey: "discover-1",
  },
  {
    id: "discover-2",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    authors: ["Delia Owens"],
    cover: "https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg",
    description:
      "A mystery and coming-of-age story set in the marshlands of North Carolina.",
    pages: 384,
    publishYear: 2018,
    subjects: ["Mystery", "Literary Fiction"],
    languages: ["English"],
    isbn: "9780735219090",
    rating: 4.1,
    openLibraryKey: "discover-2",
  },
];

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const { userBooks, addUserBook } = useAppStore();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check if book is already in user's library
  const bookInLibrary = userBooks.some((userBook) => userBook.id === bookId);

  useEffect(() => {
    async function fetchBookData() {
      if (!bookId) return;

      setLoading(true);
      setError(null);

      try {
        console.log("Fetching book with ID:", bookId);
        console.log("URL params:", params);

        // First check if it's a discover book (hardcoded)
        const discoverBook = DISCOVER_BOOKS.find((b) => b.id === bookId);
        if (discoverBook) {
          console.log("Found discover book:", discoverBook);
          setBook(discoverBook);
          setLoading(false);
          return;
        }

        // If not a discover book, try to fetch from Open Library API
        if (bookId.includes("OL") || bookId.includes("works/")) {
          console.log("Fetching from Open Library API...");

          // Handle different URL formats
          let apiBookId = bookId;

          // If the URL is like "works/OL15601954W", format it properly
          if (bookId.startsWith("works/")) {
            apiBookId = `/${bookId}`;
          } else if (bookId.includes("works/")) {
            // Handle cases like "books/works/OL15601954W"
            const worksPart = bookId.substring(bookId.indexOf("works/"));
            apiBookId = `/${worksPart}`;
          } else if (!bookId.startsWith("/")) {
            // Ensure it starts with /
            apiBookId = `/${bookId}`;
          }

          console.log("API book ID:", apiBookId);

          const openLibraryBook = await OpenLibraryAPI.getBookDetails(
            apiBookId
          );
          console.log("Open Library book response:", openLibraryBook);

          if (openLibraryBook) {
            // Transform Open Library book to our Book format
            const transformedBook: Book = {
              id: bookId,
              title: openLibraryBook.title || "Unknown Title",
              author: openLibraryBook.authors?.[0]?.key
                ? await fetchAuthorName(openLibraryBook.authors[0].key)
                : "Unknown Author",
              authors: openLibraryBook.authors?.map((a: any) => a.key) || [],
              cover: openLibraryBook.covers?.[0]
                ? `https://covers.openlibrary.org/b/id/${openLibraryBook.covers[0]}-L.jpg`
                : "/placeholder-book.svg",
              description:
                typeof openLibraryBook.description === "string"
                  ? openLibraryBook.description
                  : openLibraryBook.description?.value ||
                    "No description available.",
              pages: 0, // Not available in works API
              publishYear: 0, // Not available in works API
              subjects: openLibraryBook.subjects?.slice(0, 3) || [],
              languages: ["English"],
              isbn: "",
              rating: 0,
              openLibraryKey: bookId,
            };

            console.log("Transformed book:", transformedBook);
            setBook(transformedBook);
          } else {
            setError("Book not found");
          }
        } else {
          setError("Invalid book ID format");
        }
      } catch (err) {
        console.error("Error fetching book:", err);
        setError("Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    }

    fetchBookData();
  }, [bookId]);

  async function fetchAuthorName(authorKey: string): Promise<string> {
    try {
      const response = await fetch(`https://openlibrary.org${authorKey}.json`);
      if (response.ok) {
        const author = await response.json();
        return author.name || "Unknown Author";
      }
    } catch (error) {
      console.error("Error fetching author:", error);
    }
    return "Unknown Author";
  }

  const handleAddToLibrary = (
    status: "want-to-read" | "currently-reading" | "read"
  ) => {
    if (!book || bookInLibrary) return;

    const userBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      description: book.description || "",
      pages: book.pages || 0,
      publishedYear: book.publishYear || new Date().getFullYear(),
      genre: book.subjects || [],
      mood: [],
      isbn: book.isbn || "",
      rating: book.rating || 0,
      status,
      dateAdded: new Date().toISOString().split("T")[0],
      currentPage: status === "read" ? book.pages || 0 : 0,
      startedReading:
        status !== "want-to-read"
          ? new Date().toISOString().split("T")[0]
          : undefined,
      finishedReading:
        status === "read" ? new Date().toISOString().split("T")[0] : undefined,
    };

    addUserBook(userBook);
    toast.success(`Added "${book.title}" to ${status.replace("-", " ")}!`);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites");
  };

  const handleSave = () => {
    if (!book || bookInLibrary) return;

    handleAddToLibrary("want-to-read");
    setIsSaved(true);
  };

  const handleShare = () => {
    if (!book) return;

    if (navigator.share) {
      navigator
        .share({
          title: book.title,
          text: `Check out "${book.title}" by ${book.author}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading book details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Book Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || "The book you're looking for doesn't exist."}
          </p>
          <Link
            href="/discover"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Discover Books
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {isLiked ? (
                  <HeartSolidIcon className="h-6 w-6 text-red-500" />
                ) : (
                  <HeartIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={bookInLibrary}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaved || bookInLibrary ? (
                  <BookmarkSolidIcon className="h-6 w-6 text-primary-600" />
                ) : (
                  <BookmarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ShareIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="aspect-[3/4] relative mb-6">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder-book.svg";
                    }}
                  />
                </div>

                {/* Action Buttons */}
                {!bookInLibrary && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAddToLibrary("want-to-read")}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                      <span>Want to Read</span>
                    </button>

                    <button
                      onClick={() => handleAddToLibrary("currently-reading")}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ClockIcon className="h-5 w-5" />
                      <span>Currently Reading</span>
                    </button>

                    <button
                      onClick={() => handleAddToLibrary("read")}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Mark as Read</span>
                    </button>
                  </div>
                )}

                {bookInLibrary && (
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 dark:text-green-300 font-medium">
                      Already in your library
                    </p>
                    <Link
                      href={`/my-books/${book.id}`}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      View in My Books
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Information */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* Title and Author */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                  by {book.author}
                </p>

                {/* Rating */}
                {book.rating && book.rating > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIconSolid
                          key={star}
                          className={`h-5 w-5 ${
                            star <= (book.rating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {book.rating} stars
                    </span>
                  </div>
                )}

                {/* Genres */}
                {book.subjects && book.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {book.subjects.map((genre: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 text-sm rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {book.pages && book.pages > 0 && (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {book.pages}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pages
                    </div>
                  </div>
                )}

                {book.publishYear && book.publishYear > 0 && (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {book.publishYear}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Published
                    </div>
                  </div>
                )}

                {book.isbn && (
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg col-span-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      ISBN
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {book.isbn}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {book.description && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    About this book
                  </h2>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {book.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
