"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HeartIcon,
  PlusIcon,
  CheckIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { useAppStore, UserBook } from "../../stores/useAppStore";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  authors?: string[];
  cover: string;
  rating?: number;
  likelihoodScore?: number; // 0-100 percentage likelihood user will like this book
  reviewCount?: number;
  description?: string;
  subjects?: string[];
  mood?: string;
  publishYear?: number;
  publishers?: string[];
  languages?: string[];
}

interface BookCardProps {
  book: Book;
  showActions?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BookCard({
  book,
  showActions = true,
  size = "md",
}: BookCardProps) {
  const {
    addUserBook,
    userBooks,
    likeBook,
    unlikeBook,
    isBookInLibrary,
    getBookFromLibrary,
  } = useAppStore();

  const [imageError, setImageError] = useState(false);

  // Check if book is already in user's library and if it's liked
  const isInLibrary = isBookInLibrary(book.id);
  const bookInLibrary = getBookFromLibrary(book.id);
  const isLiked = bookInLibrary?.isLiked || false;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const bookData = {
      title: book.title,
      author: book.author,
      cover: book.cover,
      description: book.description,
      rating: book.rating || book.likelihoodScore || 0,
      genre: book.subjects || [],
      publishedYear: book.publishYear,
    };

    if (isLiked) {
      unlikeBook(book.id);
      toast.success(`Removed "${book.title}" from favorites`);
    } else {
      likeBook(book.id, bookData);
      toast.success(`Added "${book.title}" to favorites`);
    }
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInLibrary) {
      toast.success(`"${book.title}" is already in your library!`);
      return;
    }

    // Transform the discover book into a UserBook format
    const userBook: UserBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      description: book.description || "No description available.",
      rating:
        book.rating || (book.likelihoodScore ? book.likelihoodScore / 20 : 0), // Convert likelihood to 0-5 scale
      status: "want-to-read",
      dateAdded: new Date().toISOString().split("T")[0],
      genre: book.subjects || [],
      mood: book.mood ? [book.mood] : [],
      isbn: "", // We don't have ISBN from discovery books
      pages: 0, // We don't have page count from discovery books - will be updated when viewing details
      publishedYear: book.publishYear || new Date().getFullYear(),
    };

    addUserBook(userBook);
    toast.success(`"${book.title}" added to your library!`);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-32 h-80", // Fixed height for consistency
          image: "h-40", // Reduced image height to fit more content
          title: "text-sm",
          author: "text-xs",
          info: "p-2", // Reduced padding
        };
      case "lg":
        return {
          container: "w-48 h-96", // Fixed height for consistency
          image: "h-64", // Adjusted image height
          title: "text-lg",
          author: "text-base",
          info: "p-4", // Standard padding
        };
      default:
        return {
          container: "w-40 h-88", // Fixed height for consistency
          image: "h-52", // Adjusted image height to fit content below
          title: "text-base",
          author: "text-sm",
          info: "p-3", // Standard padding
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <Link href={`/books/${book.id}`} className="block group">
      <div
        className={`book-card ${sizeClasses.container} bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col`}
      >
        {/* Book Cover */}
        <div className="relative overflow-hidden rounded-t-lg flex-shrink-0">
          {!imageError ? (
            <Image
              src={book.cover}
              alt={book.title}
              width={200}
              height={300}
              className={`${sizeClasses.image} w-full object-cover transition-transform duration-200 group-hover:scale-105`}
              onError={() => setImageError(true)}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0eH/xAAVAQEBAQAAAAAAAAAAAAAAAAAAAQIF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R6i+GCXVw=="
              priority={size === "lg"} // Prioritize larger images
            />
          ) : (
            <div
              className={`${sizeClasses.image} w-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center p-4`}
            >
              <div className="text-center">
                <Image
                  src="/logo.png"
                  alt="BookHaven Logo"
                  width={48}
                  height={48}
                  className="mx-auto mb-2 opacity-60"
                />
                <div className="text-primary-600 dark:text-primary-400 text-xs font-medium line-clamp-2">
                  {book.title}
                </div>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          {(isInLibrary || isLiked) && (
            <div className="absolute top-2 left-2 flex gap-1">
              {isInLibrary && (
                <div className="bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                  In Library
                </div>
              )}
              {isLiked && (
                <div className="bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                  ♥
                </div>
              )}
            </div>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
              <button
                onClick={handleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked
                    ? "bg-red-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400"
                }`}
                title={isLiked ? "Remove from favorites" : "Add to favorites"}
              >
                {isLiked ? (
                  <HeartSolidIcon className="h-4 w-4" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleAddToList}
                className={`p-2 rounded-full transition-colors ${
                  isInLibrary
                    ? "bg-green-500 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400"
                }`}
                title={isInLibrary ? "Already in library" : "Add to library"}
              >
                {isInLibrary ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Book Info - This will take remaining space */}
        <div
          className={`${sizeClasses.info} flex-1 flex flex-col justify-between min-h-0`}
        >
          <div className="flex-1">
            <h3
              className={`${sizeClasses.title} font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors leading-tight`}
            >
              {book.title}
            </h3>
            <p
              className={`${sizeClasses.author} text-gray-600 dark:text-gray-400 mt-1 line-clamp-1`}
            >
              {book.author}
            </p>
          </div>

          {/* Rating and status info at bottom */}
          <div className="mt-2 space-y-1">
            {/* Publication Year */}
            {book.publishYear && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Published: {book.publishYear}
              </div>
            )}

            {/* Likelihood Score or Rating */}
            {(book.likelihoodScore || book.rating) && (
              <div className="flex items-center">
                {book.likelihoodScore ? (
                  // Show likelihood score as percentage
                  <div className="flex items-center">
                    <div className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      {book.likelihoodScore}% match
                    </div>
                    <div className="ml-2 w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-300"
                        style={{ width: `${book.likelihoodScore}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  // Fallback to star rating
                  <div className="flex text-yellow-400 text-xs">
                    {"★".repeat(Math.floor(book.rating || 0))}
                    {"☆".repeat(5 - Math.floor(book.rating || 0))}
                  </div>
                )}
                {book.reviewCount && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1 truncate">
                    (
                    {book.reviewCount > 999
                      ? `${Math.round(book.reviewCount / 1000)}k`
                      : book.reviewCount}
                    )
                  </span>
                )}
              </div>
            )}

            {/* User interaction status */}
            {bookInLibrary && (
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <div className="truncate">
                  Status:{" "}
                  <span className="capitalize">
                    {bookInLibrary.status.replace("-", " ")}
                  </span>
                </div>
                {bookInLibrary.userRating && (
                  <div className="truncate flex items-center">
                    <span className="mr-1">
                      Your rating: {bookInLibrary.userRating}/5
                    </span>
                    <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// CSS classes for line clamping (add to global CSS)
const styles = `
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
`;
