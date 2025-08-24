"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCards, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppStore, UserBook } from "../../stores/useAppStore";
import toast from "react-hot-toast";
import {
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  StarIcon,
  PlayIcon,
  PauseIcon,
  XMarkIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon,
} from "@heroicons/react/24/solid";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-cards";
import "swiper/css/pagination";

interface BookDiscoveryCard {
  id: string;
  title: string;
  author: string;
  cover: string;
  rating: number;
  reviewCount: number;
  shortDescription: string;
  mood: string;
  tags: string[];
  audioPreview?: string;
}

const DISCOVERY_BOOKS: BookDiscoveryCard[] = [
  {
    id: "1",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    rating: 4.6,
    reviewCount: 125000,
    shortDescription:
      "A reclusive Hollywood icon finally tells her story to an unknown journalist. Secrets, scandals, and the price of fame in golden age Hollywood unfold in this captivating tale of love, ambition, and the choices we make for success.",
    mood: "Glamorous Drama",
    tags: ["LGBTQ+", "Historical Fiction", "Romance"],
  },
  {
    id: "2",
    title: "Atomic Habits",
    author: "James Clear",
    cover: "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
    rating: 4.8,
    reviewCount: 89000,
    shortDescription:
      "Tiny changes, remarkable results. Transform your life with the power of atomic habits and build systems that compound over time. Learn the surprising power of small changes and how they can make a big difference.",
    mood: "Life-Changing",
    tags: ["Self-Help", "Productivity", "Psychology"],
  },
  {
    id: "3",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    cover: "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg",
    rating: 4.3,
    reviewCount: 156000,
    shortDescription:
      "A woman refuses to speak after allegedly murdering her husband. A psychotherapist becomes obsessed with treating her and uncovering the truth behind her silence in this psychological thriller.",
    mood: "Mind-Bending Thriller",
    tags: ["Psychological Thriller", "Mystery", "Suspense"],
  },
  {
    id: "4",
    title: "Klara and the Sun",
    author: "Kazuo Ishiguro",
    cover: "https://covers.openlibrary.org/b/isbn/9780571364886-L.jpg",
    rating: 4.2,
    reviewCount: 67000,
    shortDescription:
      "An artificial friend observes the world with wonder and heartbreak. A story about love, sacrifice, and what it means to be human, told through the eyes of an extraordinary narrator.",
    mood: "Philosophical Sci-Fi",
    tags: ["Science Fiction", "Literary Fiction", "AI"],
  },
  {
    id: "5",
    title: "The Midnight Library",
    author: "Matt Haig",
    cover: "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
    rating: 4.4,
    reviewCount: 198000,
    shortDescription:
      "Between life and death lies a library of infinite possibilities. Nora Seed discovers the lives she could have lived and learns about the power of choice, regret, and second chances.",
    mood: "Uplifting Fantasy",
    tags: ["Fantasy", "Philosophy", "Self-Discovery"],
  },
  {
    id: "6",
    title: "Educated",
    author: "Tara Westover",
    cover: "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
    rating: 4.7,
    reviewCount: 234000,
    shortDescription:
      "A powerful memoir about education, family, and the struggle between loyalty and self-discovery in rural Idaho. A story of transformation through learning and the price of knowledge.",
    mood: "Inspiring Memoir",
    tags: ["Memoir", "Biography", "Education"],
  },
  {
    id: "7",
    title: "Dune",
    author: "Frank Herbert",
    cover: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
    rating: 4.5,
    reviewCount: 145000,
    shortDescription:
      "On the desert planet Arrakis, young Paul Atreides must navigate politics, religion, and ecology to fulfill his destiny. An epic tale of power, betrayal, and the future of humanity.",
    mood: "Epic Space Opera",
    tags: ["Science Fiction", "Adventure", "Politics"],
  },
  {
    id: "8",
    title: "The Handmaid's Tale",
    author: "Margaret Atwood",
    cover: "https://covers.openlibrary.org/b/isbn/9780385490818-L.jpg",
    rating: 4.4,
    reviewCount: 178000,
    shortDescription:
      "In a dystopian future, fertile women are enslaved to bear children for the ruling class. A story of resistance, hope, and the power of individual agency in the face of oppression.",
    mood: "Dystopian Warning",
    tags: ["Dystopian", "Feminism", "Political Fiction"],
  },
  {
    id: "9",
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    cover: "https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg",
    rating: 4.3,
    reviewCount: 267000,
    shortDescription:
      "A mystery about a young woman who raised herself in the marshes of North Carolina and becomes a murder suspect. A coming-of-age story intertwined with a gripping murder mystery.",
    mood: "Southern Gothic Mystery",
    tags: ["Mystery", "Nature", "Coming of Age"],
  },
  {
    id: "10",
    title: "The Alchemist",
    author: "Paulo Coelho",
    cover: "https://covers.openlibrary.org/b/isbn/9780061122415-L.jpg",
    rating: 4.2,
    reviewCount: 187000,
    shortDescription:
      "A young shepherd's journey to find treasure teaches him about following his dreams and listening to his heart. A philosophical tale about destiny, love, and the pursuit of one's dreams.",
    mood: "Philosophical Journey",
    tags: ["Philosophy", "Adventure", "Inspiration"],
  },
  {
    id: "11",
    title: "Circe",
    author: "Madeline Miller",
    cover: "https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg",
    rating: 4.5,
    reviewCount: 123000,
    shortDescription:
      "The untold story of the Greek goddess Circe, her exile, and her encounters with famous mythological figures. A tale of transformation, power, and finding one's place in the world.",
    mood: "Mythological Fantasy",
    tags: ["Fantasy", "Mythology", "Feminism"],
  },
  {
    id: "12",
    title: "The Song of Achilles",
    author: "Madeline Miller",
    cover: "https://covers.openlibrary.org/b/isbn/9780062060624-L.jpg",
    rating: 4.6,
    reviewCount: 156000,
    shortDescription:
      "The love story between Achilles and Patroclus, retold with beauty and heartbreak from the Trojan War. An epic tale of friendship, love, and the cost of glory.",
    mood: "Epic Romance",
    tags: ["LGBTQ+", "Historical Fiction", "Mythology"],
  },
  {
    id: "13",
    title: "The Psychology of Money",
    author: "Morgan Housel",
    cover: "https://covers.openlibrary.org/b/isbn/9780857197689-L.jpg",
    rating: 4.7,
    reviewCount: 98000,
    shortDescription:
      "How we think about money affects our financial decisions. Timeless lessons on wealth, greed, and happiness that go beyond numbers and formulas to reveal the human side of finance.",
    mood: "Financial Wisdom",
    tags: ["Finance", "Psychology", "Business"],
  },
  {
    id: "14",
    title: "Becoming",
    author: "Michelle Obama",
    cover: "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
    rating: 4.8,
    reviewCount: 189000,
    shortDescription:
      "The deeply personal memoir of the former First Lady, chronicling her journey from Chicago to the White House. An inspiring story of finding your voice and using it for good.",
    mood: "Inspiring Memoir",
    tags: ["Memoir", "Politics", "Inspiration"],
  },
  {
    id: "15",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    cover: "https://covers.openlibrary.org/b/isbn/9780241425442-L.jpg",
    rating: 4.4,
    reviewCount: 87000,
    shortDescription:
      "Four retirees in a peaceful English village meet weekly to investigate cold cases. Comedy meets mystery in this delightful tale of friendship, aging, and the thrill of the chase.",
    mood: "Cozy Mystery",
    tags: ["Mystery", "Comedy", "Crime"],
  },
];

export default function DiscoveryPage() {
  const router = useRouter();
  const { addUserBook, userBooks } = useAppStore();
  const [currentBook, setCurrentBook] = useState(0);
  const [likedBooks, setLikedBooks] = useState<Set<string>>(new Set());
  const [savedBooks, setSavedBooks] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewBook, setPreviewBook] = useState<BookDiscoveryCard | null>(
    null
  );

  const handleLike = (bookId: string) => {
    setLikedBooks((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(bookId)) {
        newLiked.delete(bookId);
      } else {
        newLiked.add(bookId);
      }
      return newLiked;
    });
  };

  const handleSave = (bookId: string) => {
    setSavedBooks((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(bookId)) {
        newSaved.delete(bookId);
      } else {
        newSaved.add(bookId);
      }
      return newSaved;
    });
  };

  const handleSwipeUp = () => {
    if (swiperInstance) {
      swiperInstance.slideNext();
    }
  };

  const handleSwipeDown = () => {
    if (swiperInstance) {
      swiperInstance.slidePrev();
    }
  };

  const currentBookData = DISCOVERY_BOOKS[currentBook];

  const handleGoHome = () => {
    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleAddToLibrary = (bookId: string) => {
    const book = DISCOVERY_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    // Check if book is already in library
    const isInLibrary = userBooks.some((userBook) => userBook.id === bookId);

    if (isInLibrary) {
      toast.success(`"${book.title}" is already in your library!`);
      return;
    }

    // Transform the discovery book into a UserBook format
    const userBook: UserBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      description: book.shortDescription,
      rating: book.rating,
      status: "want-to-read",
      dateAdded: new Date().toISOString().split("T")[0],
      genre: book.tags,
      mood: [book.mood],
      isbn: "", // We don't have ISBN from discovery books
      pages: 0, // We don't have page count from discovery books
      publishedYear: new Date().getFullYear(), // Default to current year
    };

    addUserBook(userBook);
    toast.success(`"${book.title}" added to your library!`);
  };

  const handlePreview = (bookId: string) => {
    const book = DISCOVERY_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    setPreviewBook(book);
    setShowPreview(true);
  };

  const handleAddToWantToRead = (bookId: string) => {
    const book = DISCOVERY_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    // Add to want-to-read list (same as save functionality)
    handleSave(bookId);

    if (!savedBooks.has(bookId)) {
      toast.success(`"${book.title}" added to Want to Read!`);
    }
  };

  const handleReadNow = (bookId: string) => {
    const book = DISCOVERY_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    toast.loading(`Opening "${book.title}"...`, { duration: 1000 });

    // Simulate opening the book for reading
    setTimeout(() => {
      toast.success(`Starting to read "${book.title}"`, { duration: 2000 });
      // In a real app, this would navigate to the reading interface
      console.log("Starting to read:", book.title);
    }, 1000);
  };

  const handleShare = (bookId: string) => {
    const book = DISCOVERY_BOOKS.find((b) => b.id === bookId);
    if (!book) return;

    const shareData = {
      title: book.title,
      text: `Check out "${book.title}" by ${book.author}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          toast.success("Book shared successfully!");
        })
        .catch(() => {
          // Fallback to clipboard
          navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
          toast.success("Book link copied to clipboard!");
        });
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      toast.success("Book link copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleGoBack}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <div className="text-lg font-semibold">Discover</div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGoHome}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <HomeIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-full overflow-hidden">
        <Swiper
          direction="vertical"
          effect="cards"
          grabCursor={true}
          modules={[EffectCards, Pagination]}
          className="h-full"
          onSwiper={setSwiperInstance}
          onSlideChange={(swiper) => setCurrentBook(swiper.activeIndex)}
          loop={true}
          cardsEffect={{
            perSlideOffset: 8,
            perSlideRotate: 2,
            rotate: true,
            slideShadows: true,
          }}
        >
          {DISCOVERY_BOOKS.map((book, index) => (
            <SwiperSlide key={book.id}>
              <div className="relative h-full bg-gradient-to-br from-gray-900 via-slate-800 to-black">
                {/* Subtle background pattern */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />

                {/* Scrollable Content Container */}
                <div className="relative h-full overflow-y-auto">
                  {/* Content */}
                  <div className="p-4 sm:p-6 lg:p-8 text-white pt-20 sm:pt-24 pb-32 sm:pb-40">
                    {/* Book Counter */}
                    <div className="text-center text-white/80 text-sm mb-6">
                      {currentBook + 1} of {DISCOVERY_BOOKS.length}
                    </div>

                    {/* Book Layout */}
                    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-start lg:space-x-8 space-y-6 lg:space-y-0">
                      {/* Book Cover */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <Image
                            src={book.cover}
                            alt={book.title}
                            width={180}
                            height={270}
                            className="w-[180px] h-[270px] sm:w-[200px] sm:h-[300px] lg:w-[220px] lg:h-[330px] rounded-xl shadow-2xl border-2 border-white/20 mx-auto"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder-book.svg";
                            }}
                          />
                          {/* Rating Badge on Cover */}
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 flex items-center gap-1 shadow-lg">
                            <StarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white fill-current" />
                            <span className="text-white text-xs sm:text-sm font-bold">
                              {book.rating}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 w-full max-w-md lg:max-w-lg space-y-4 sm:space-y-5 text-center lg:text-left">
                        {/* Title and Author */}
                        <div className="space-y-3">
                          <h2 className="text-2xl sm:text-3xl lg:text-3xl font-bold leading-tight">
                            {book.title}
                          </h2>
                          <p className="text-lg sm:text-xl text-blue-200">
                            by {book.author}
                          </p>
                          <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium border border-purple-400/50">
                            {book.mood}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/10">
                          <h3 className="text-base sm:text-lg font-semibold mb-3 text-white">
                            About this book
                          </h3>
                          <p className="text-gray-200 leading-relaxed text-sm sm:text-base">
                            {book.shortDescription}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                          {book.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm border border-white/25 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Reviews */}
                        <div className="text-sm text-gray-300 text-center lg:text-left">
                          ⭐ {book.reviewCount.toLocaleString()} reader reviews
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 pt-4">
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => handleAddToLibrary(book.id)}
                              className={`flex-1 py-3 px-4 sm:px-6 rounded-full font-semibold transition-all duration-200 text-sm sm:text-base ${
                                userBooks.some(
                                  (userBook) => userBook.id === book.id
                                )
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                                  : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                              }`}
                            >
                              {userBooks.some(
                                (userBook) => userBook.id === book.id
                              )
                                ? "In Library ✓"
                                : "Add to Library"}
                            </button>
                            <button
                              onClick={() => handlePreview(book.id)}
                              className="flex-1 sm:flex-none bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-3 px-4 sm:px-6 rounded-full font-semibold transition-all duration-200 border border-white/30 text-sm sm:text-base"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Action Buttons */}
        <div className="absolute right-2 sm:right-4 bottom-28 sm:bottom-32 z-50 flex flex-col space-y-2 sm:space-y-3">
          <button
            onClick={() => handleLike(currentBookData.id)}
            className="p-2 sm:p-3 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200 border border-white/20"
          >
            {likedBooks.has(currentBookData.id) ? (
              <HeartSolidIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            onClick={() => handleSave(currentBookData.id)}
            className="p-2 sm:p-3 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200 border border-white/20"
          >
            {savedBooks.has(currentBookData.id) ? (
              <BookmarkSolidIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-400" />
            ) : (
              <BookmarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            onClick={() => handleShare(currentBookData.id)}
            className="p-2 sm:p-3 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200 border border-white/20"
          >
            <ShareIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {currentBookData.audioPreview && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 sm:p-3 rounded-full bg-primary-500/80 backdrop-blur-sm text-white hover:bg-primary-500 transition-all duration-200 border border-primary-400/50"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <PlayIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Hints */}
        <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col space-y-2 sm:space-y-3">
          <button
            onClick={handleSwipeUp}
            className="p-1.5 sm:p-2 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200 border border-white/20"
          >
            <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="text-white/60 text-xs text-center px-1">
            {currentBook + 1}/{DISCOVERY_BOOKS.length}
          </div>
          <button
            onClick={handleSwipeDown}
            className="p-1.5 sm:p-2 rounded-full bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200 border border-white/20"
          >
            <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-50 p-3 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
              onClick={() => handleAddToWantToRead(currentBookData.id)}
              className="btn btn-primary flex-1 mx-1 sm:mx-2 bg-primary-600 hover:bg-primary-700 transition-all duration-200 text-xs sm:text-sm py-2 sm:py-3"
            >
              {savedBooks.has(currentBookData.id)
                ? "Added to Want to Read ✓"
                : "Add to Want to Read"}
            </button>
            <button
              onClick={() => handleReadNow(currentBookData.id)}
              className="btn btn-secondary bg-secondary-600 hover:bg-secondary-700 text-white transition-all duration-200 min-w-0 px-3 sm:px-4 text-xs sm:text-sm py-2 sm:py-3"
            >
              Read Now
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50">
          <div className="flex flex-col space-y-1">
            {DISCOVERY_BOOKS.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-6 rounded-full transition-all duration-300 ${
                  index === currentBook
                    ? "bg-white shadow-lg"
                    : index < currentBook
                    ? "bg-primary-400"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewBook && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Book Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex flex-col lg:flex-row max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-120px)] overflow-hidden">
              {/* Book Info Sidebar */}
              <div className="w-full lg:w-1/3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                <div className="space-y-3 sm:space-y-4">
                  <Image
                    src={previewBook.cover}
                    alt={previewBook.title}
                    width={150}
                    height={225}
                    className="w-32 h-48 sm:w-40 sm:h-60 lg:w-full lg:max-w-[200px] mx-auto rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "/placeholder-book.svg";
                    }}
                  />

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {previewBook.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">
                      by {previewBook.author}
                    </p>

                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {previewBook.rating}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        ({previewBook.reviewCount.toLocaleString()} reviews)
                      </span>
                    </div>

                    <div className="mb-3 sm:mb-4">
                      <span className="inline-block px-2 sm:px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs sm:text-sm font-medium">
                        {previewBook.mood}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {previewBook.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs sm:text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                      {previewBook.shortDescription}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
                    About This Book
                  </h4>

                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-3 sm:space-y-4">
                    <p className="text-sm sm:text-base">
                      <strong>Description:</strong>{" "}
                      {previewBook.shortDescription}
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                      <h5 className="font-semibold mb-2 text-gray-900 dark:text-white text-sm sm:text-base">
                        Why readers love this book:
                      </h5>
                      <ul className="space-y-1 text-xs sm:text-sm">
                        {previewBook.title ===
                          "The Seven Husbands of Evelyn Hugo" && (
                          <>
                            <li>
                              • Captivating storytelling with unexpected twists
                            </li>
                            <li>• Complex, well-developed characters</li>
                            <li>
                              • Explores themes of love, ambition, and identity
                            </li>
                            <li>• Perfect blend of glamour and substance</li>
                          </>
                        )}

                        {previewBook.title === "Atomic Habits" && (
                          <>
                            <li>
                              • Practical, actionable advice for building habits
                            </li>
                            <li>
                              • Science-backed strategies that actually work
                            </li>
                            <li>• Easy to understand and implement</li>
                            <li>• Life-changing results with small changes</li>
                          </>
                        )}

                        {previewBook.title === "The Silent Patient" && (
                          <>
                            <li>
                              • Gripping psychological thriller with shocking
                              twists
                            </li>
                            <li>• Masterful storytelling and pacing</li>
                            <li>• Complex characters and motivations</li>
                            <li>• Impossible to put down</li>
                          </>
                        )}

                        {![
                          "The Seven Husbands of Evelyn Hugo",
                          "Atomic Habits",
                          "The Silent Patient",
                        ].includes(previewBook.title) && (
                          <>
                            <li>
                              • Highly rated by{" "}
                              {previewBook.reviewCount.toLocaleString()} readers
                            </li>
                            <li>• {previewBook.rating} star average rating</li>
                            <li>
                              • Tagged as:{" "}
                              {previewBook.tags.slice(0, 2).join(", ")}
                            </li>
                            <li>
                              • Perfect for fans of{" "}
                              {previewBook.mood.toLowerCase()} stories
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Preview Actions */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleAddToLibrary(previewBook.id)}
                        className={`flex-1 py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base ${
                          userBooks.some(
                            (userBook) => userBook.id === previewBook.id
                          )
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {userBooks.some(
                          (userBook) => userBook.id === previewBook.id
                        )
                          ? "In Library ✓"
                          : "Add to Library"}
                      </button>
                      <button
                        onClick={() => handleAddToWantToRead(previewBook.id)}
                        className="bg-purple-600 hover:bg-purple-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base"
                      >
                        {savedBooks.has(previewBook.id)
                          ? "Added to Want to Read ✓"
                          : "Add to Want to Read"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
