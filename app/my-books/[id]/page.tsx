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
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";
import { useAppStore } from "../../../stores/useAppStore";

export default function UserBookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;

  const { userBooks, updateUserBook, removeUserBook } = useAppStore();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [newPage, setNewPage] = useState(0);

  const book = userBooks.find((b) => b.id === bookId);

  useEffect(() => {
    if (!book) {
      toast.error("Book not found in your library");
      router.push("/my-books");
    }
  }, [book, router]);

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Book not found
          </div>
        </div>
      </div>
    );
  }

  const handleReviewSubmit = () => {
    if (reviewText.trim()) {
      updateUserBook(bookId, {
        userReview: reviewText.trim(),
        userRating: reviewRating || book.userRating,
        reviewDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Review saved successfully!");
      setReviewModalOpen(false);
      setReviewText("");
      setReviewRating(0);
    }
  };

  const handleProgressUpdate = () => {
    if (newPage >= 0) {
      const updates: any = { currentPage: newPage };

      if (newPage >= book.pages) {
        updates.status = "read";
        updates.finishedReading = new Date().toISOString().split("T")[0];
        toast.success(`Congratulations! You finished "${book.title}"!`);
      } else {
        const progress = Math.round((newPage / book.pages) * 100);
        toast.success(`Progress updated: ${progress}% complete`);
      }

      updateUserBook(bookId, updates);
      setProgressModalOpen(false);
      setNewPage(0);
    }
  };

  const handleStatusChange = (
    newStatus: "want-to-read" | "currently-reading" | "read"
  ) => {
    const updates: any = { status: newStatus };

    if (newStatus === "currently-reading" && !book.startedReading) {
      updates.startedReading = new Date().toISOString().split("T")[0];
    }

    if (newStatus === "read" && !book.finishedReading) {
      updates.finishedReading = new Date().toISOString().split("T")[0];
      updates.currentPage = book.pages;
    }

    updateUserBook(bookId, updates);
    toast.success(`Book moved to ${newStatus.replace("-", " ")}`);
  };

  const calculateProgress = () => {
    if (book.status !== "currently-reading" || !book.currentPage) return 0;
    return Math.round((book.currentPage / book.pages) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "want-to-read":
        return "bg-blue-500";
      case "currently-reading":
        return "bg-green-500";
      case "read":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "want-to-read":
        return "Want to Read";
      case "currently-reading":
        return "Currently Reading";
      case "read":
        return "Finished";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/my-books"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to My Books</span>
            </Link>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  navigator.share?.({
                    title: book.title,
                    text: `Check out "${book.title}" by ${book.author}`,
                    url: window.location.href,
                  }) || toast.success("Link copied!");
                }}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ShareIcon className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to remove this book from your library?"
                    )
                  ) {
                    removeUserBook(bookId);
                    router.push("/my-books");
                    toast.success("Book removed from library");
                  }
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Book Cover & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="relative">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    width={300}
                    height={450}
                    className="w-full h-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/logo.png";
                    }}
                  />

                  {/* Status Badge */}
                  <div
                    className={`absolute top-2 left-2 ${getStatusColor(
                      book.status
                    )} text-white px-2 py-1 rounded text-xs font-medium`}
                  >
                    {getStatusText(book.status)}
                  </div>

                  {/* User Rating */}
                  {book.userRating && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 bg-yellow-400 text-gray-900 rounded px-2 py-1">
                      <StarIconSolid className="h-3 w-3" />
                      <span className="text-xs font-bold">
                        {book.userRating}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress for Currently Reading */}
                {book.status === "currently-reading" && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Reading Progress
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {calculateProgress()}%
                      </span>
                    </div>

                    <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress()}%` }}
                      />
                    </div>

                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      Page {book.currentPage || 0} of {book.pages}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {/* Status Change Buttons */}
                  {book.status !== "want-to-read" && (
                    <button
                      onClick={() => handleStatusChange("want-to-read")}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Mark as Want to Read
                    </button>
                  )}

                  {book.status !== "currently-reading" && (
                    <button
                      onClick={() => handleStatusChange("currently-reading")}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Reading
                    </button>
                  )}

                  {book.status !== "read" && (
                    <button
                      onClick={() => handleStatusChange("read")}
                      className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Mark as Finished
                    </button>
                  )}

                  {/* Progress Update for Currently Reading */}
                  {book.status === "currently-reading" && (
                    <button
                      onClick={() => {
                        setNewPage(book.currentPage || 0);
                        setProgressModalOpen(true);
                      }}
                      className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <ClockIcon className="h-4 w-4" />
                      <span>Update Progress</span>
                    </button>
                  )}

                  {/* Review Button */}
                  <button
                    onClick={() => {
                      setReviewText(book.userReview || "");
                      setReviewRating(book.userRating || 0);
                      setReviewModalOpen(true);
                    }}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span>
                      {book.userReview ? "Edit Review" : "Add Review"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {/* Title & Author */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {book.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  by {book.author}
                </p>
              </div>

              {/* Book Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {book.pages}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pages
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {book.publishedYear}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Published
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {book.rating}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Rating
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {book.userRating || "—"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Your Rating
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Description
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Genres */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Genres
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reading Dates */}
              {(book.startedReading || book.finishedReading) && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Reading Timeline
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {book.startedReading && (
                      <p>
                        Started:{" "}
                        {new Date(book.startedReading).toLocaleDateString()}
                      </p>
                    )}
                    {book.finishedReading && (
                      <p>
                        Finished:{" "}
                        {new Date(book.finishedReading).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* User Review */}
              {book.userReview && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      My Review
                    </h2>
                    <button
                      onClick={() => {
                        setReviewText(book.userReview || "");
                        setReviewRating(book.userRating || 0);
                        setReviewModalOpen(true);
                      }}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      "{book.userReview}"
                    </p>
                    {book.reviewDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        Reviewed on{" "}
                        {new Date(book.reviewDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {book.notes && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Notes
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 italic">
                      "{book.notes}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Update Modal */}
      {progressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Update Reading Progress
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Page (out of {book.pages})
                </label>
                <input
                  type="number"
                  min="0"
                  max={book.pages}
                  value={newPage}
                  onChange={(e) =>
                    setNewPage(
                      Math.max(
                        0,
                        Math.min(book.pages, parseInt(e.target.value) || 0)
                      )
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              {newPage > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Progress:{" "}
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {Math.round((newPage / book.pages) * 100)}%
                  </span>
                </div>
              )}
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              <button
                onClick={() => setProgressModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleProgressUpdate}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {book.userReview ? "Edit Review" : "Write a Review"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating (optional)
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`h-6 w-6 ${
                        star <= reviewRating
                          ? "text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      } hover:text-yellow-400 transition-colors`}
                    >
                      <StarIconSolid />
                    </button>
                  ))}
                  {reviewRating > 0 && (
                    <button
                      onClick={() => setReviewRating(0)}
                      className="ml-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  rows={6}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 resize-none"
                  placeholder="Share your thoughts about this book..."
                  autoFocus
                />
              </div>
            </div>
            <div className="flex space-x-3 justify-end mt-6">
              {book.userReview && (
                <button
                  onClick={() => {
                    updateUserBook(bookId, {
                      userReview: undefined,
                      reviewDate: undefined,
                    });
                    toast.success("Review deleted");
                    setReviewModalOpen(false);
                  }}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Delete Review
                </button>
              )}
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                disabled={!reviewText.trim()}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
