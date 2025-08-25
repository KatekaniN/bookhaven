"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HeartIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PlusIcon,
  StarIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";
import { useAppStore, UserBook } from "../../stores/useAppStore";

export default function MyBooksPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { userBooks, addUserBook, updateUserBook, removeUserBook } =
    useAppStore();
  const [filteredBooks, setFilteredBooks] = useState<UserBook[]>([]);
  const [activeTab, setActiveTab] = useState<
    "all" | "want-to-read" | "currently-reading" | "read"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<
    "dateAdded" | "title" | "author" | "rating"
  >("dateAdded");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [progressModalOpen, setProgressModalOpen] = useState<string | null>(
    null
  );
  const [newPage, setNewPage] = useState<number>(0);
  const [reviewModalOpen, setReviewModalOpen] = useState<string | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState<number>(0);

  // Books are now populated through onboarding ratings and user actions

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpen(null);
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [dropdownOpen]);

  // Initialize filtered books from store
  useEffect(() => {
    setFilteredBooks(userBooks);
    // Clear image errors when books change
    setImageErrors(new Set());
  }, [userBooks]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = userBooks;

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((book) => book.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.genre.some((g) =>
            g.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Sort books
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "author":
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case "rating":
          aValue = a.userRating || a.rating;
          bValue = b.userRating || b.rating;
          break;
        default: // dateAdded
          aValue = new Date(a.dateAdded).getTime();
          bValue = new Date(b.dateAdded).getTime();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredBooks(filtered);
  }, [userBooks, activeTab, searchQuery, sortBy, sortOrder]);

  const getStatusCounts = () => {
    return {
      all: userBooks.length,
      "want-to-read": userBooks.filter((b) => b.status === "want-to-read")
        .length,
      "currently-reading": userBooks.filter(
        (b) => b.status === "currently-reading"
      ).length,
      read: userBooks.filter((b) => b.status === "read").length,
    };
  };

  const updateBookStatus = (bookId: string, newStatus: UserBook["status"]) => {
    updateUserBook(bookId, { status: newStatus });
    toast.success(`Book moved to ${newStatus.replace("-", " ")}`);
  };

  const removeBook = (bookId: string) => {
    removeUserBook(bookId);
    toast.success("Book removed from library");
  };

  const handleProgressUpdate = (bookId: string) => {
    const book = userBooks.find((b) => b.id === bookId);
    if (book && book.status === "currently-reading") {
      setNewPage(book.currentPage || 0);
      setProgressModalOpen(bookId);
    }
  };

  const submitProgressUpdate = () => {
    if (progressModalOpen && newPage >= 0) {
      const book = userBooks.find((b) => b.id === progressModalOpen);
      if (book && newPage <= book.pages) {
        const progressPercentage = Math.round((newPage / book.pages) * 100);
        updateUserBook(book.id, {
          currentPage: newPage,
        });
        setProgressModalOpen(null);
        setNewPage(0);
        toast.success("Progress updated!");
      }
    }
  };

  const handleAddReview = (bookId: string) => {
    const book = userBooks.find((b) => b.id === bookId);
    if (book) {
      setReviewText(book.userReview || "");
      setReviewRating(book.userRating || 0);
      setReviewModalOpen(bookId);
    }
  };

  const submitReview = () => {
    if (reviewModalOpen && reviewText.trim()) {
      updateUserBook(reviewModalOpen, {
        userReview: reviewText.trim(),
        userRating: reviewRating || undefined,
        reviewDate: new Date().toISOString().split("T")[0],
      });
      toast.success("Review saved successfully!");
      setReviewModalOpen(null);
      setReviewText("");
      setReviewRating(0);
    }
  };

  const deleteReview = (bookId: string) => {
    updateUserBook(bookId, {
      userReview: undefined,
      reviewDate: undefined,
      userRating: undefined,
    });
    toast.success("Review deleted");
    setReviewModalOpen(null);
  };

  const handleImageError = (bookId: string) => {
    setImageErrors((prev) => {
      const newSet = new Set(prev);
      newSet.add(bookId);
      return newSet;
    });
  };

  const getImageSrc = (book: UserBook) => {
    if (imageErrors.has(book.id)) {
      return "/placeholder-book.jpg";
    }
    return book.cover || "/placeholder-book.jpg";
  };

  const statusCounts = getStatusCounts();

  const tabs = [
    {
      id: "all",
      name: "All Books",
      count: statusCounts.all,
      icon: BookOpenIcon,
    },
    {
      id: "want-to-read",
      name: "Want to Read",
      count: statusCounts["want-to-read"],
      icon: PlusIcon,
    },
    {
      id: "currently-reading",
      name: "Currently Reading",
      count: statusCounts["currently-reading"],
      icon: ClockIcon,
    },
    {
      id: "read",
      name: "Read",
      count: statusCounts.read,
      icon: CheckCircleIcon,
    },
  ] as const;

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sign in to view your books
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access your personal library
          </p>
          <Link
            href="/auth/signin"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Books
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your reading journey and discover your next favorite book
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
                <span className="bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search books, authors, or genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                {/* Book Cover */}
                <div className="relative h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {imageErrors.has(book.id) ? (
                    // Placeholder with book icon when image fails
                    <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                      <BookOpenIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-2" />
                      <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                        No Cover Available
                      </span>
                    </div>
                  ) : (
                    <Image
                      src={getImageSrc(book)}
                      alt={book.title}
                      fill
                      className="object-cover"
                      onError={() => handleImageError(book.id)}
                      priority={false}
                    />
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        book.status === "read"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : book.status === "currently-reading"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {book.status === "want-to-read"
                        ? "Want to Read"
                        : book.status === "currently-reading"
                        ? "Reading"
                        : "Read"}
                    </span>
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpen(
                          dropdownOpen === book.id ? null : book.id
                        );
                      }}
                      className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {dropdownOpen === book.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                        <div className="py-1">
                          <button
                            onClick={() =>
                              updateBookStatus(book.id, "want-to-read")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Want to Read
                          </button>
                          <button
                            onClick={() =>
                              updateBookStatus(book.id, "currently-reading")
                            }
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Currently Reading
                          </button>
                          <button
                            onClick={() => updateBookStatus(book.id, "read")}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Read
                          </button>
                          <hr className="my-1 border-gray-200 dark:border-gray-600" />
                          <button
                            onClick={() => removeBook(book.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Book Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {book.author}
                  </p>

                  {/* Progress Section for Currently Reading */}
                  {book.status === "currently-reading" && book.currentPage && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {Math.round((book.currentPage / book.pages) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full"
                          style={{
                            width: `${(book.currentPage / book.pages) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Page {book.currentPage} of {book.pages}
                      </p>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (book.userRating || book.rating)
                              ? "text-yellow-400 fill-current"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {book.userRating || book.rating}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/books/${book.id}`}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View</span>
                    </Link>

                    <div className="flex items-center space-x-2">
                      {book.status === "currently-reading" && (
                        <button
                          onClick={() => handleProgressUpdate(book.id)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Update Progress"
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleAddReview(book.id)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        title={book.userReview ? "Edit Review" : "Add Review"}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* User Review Preview */}
                  {book.userReview && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        "{book.userReview}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery.trim() || activeTab !== "all"
                ? "No books found"
                : "No books in your library yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery.trim() || activeTab !== "all"
                ? "Try adjusting your search or filters"
                : "Start building your personal library by discovering new books"}
            </p>
            <Link
              href="/explore"
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Discover Books
            </Link>
          </div>
        )}

        {/* Reading Stats */}
        {userBooks.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Reading Stats
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {userBooks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Books
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statusCounts.read}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Books Read
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {statusCounts["currently-reading"]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Currently Reading
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {statusCounts["want-to-read"]}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Want to Read
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Update Modal */}
      {progressModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Update Reading Progress
              </h3>
              {(() => {
                const book = userBooks.find((b) => b.id === progressModalOpen);
                return book ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>{book.title}</strong> by {book.author}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Page
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={book.pages}
                        value={newPage}
                        onChange={(e) =>
                          setNewPage(parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total pages: {book.pages}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setProgressModalOpen(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitProgressUpdate}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {(() => {
                  const book = userBooks.find((b) => b.id === reviewModalOpen);
                  return book?.userReview ? "Edit Review" : "Write a Review";
                })()}
              </h3>
              {(() => {
                const book = userBooks.find((b) => b.id === reviewModalOpen);
                return book ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>{book.title}</strong> by {book.author}
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            {star <= reviewRating ? (
                              <StarIconSolid className="h-6 w-6 text-yellow-400" />
                            ) : (
                              <StarIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Review Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Review
                      </label>
                      <textarea
                        rows={6}
                        maxLength={1000}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Share your thoughts about this book - your impressions, favorite moments, what you're learning, or how it's making you feel..."
                        autoFocus
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {reviewText.length}/1000 characters
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="flex space-x-3 justify-end">
              {(() => {
                const book = userBooks.find((b) => b.id === reviewModalOpen);
                return book?.userReview ? (
                  <button
                    onClick={() => deleteReview(book.id)}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    Delete Review
                  </button>
                ) : null;
              })()}
              <button
                onClick={() => setReviewModalOpen(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
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
