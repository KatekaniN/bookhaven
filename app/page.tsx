"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useAppStore, useHydratedStore } from "../stores/useAppStore";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { BookCard } from "../components/books/BookCard";
import { useNYTBooksCache } from "../hooks/useNYTBooksCache";
import { useDailyRefresh } from "../lib/dailyRefresh";

// Type definitions
interface NYTBook {
  title: string;
  author: string;
  description: string;
  book_image: string;
  amazon_product_url: string;
  rank: number;
  weeks_on_list: number;
  primary_isbn13: string;
  publisher: string;
}

interface FeaturedSection {
  id: string;
  name: string;
  description: string;
  color: string;
  books: NYTBook[];
  loading: boolean;
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { checkAndRefresh, getLastRefreshDate } = useDailyRefresh();
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding
  );
  const isSyncInitialized = useAppStore((state) => state.isSyncInitialized);
  const isSyncInProgress = useAppStore((state) => state.isSyncInProgress);
  const clearOldDiscoverBooks = useAppStore(
    (state) => state.clearOldDiscoverBooks
  );
  const hasHydrated = useHydratedStore();
  const { fetchNYTBooks } = useNYTBooksCache();

  // Add a delay to ensure sync completion before making routing decisions
  const [hasInitialized, setHasInitialized] = useState(false);
  const [featuredSections, setFeaturedSections] = useState<FeaturedSection[]>([
    {
      id: "hardcover-fiction",
      name: "Trending Fiction",
      description: "The hottest stories everyone's talking about",
      color: "from-primary-500 to-primary-600",
      books: [],
      loading: true,
    },
    {
      id: "combined-print-and-e-book-fiction",
      name: "All-Time Favorites",
      description: "Beloved stories readers can't put down",
      color: "from-secondary-500 to-accent-500",
      books: [],
      loading: true,
    },
    {
      id: "hardcover-nonfiction",
      name: "Mind Expanding",
      description: "Real stories that will change your perspective",
      color: "from-primary-400 to-primary-500",
      books: [],
      loading: true,
    },
    {
      id: "advice-how-to-and-miscellaneous",
      name: "Life Changing",
      description: "Transform your world one page at a time",
      color: "from-secondary-400 to-secondary-500",
      books: [],
      loading: true,
    },
  ]);

  // Helper function to get custom icon path for each section
  const getCustomIcon = (sectionId: string) => {
    switch (sectionId) {
      case "hardcover-fiction":
        return "/library/icons/trending.png";
      case "combined-print-and-e-book-fiction":
        return "/library/icons/favorites.png";
      case "hardcover-nonfiction":
        return "/library/icons/mind-expanding.png";
      case "advice-how-to-and-miscellaneous":
        return "/library/icons/life-changing.png";
      default:
        return "/library/icons/grand-library-building.png";
    }
  };

  // Load featured books
  useEffect(() => {
    if (!hasInitialized) return;

    const loadFeaturedBooks = async () => {
      for (const section of featuredSections) {
        if (section.loading) {
          try {
            const books = await fetchNYTBooks(section.id);
            // Limit to 4 books for homepage display
            const limitedBooks = books.slice(0, 4);
            setFeaturedSections((prev) =>
              prev.map((s) =>
                s.id === section.id
                  ? { ...s, books: limitedBooks, loading: false }
                  : s
              )
            );
          } catch (error) {
            setFeaturedSections((prev) =>
              prev.map((s) =>
                s.id === section.id ? { ...s, books: [], loading: false } : s
              )
            );
          }
        }
      }
    };

    loadFeaturedBooks();
  }, [hasInitialized, fetchNYTBooks, featuredSections]);

  useEffect(() => {
    if (status === "loading" || !hasHydrated) return;

    // Check for daily refresh before loading anything
    const refreshedToday = checkAndRefresh();
    if (refreshedToday) {
      console.log("📅 Daily cache refresh performed for fresh content");
    }

    clearOldDiscoverBooks();

    // Wait for sync to complete if user is authenticated
    if (session?.user?.email) {
      // Wait for sync to complete before initializing
      if (isSyncInitialized && !isSyncInProgress) {
        const timer = setTimeout(() => {
          setHasInitialized(true);
        }, 200);
        return () => clearTimeout(timer);
      }
    } else {
      // If not authenticated, initialize immediately
      const timer = setTimeout(() => {
        setHasInitialized(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    status,
    hasHydrated,
    session,
    isSyncInitialized,
    isSyncInProgress,
    clearOldDiscoverBooks,
    checkAndRefresh,
  ]);

  // Route decisions based purely on NextAuth status to avoid flicker loops after OAuth callback
  useEffect(() => {
    if (status === "loading" || !hasHydrated) return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated" && !hasCompletedOnboarding) {
      router.push("/onboarding");
      return;
    }
  }, [status, hasHydrated, hasCompletedOnboarding, router]);

  if (status === "loading" || !hasHydrated || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative mb-6">
            {/* Enhanced loading with new assets */}
            <div className="w-32 h-32 relative mx-auto">
              {/* Main loading book */}
              <img
                src="/home/loading-book.png"
                alt="Loading..."
                className="w-full h-full object-contain animate-pulse"
              />
              {/* Loading portal background */}
              <div className="absolute inset-0 -z-10">
                <img
                  src="/home/loading-portal.png"
                  alt=""
                  className="w-full h-full object-contain opacity-40 animate-spin"
                  style={{ animationDuration: "4s" }}
                />
              </div>
              {/* Magical glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-300/20 to-secondary-300/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-serif">
            {session?.user?.email && isSyncInProgress
              ? "Synchronizing your data across devices..."
              : "Opening the magical gates to Book Haven..."}
          </p>
        </div>
      </div>
    );
  }

  if (!session || !hasCompletedOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="relative mb-6">
            {/* Enhanced loading with new assets */}
            <div className="w-32 h-32 relative mx-auto">
              {/* Main loading book */}
              <img
                src="/home/loading-book.png"
                alt="Loading..."
                className="w-full h-full object-contain animate-pulse"
              />
              {/* Loading portal background */}
              <div className="absolute inset-0 -z-10">
                <img
                  src="/home/loading-portal.png"
                  alt=""
                  className="w-full h-full object-contain opacity-40 animate-spin"
                  style={{ animationDuration: "4s" }}
                />
              </div>
              {/* Magical glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-300/20 to-secondary-300/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-serif">
            Preparing your reading sanctuary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Magical Background Elements - Full Page */}
      <div className="absolute inset-0">
        {/* Hero magical background */}
        <div
          className="absolute inset-0 opacity-10 dark:opacity-5"
          style={{
            backgroundImage: `url('/home/hero-magical-background.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Magical Texture Overlay - Enhanced brightness like library */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-25"
          style={{
            backgroundImage: "url(/home/paper-texture.png)",
            backgroundSize: "512px 512px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Magical dust overlay - Enhanced brightness */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-20"
          style={{
            backgroundImage: "url(/home/magical-dust-overlay.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Bright magical color overlay like library */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 via-secondary-50/40 to-accent-100/30 dark:from-primary-900/20 dark:via-secondary-800/30 dark:to-accent-900/20"></div>

        {/* Enhanced decorative corners with brighter visibility */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-50">
          <img
            src="/home/corner-top-left.png"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-50">
          <img
            src="/home/corner-top-right.png"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 opacity-50">
          <img
            src="/home/corner-bottom-left.png"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-50">
          <img
            src="/home/corner-bottom-right.png"
            alt=""
            className="w-full h-full object-contain filter drop-shadow-lg"
          />
        </div>

        {/* Floating magical books - Enhanced brightness */}
        <div className="absolute top-20 left-16 w-24 h-24 opacity-60 animate-float filter drop-shadow-lg">
          <img
            src="/home/floating-book-1.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
        <div
          className="absolute top-40 right-20 w-20 h-20 opacity-55 animate-float filter drop-shadow-lg"
          style={{ animationDelay: "1s" }}
        >
          <img
            src="/home/floating-book-2.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
        <div
          className="absolute bottom-32 left-1/4 w-28 h-28 opacity-50 animate-float filter drop-shadow-lg"
          style={{ animationDelay: "2s" }}
        >
          <img
            src="/home/floating-book-3.png"
            alt=""
            className="w-full h-full object-contain"
          />
        </div>

        {/* Floating magical elements - Enhanced brightness like library */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-300/50 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-32 right-20 w-24 h-24 bg-secondary-300/50 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-40 h-40 bg-accent-300/40 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Enhanced floating particles for consistency with library */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-secondary-400 rounded-full opacity-80 animate-float shadow-lg"></div>
        <div
          className="absolute top-40 right-20 w-2 h-2 bg-primary-400 rounded-full opacity-70 animate-float shadow-lg"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-2.5 h-2.5 bg-accent-400 rounded-full opacity-75 animate-float shadow-lg"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-3 h-3 bg-secondary-300 rounded-full opacity-60 animate-float shadow-lg"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Bright light rays - Enhanced colors */}
        <div className="absolute top-0 left-1/4 w-px h-64 bg-gradient-to-b from-secondary-300/40 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-48 bg-gradient-to-b from-primary-300/35 to-transparent transform -rotate-6"></div>
      </div>

      {/* Magical Hero Section */}
      <div className="relative z-10 overflow-hidden">
        <div className="relative px-6 sm:px-8 lg:px-12 xl:px-16 py-24 lg:py-32">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-full blur-lg opacity-30"></div>
                <div className="relative bg-white/80 dark:bg-primary-300/80 backdrop-blur-sm rounded-full p-6 border border-primary-200 dark:border-primary-400">
                  <div className="relative w-32 h-32">
                    <img
                      src="/library/icons/grand-library-building.png"
                      alt="Book Haven Library"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Text */}
            <h1 className="text-5xl lg:text-7xl font-serif font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-600 via-secondary-400 to-accent-400 bg-clip-text text-transparent">
                Welcome to Book Haven
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 mb-8 font-serif italic max-w-3xl mx-auto">
              Step into a world of wonder—Book Haven brings you enchanting reads
              handpicked for every kind of reader. Explore magical stories,
              timeless adventures, and hidden gems from our community and
              beyond.
            </p>

            {/* Magical divider */}
            <div className="flex justify-center mb-8">
              <img
                src="/home/section-divider.png"
                alt=""
                className="h-8 opacity-60"
              />
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20 dark:border-gray-700/20 shadow-lg">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  Enchanted
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-serif">
                  Book Haven Picks
                </div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20 dark:border-gray-700/20 shadow-lg">
                <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                  Fresh
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-serif">
                  Daily Updates
                </div>
              </div>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/20 dark:border-gray-700/20 shadow-lg">
                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  Magical
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-serif">
                  For You
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Collections */}
        <div className="relative z-10 px-6 sm:px-8 lg:px-12 xl:px-16 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid gap-8">
              {featuredSections.map((section, index) => {
                return (
                  <div
                    key={section.id}
                    className="relative group animate-fade-in"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    {/* Magical background glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${section.color} rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500`}
                    ></div>

                    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/20 shadow-2xl overflow-hidden">
                      {/* Section Header */}
                      <div
                        className={`relative bg-gradient-to-r ${section.color} p-8`}
                      >
                        {/* Decorative arch overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <img
                            src="/library/decorations/arch.png"
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="relative flex items-center justify-between text-white">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                              <div className="w-8 h-8 relative">
                                <img
                                  src={getCustomIcon(section.id)}
                                  alt={section.name}
                                  className="w-full h-full object-contain filter brightness-0 invert"
                                />
                              </div>
                            </div>
                            <div>
                              <h2 className="text-3xl font-serif font-bold">
                                {section.name}
                              </h2>
                              <p className="text-white/90 font-serif italic">
                                {section.description}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              router.push(`/library?category=${section.id}`)
                            }
                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group border border-white/30"
                            title={`View all ${section.name} books`}
                          >
                            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Books Grid */}
                      <div className="p-8">
                        {section.loading ? (
                          <div className="flex justify-center items-center py-16">
                            <div className="text-center">
                              <div className="relative mb-4">
                                {/* Enhanced magical loading animation with new assets */}
                                <div className="w-24 h-24 relative mx-auto">
                                  {/* Main loading book */}
                                  <img
                                    src="/home/loading-book.png"
                                    alt="Loading..."
                                    className="w-full h-full object-contain animate-pulse"
                                  />
                                  {/* Loading portal background */}
                                  <div className="absolute inset-0 -z-10">
                                    <img
                                      src="/home/loading-portal.png"
                                      alt=""
                                      className="w-full h-full object-contain opacity-50 animate-spin"
                                      style={{ animationDuration: "3s" }}
                                    />
                                  </div>
                                  {/* Magical glow effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary-400/30 to-secondary-400/30 rounded-full blur-lg animate-ping"></div>
                                </div>
                                {/* Floating sparkles - consistent with library animations */}
                                <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                                  <div
                                    className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0s" }}
                                  ></div>
                                </div>
                                <div className="absolute top-4 right-1/3">
                                  <div
                                    className="w-1 h-1 bg-primary-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.5s" }}
                                  ></div>
                                </div>
                                <div className="absolute bottom-4 left-1/4">
                                  <div
                                    className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "1s" }}
                                  ></div>
                                </div>
                              </div>
                              <p className="mt-4 text-gray-600 dark:text-gray-400 font-serif italic">
                                Gathering magical tales...
                              </p>
                              {/* Decorative loading divider */}
                              <div className="flex justify-center mt-2">
                                <img
                                  src="/library/decorations/divider-4.png"
                                  alt=""
                                  className="h-4 opacity-30 animate-pulse"
                                />
                              </div>
                            </div>
                          </div>
                        ) : section.books.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {section.books.map((book, bookIndex) => (
                              <div
                                key={book.primary_isbn13 || bookIndex}
                                className="group transform transition-all duration-300 hover:scale-105"
                              >
                                <div className="relative">
                                  {/* Floating effect shadow */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-primary-100/20 to-secondary-100/20 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl transform translate-y-2 group-hover:translate-y-1 transition-transform duration-300 blur-sm"></div>

                                  {/* Book card */}
                                  <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-primary-100 dark:border-primary-800">
                                    {/* Decorative corner elements */}
                                    <div className="absolute top-0 left-0 w-6 h-6 opacity-20 z-10">
                                      <img
                                        src="/library/decorations/corner-1.png"
                                        alt=""
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                    <div className="absolute top-0 right-0 w-6 h-6 opacity-20 z-10 transform scale-x-[-1]">
                                      <img
                                        src="/library/decorations/corner-2.png"
                                        alt=""
                                        className="w-full h-full object-contain"
                                      />
                                    </div>

                                    {/* Book Cover */}
                                    <div className="relative overflow-hidden aspect-[2/3]">
                                      <img
                                        src={
                                          book.book_image ||
                                          "/library/decorations/book-placeholder.png"
                                        }
                                        alt={book.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        onError={(e) => {
                                          e.currentTarget.src =
                                            "/library/decorations/book-placeholder.png";
                                        }}
                                      />

                                      {/* Rank badge */}
                                      <div className="absolute top-3 left-3 z-20">
                                        <div
                                          className={`bg-gradient-to-r ${section.color} text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg border border-white/30`}
                                        >
                                          #{book.rank}
                                        </div>
                                      </div>

                                      {/* Magical overlay */}
                                      <div
                                        className={`absolute inset-0 bg-gradient-to-t ${section.color.replace(
                                          "to-",
                                          "to-transparent from-"
                                        )} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                                      ></div>
                                    </div>

                                    {/* Book Info */}
                                    <div className="p-4 space-y-3 relative">
                                      {/* Small decorative divider */}
                                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                        <img
                                          src="/library/decorations/divider-2.png"
                                          alt=""
                                          className="h-3 opacity-30"
                                        />
                                      </div>

                                      <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white line-clamp-2 leading-tight pt-2">
                                        {book.title}
                                      </h3>

                                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                        <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span className="line-clamp-1 font-serif">
                                          {book.author}
                                        </span>
                                      </p>

                                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center">
                                          <ClockIcon className="h-3 w-3 mr-1" />
                                          {book.weeks_on_list} weeks
                                        </span>
                                        <span className="flex items-center">
                                          <StarIcon className="h-3 w-3 mr-1" />
                                          Bestseller
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <div className="relative inline-block">
                              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl blur-xl opacity-20"></div>
                              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-xl p-12">
                                {/* Decorative corners */}
                                <div className="absolute top-0 left-0 w-6 h-6 opacity-20">
                                  <img
                                    src="/library/decorations/corner-1.png"
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="absolute top-0 right-0 w-6 h-6 opacity-20 transform scale-x-[-1]">
                                  <img
                                    src="/library/decorations/corner-2.png"
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="absolute bottom-0 left-0 w-6 h-6 opacity-20 transform scale-y-[-1]">
                                  <img
                                    src="/library/decorations/corner-3.png"
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="absolute bottom-0 right-0 w-6 h-6 opacity-20 transform scale-x-[-1] scale-y-[-1]">
                                  <img
                                    src="/library/decorations/corner-4.png"
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                {/* Empty state icon */}
                                <div className="w-16 h-16 mx-auto mb-4 relative">
                                  <img
                                    src="/library/decorations/book-placeholder.png"
                                    alt="No books"
                                    className="w-full h-full object-contain opacity-60"
                                  />
                                </div>

                                <p className="text-gray-600 dark:text-gray-400 font-serif italic">
                                  No magical tales found in this collection...
                                </p>

                                {/* Decorative divider */}
                                <div className="flex justify-center mt-3">
                                  <img
                                    src="/library/decorations/divider-5.png"
                                    alt=""
                                    className="h-4 opacity-30"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="mt-16 text-center">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-primary-200 dark:border-primary-700 p-8 shadow-2xl">
                  {/* Decorative elements */}
                  <div className="absolute top-0 left-0 w-8 h-8 opacity-30">
                    <img
                      src="/library/decorations/corner-1.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute top-0 right-0 w-8 h-8 opacity-30 transform scale-x-[-1]">
                    <img
                      src="/library/decorations/corner-2.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 opacity-30 transform scale-y-[-1]">
                    <img
                      src="/library/decorations/corner-3.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 opacity-30 transform scale-x-[-1] scale-y-[-1]">
                    <img
                      src="/library/decorations/corner-4.png"
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Library building icon with entrance icon */}
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 relative">
                      <img
                        src="/library/icons/grand-library-building.png"
                        alt="Grand Library Entrance"
                        className="w-full h-full object-contain opacity-80"
                      />
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-4">
                    Ready to explore more magical collections?
                  </h3>

                  {/* Decorative divider */}
                  <div className="flex justify-center mb-4">
                    <img
                      src="/library/decorations/divider-3.png"
                      alt=""
                      className="h-6 opacity-50"
                    />
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 font-serif italic mb-6">
                    Visit our enchanted library for the complete collection of
                    magical stories, community favorites, and hidden treasures.
                  </p>
                  <button
                    onClick={() => router.push("/library")}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-serif font-medium px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20"
                  >
                    Enter the Grand Library
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
