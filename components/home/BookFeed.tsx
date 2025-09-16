"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { OpenLibraryAPI } from "../../lib/openLibrary";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useDailyRefresh } from "../../lib/dailyRefresh";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  LinkIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Social Media Icons
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface FeedBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  tags: string[];
  isLiked: boolean;
  comments?: string[];
}

const CACHE_KEY = "bookfeed_cache";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for variety in content

export function BookFeed() {
  const [books, setBooks] = useState<FeedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<FeedBook | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { checkAndRefresh, getDailyRandomOffset } = useDailyRefresh();
  const swiperRef = useRef<any>(null);

  const fetchDiscoverFeed = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);

      try {
        // Check for daily refresh
        const refreshedToday = checkAndRefresh();
        const shouldForceRefresh = forceRefresh || refreshedToday;

        // Check cache first (unless forcing refresh)
        if (!shouldForceRefresh) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
              console.log("📚 BookFeed: Cache hit - using stored data");
              setBooks(data);
              setLastRefreshTime(new Date(timestamp));
              setLoading(false);
              return;
            } else {
              console.log("📚 BookFeed: Cache expired - fetching fresh data");
            }
          }
        } else {
          console.log("📚 BookFeed: Force refresh - fetching fresh data");
        }

        // Fetch fresh data from multiple genres for variety
        const allGenres = [
          "fiction",
          "mystery",
          "romance",
          "science fiction",
          "fantasy",
          "thriller",
          "historical fiction",
          "literary fiction",
          "horror",
          "biography",
          "young adult",
          "contemporary",
          "adventure",
        ];

        // Use date-based seeding for consistent daily variety
        const today = new Date().toDateString();
        const dailySeed = today.split(" ").join("").charCodeAt(0);

        // Shuffle genres based on daily seed for consistent but changing daily selection
        const shuffledGenres = allGenres.sort((a, b) => {
          const aCode = a.charCodeAt(0) + dailySeed;
          const bCode = b.charCodeAt(0) + dailySeed;
          return (aCode % 100) - (bCode % 100);
        });

        const selectedGenres = shuffledGenres.slice(0, 4); // Pick 4 different genres each day

        const bookPromises = selectedGenres.map((genre, index) =>
          OpenLibraryAPI.searchBooks(
            genre,
            6,
            Math.floor((Math.random() + index) * 20) + (dailySeed % 15) // Date-based offset for daily variety
          )
        );

        const results = await Promise.all(bookPromises);
        const allBooks = results.flatMap((result) => result.docs || []);

        // Filter and format books
        const validBooks = allBooks
          .filter((book) => book.cover_i && book.author_name?.[0] && book.title)
          .slice(0, 8) // Get 8 books for more variety
          .map((book) => {
            const primarySubject = book.subject?.[0] || "Fiction";

            return {
              id: book.key,
              title: book.title,
              author: book.author_name![0], // Safe because we filtered above
              cover: OpenLibraryAPI.getCoverUrl(book.cover_i!, "M"), // Safe because we filtered above
              tags: book.subject?.slice(0, 3) || [primarySubject],
              isLiked: false, // Default to not liked
              comments: [], // Initialize empty comments array
            };
          });

        const currentTime = Date.now();
        setBooks(validBooks);
        setLastRefreshTime(new Date(currentTime));

        // Cache the results
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: validBooks,
            timestamp: currentTime,
          })
        );

        console.log("📚 BookFeed: Fresh data cached successfully");
      } catch (err) {
        console.error("Error fetching discover feed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load discover feed"
        );
      } finally {
        setLoading(false);
      }
    },
    [checkAndRefresh]
  );

  // Auto-refresh hook - refreshes every 30 minutes
  const { manualRefresh, getFormattedTimeUntilNext } = useAutoRefresh({
    interval: 30 * 60 * 1000, // 30 minutes for more frequent updates
    enabled: true,
    onRefresh: () => fetchDiscoverFeed(true),
    initialTimestamp: (() => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          return timestamp;
        }
      } catch (error) {
        console.warn("Failed to get initial timestamp from cache:", error);
      }
      return undefined;
    })(),
  });

  useEffect(() => {
    fetchDiscoverFeed();
  }, [fetchDiscoverFeed]);

  const handleRefresh = () => {
    manualRefresh();
  };

  const handleLike = (bookId: string) => {
    setBooks(
      books.map((book: FeedBook) =>
        book.id === bookId
          ? {
              ...book,
              isLiked: !book.isLiked,
            }
          : book
      )
    );
  };

  const handleComment = (book: FeedBook) => {
    setSelectedBook(book);
    setCommentText("");
    setShowCommentModal(true);
  };

  const postComment = () => {
    if (!selectedBook || !commentText.trim()) return;

    // Add the comment to the book
    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.id === selectedBook.id
          ? {
              ...book,
              comments: [...(book.comments || []), commentText.trim()],
            }
          : book
      )
    );

    // Reset and close modal
    setCommentText("");
    setShowCommentModal(false);

    // Show success message
    alert("Comment posted successfully!");
  };

  const handleShare = (book: FeedBook) => {
    setSelectedBook(book);
    setShowShareModal(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Discover Feed
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600 dark:text-gray-300">
              Fresh books from your reading community
            </p>
            {lastRefreshTime && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                <ClockIcon className="h-3 w-3" />
                <span>Auto-refresh in {getFormattedTimeUntilNext()}</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-200 border border-primary-200 dark:border-primary-800 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
          />
          <span>{loading ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {loading && books.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      ) : error && books.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl p-8 border border-red-200/50 dark:border-red-800/50 shadow-lg">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Failed to load discover feed: {error}
            </p>
            <button
              onClick={() => fetchDiscoverFeed()}
              className="px-6 py-2 bg-gradient-to-t from-primary-500 to-primary-700 text-white rounded-lg hover:from-primary-600 hover:to-primary-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <Swiper
            ref={swiperRef}
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={1}
            navigation={{
              prevEl: ".swiper-button-prev-custom",
              nextEl: ".swiper-button-next-custom",
            }}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            onSlideChange={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            onSwiper={(swiper) => {
              setIsBeginning(swiper.isBeginning);
              setIsEnd(swiper.isEnd);
            }}
            breakpoints={{
              640: {
                slidesPerView: 1.2,
              },
              768: {
                slidesPerView: 1.5,
              },
              1024: {
                slidesPerView: 2,
              },
              1280: {
                slidesPerView: 2.5,
              },
            }}
            className="book-feed-swiper"
          >
            {books.map((book: FeedBook) => (
              <SwiperSlide key={book.id}>
                <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-200 p-6 h-full">
                  <div className="flex space-x-4">
                    {/* Book cover */}
                    <div className="flex-shrink-0">
                      <Image
                        src={book.cover}
                        alt={book.title}
                        width={96}
                        height={144}
                        className="w-24 h-36 object-cover rounded-lg shadow-sm border border-white/20"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0eH/xAAVAQEBAQAAAAAAAAAAAAAAAAAAAQIF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R6i+GCXVw=="
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {book.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {book.author}
                          </p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {book.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800 dark:from-primary-900/40 dark:to-secondary-900/40 dark:text-primary-300 border border-primary-200/50 dark:border-primary-800/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLike(book.id)}
                            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            {book.isLiked ? (
                              <HeartSolidIcon className="h-5 w-5 text-red-500" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleComment(book)}
                            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                          >
                            <ChatBubbleLeftIcon className="h-5 w-5" />
                            {book.comments && book.comments.length > 0 && (
                              <span className="text-xs">
                                {book.comments.length}
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => handleShare(book)}
                            className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                          >
                            <ShareIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <button className="px-3 py-1.5  bg-gradient-to-t from-primary-500 to-primary-700 text-white text-sm font-medium rounded-lg hover:from-primary-600 hover:to-primary-600 transition-all duration-200 hover:scale-105 shadow-md">
                          Add to List
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom navigation buttons */}
          {!isBeginning && (
            <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 dark:border-gray-700/20 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-200 hover:shadow-xl">
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}
          {!isEnd && (
            <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 dark:border-gray-700/20 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-200 hover:shadow-xl">
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comments for &ldquo;{selectedBook.title}&rdquo;
              </h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              {/* Show existing comments */}
              {selectedBook.comments && selectedBook.comments.length > 0 && (
                <div className="mb-4 max-h-32 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Comments ({selectedBook.comments.length}):
                  </h4>
                  {selectedBook.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 p-2 rounded mb-2"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText("");
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={postComment}
                disabled={!commentText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg hover:from-primary-600 hover:to-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg"
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Share &ldquo;{selectedBook.title}&rdquo;
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  copyToClipboard(
                    `${window.location.origin}/books/${selectedBook.id}`
                  );
                  setShowShareModal(false);
                }}
                className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center space-x-3"
              >
                <LinkIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=Check out this book: ${selectedBook.title} by ${selectedBook.author}&url=${window.location.origin}/books/${selectedBook.id}`,
                    "_blank"
                  );
                  setShowShareModal(false);
                }}
                className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center space-x-3"
              >
                <TwitterIcon className="h-5 w-5 text-blue-500" />
                <span>Share on Twitter</span>
              </button>
              <button
                onClick={() => {
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${window.location.origin}/books/${selectedBook.id}`,
                    "_blank"
                  );
                  setShowShareModal(false);
                }}
                className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center space-x-3"
              >
                <FacebookIcon className="h-5 w-5 text-blue-600" />
                <span>Share on Facebook</span>
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: selectedBook.title,
                      text: `Check out this book: ${selectedBook.title} by ${selectedBook.author}`,
                      url: `${window.location.origin}/books/${selectedBook.id}`,
                    });
                  }
                  setShowShareModal(false);
                }}
                className="w-full p-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center space-x-3"
              >
                <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
                <span>Share via Device</span>
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full mt-4 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
