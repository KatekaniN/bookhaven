"use client";

import { useState } from "react";
import Link from "next/link";
import { HeartIcon, PlusIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { useAppStore, UserBook } from "../../stores/useAppStore";
import toast from "react-hot-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
  subjects?: string[];
  mood?: string;
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
  const { addUserBook, userBooks } = useAppStore();
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Check if book is already in user's library
  const isInLibrary = userBooks.some((userBook) => userBook.id === book.id);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
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
      rating: book.rating || 0,
      status: "want-to-read",
      dateAdded: new Date().toISOString().split("T")[0],
      genre: book.subjects || [],
      mood: book.mood ? [book.mood] : [],
      isbn: "", // We don't have ISBN from discovery books
      pages: 0, // We don't have page count from discovery books
      publishedYear: new Date().getFullYear(), // Default to current year
    };

    addUserBook(userBook);
    toast.success(`"${book.title}" added to your library!`);
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "w-32",
          image: "h-48",
          title: "text-sm",
          author: "text-xs",
        };
      case "lg":
        return {
          container: "w-48",
          image: "h-72",
          title: "text-lg",
          author: "text-base",
        };
      default:
        return {
          container: "w-40",
          image: "h-60",
          title: "text-base",
          author: "text-sm",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <Link href={`/books/${book.id}`} className="block group">
      <div className={`book-card ${sizeClasses.container}`}>
        {/* Book Cover */}
        <div className="relative overflow-hidden rounded-t-lg">
          {!imageError ? (
            <img
              src={book.cover}
              alt={book.title}
              className={`${sizeClasses.image} w-full object-cover transition-transform duration-200 group-hover:scale-105`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className={`${sizeClasses.image} w-full bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 flex items-center justify-center p-4`}
            >
              <div className="text-center">
                <img
                  src="/logo.png"
                  alt="BookHaven Logo"
                  className="w-16 h-16 mx-auto mb-2 opacity-60"
                />
                <div className="text-primary-600 dark:text-primary-400 text-xs font-medium line-clamp-2">
                  {book.title}
                </div>
              </div>
            </div>
          )}

          {/* Hover Actions */}
          {showActions && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
              <button
                onClick={handleLike}
                className="p-2 bg-white dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                {isLiked ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
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
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="p-3">
          <h3
            className={`${sizeClasses.title} font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors`}
          >
            {book.title}
          </h3>
          <p
            className={`${sizeClasses.author} text-gray-600 dark:text-gray-400 mt-1 line-clamp-1`}
          >
            {book.author}
          </p>

          {book.rating && (
            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400 text-sm">
                {"★".repeat(Math.floor(book.rating))}
                {"☆".repeat(5 - Math.floor(book.rating))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                ({book.reviewCount?.toLocaleString()})
              </span>
            </div>
          )}
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
