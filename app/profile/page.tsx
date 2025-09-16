"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  StarIcon,
  HeartIcon,
  PencilIcon,
  BookOpenIcon,
  UserIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  SparklesIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
  SparklesIcon as SparklesSolidIcon,
} from "@heroicons/react/24/solid";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAppStore, UserBook } from "../../stores/useAppStore";
import toast from "react-hot-toast";

// Dynamic imports for performance
const PersonalizedRecommendations = dynamic(
  () =>
    import("../../components/home/PersonalizedRecommendations").then((mod) => ({
      default: mod.PersonalizedRecommendations,
    })),
  {
    loading: () => (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"
            ></div>
          ))}
        </div>
      </div>
    ),
  }
);

interface UserData {
  preferences: {
    genres: string[];
    topics: string[];
    languages: string[];
  };
  ratings: {
    books: Array<{
      id: string;
      title: string;
      author: string;
      rating: number;
      cover?: string;
    }>;
    authors: Array<{
      id: string;
      name: string;
      rating: number;
    }>;
  };
  updatedAt?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "preferences" | "ratings" | "library"
  >("overview");

  // Get data from app store
  const {
    userBooks,
    userPreferences,
    bookRatings,
    authorRatings,
    hasCompletedOnboarding,
  } = useAppStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.email) {
      // Use local store data if available, otherwise fetch from API
      if (hasCompletedOnboarding && userPreferences) {
        setUserData({
          preferences: userPreferences,
          ratings: {
            books: bookRatings.map((rating) => ({
              id: rating.bookId,
              title: rating.title,
              author: rating.author,
              rating: rating.rating,
            })),
            authors: authorRatings.map((rating) => ({
              id: rating.id,
              name: rating.authorName,
              rating: rating.rating,
            })),
          },
        });
        setLoading(false);
      } else {
        fetchUserData();
      }
    }
  }, [
    session,
    status,
    router,
    hasCompletedOnboarding,
    userPreferences,
    bookRatings,
    authorRatings,
  ]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/preferences");

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: UserData["preferences"]) => {
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: newPreferences,
          bookRatings: userData?.ratings.books || [],
          authorRatings: userData?.ratings.authors || [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const result = await response.json();
      setUserData(result.data);
      toast.success("Preferences updated successfully!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Magical Background Elements */}
      <div className="absolute inset-0">
        {/* Magical paper texture overlay */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-15"
          style={{
            backgroundImage: "url(/home/paper-texture.png)",
            backgroundSize: "512px 512px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Small floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-secondary-300 rounded-full opacity-60 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-1 h-1 bg-primary-300 rounded-full opacity-40 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-accent-300 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 bg-secondary-200 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-4 sm:py-6 md:py-8">
        {/* Profile Header */}
        <div className="relative">
          <div className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-primary-200 dark:border-primary-700 shadow-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
            {/* Decorative corner elements - hidden on mobile */}
            <div className="hidden sm:block absolute top-0 left-0 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 opacity-30">
              <img
                src="/library/decorations/corner-1.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block absolute top-0 right-0 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 opacity-30 transform scale-x-[-1]">
              <img
                src="/library/decorations/corner-2.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block absolute bottom-0 left-0 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 opacity-30 transform scale-y-[-1]">
              <img
                src="/library/decorations/corner-3.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block absolute bottom-0 right-0 w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 opacity-30 transform scale-x-[-1] scale-y-[-1]">
              <img
                src="/library/decorations/corner-4.png"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-center space-y-4 md:space-y-0 md:space-x-6 relative z-10">
              {/* Profile Avatar */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-lg">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  )}
                  {/* Magical sparkle effect */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-secondary-400 to-accent-400 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg">
                    <SparklesSolidIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-2">
                  {session.user.name ||
                    session.user.email?.split("@")[0] ||
                    "Book Haven Reader"}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-serif italic mb-3 break-words">
                  {session.user.email}
                </p>

                {/* Profile Badge */}
                <div className="flex flex-col xs:flex-row items-center justify-center md:justify-start gap-2 xs:gap-3">
                  <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-full border border-primary-200 dark:border-primary-700">
                    <BookOpenIcon className="w-3 h-3 sm:w-4 sm:h-4 text-primary-600 dark:text-primary-400 mr-1 sm:mr-2" />
                    <span className="text-primary-600 dark:text-primary-400 font-serif font-semibold text-xs sm:text-sm">
                      Book Haven Member
                    </span>
                  </div>

                  {hasCompletedOnboarding && (
                    <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full border border-green-200 dark:border-green-700">
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 mr-1" />
                      <span className="text-green-600 dark:text-green-400 font-serif text-xs font-medium">
                        Onboarded
                      </span>
                    </div>
                  )}
                </div>

                {userData?.updatedAt && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 font-serif italic mt-2">
                    Profile enchanted:{" "}
                    {new Date(userData.updatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Reading Level Badge */}
              <div className="w-full xs:w-auto md:block">
                <div className="text-center bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-accent-200 dark:border-accent-700 min-w-0 xs:min-w-[120px]">
                  <div className="text-2xl sm:text-3xl font-bold text-accent-600 dark:text-accent-400 font-serif">
                    {Math.min(Math.floor(userBooks.length / 5) + 1, 10)}
                  </div>
                  <div className="text-xs text-accent-700 dark:text-accent-300 font-serif font-medium">
                    Reading Level
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-serif italic mt-1">
                    {userBooks.length < 5
                      ? "Novice Reader"
                      : userBooks.length < 15
                      ? "Book Explorer"
                      : userBooks.length < 30
                      ? "Library Scholar"
                      : userBooks.length < 50
                      ? "Book Sage"
                      : "Grand Bibliophile"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="relative mb-8">
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-primary-200 dark:border-primary-700 shadow-lg overflow-hidden">
            {/* Header for tabs */}
            <div className="bg-primary-50 dark:bg-primary-900/20 p-6 border-b border-primary-200 dark:border-primary-700">
              <div className="flex items-center justify-center">
                <SparklesSolidIcon className="w-6 h-6 text-primary-500 mr-3" />
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white text-center">
                  Your Reading Journey
                </h2>
                <SparklesSolidIcon className="w-6 h-6 text-primary-500 ml-3" />
              </div>
            </div>

            <div className="border-b border-primary-200 dark:border-primary-700">
              <nav className="flex flex-wrap sm:flex-nowrap space-x-2 sm:space-x-4 md:space-x-8 px-2 sm:px-4 md:px-8 -mb-px overflow-x-auto">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`group py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-serif font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === "overview"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span>Overview</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("library")}
                  className={`group py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-serif font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === "library"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span>Library</span>
                    <span className="ml-1 px-1.5 sm:px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full font-bold">
                      {userBooks.length}
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`group py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-serif font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === "preferences"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span>Preferences</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab("ratings")}
                  className={`group py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-serif font-medium text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${
                    activeTab === "ratings"
                      ? "border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span>My Ratings</span>
                  </div>
                </button>
              </nav>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6 sm:space-y-8">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 sm:p-6 border border-primary-200 dark:border-primary-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                          <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-2xl sm:text-3xl font-serif font-bold text-primary-600 dark:text-primary-400">
                            {userBooks.length}
                          </p>
                          <p className="text-primary-800 dark:text-primary-200 font-serif text-sm sm:text-base">
                            Books in Library
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-secondary-50 dark:bg-secondary-900/20 rounded-xl p-4 sm:p-6 border border-secondary-200 dark:border-secondary-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary-500 rounded-lg flex items-center justify-center">
                          <StarSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-2xl sm:text-3xl font-serif font-bold text-secondary-600 dark:text-secondary-400">
                            {
                              userBooks.filter((b) => b.status === "read")
                                .length
                            }
                          </p>
                          <p className="text-secondary-800 dark:text-secondary-200 font-serif text-sm sm:text-base">
                            Books Read
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-4 sm:p-6 border border-accent-200 dark:border-accent-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent-500 rounded-lg flex items-center justify-center">
                          <HeartSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-2xl sm:text-3xl font-serif font-bold text-accent-600 dark:text-accent-400">
                            {userBooks.filter((b) => b.isLiked).length}
                          </p>
                          <p className="text-accent-800 dark:text-accent-200 font-serif text-sm sm:text-base">
                            Favorite Books
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 sm:p-6 border border-primary-200 dark:border-primary-700 hover:shadow-lg transition-shadow">
                      <div className="flex items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                          <SparklesSolidIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <p className="text-2xl sm:text-3xl font-serif font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-secondary-400">
                            {
                              (
                                userData?.preferences?.genres ||
                                userPreferences?.genres ||
                                []
                              ).length
                            }
                          </p>
                          <p className="text-primary-800 dark:text-primary-200 font-serif text-sm sm:text-base">
                            Favorite Genres
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Recent Activity
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {userBooks
                        .sort(
                          (a, b) =>
                            new Date(b.dateAdded).getTime() -
                            new Date(a.dateAdded).getTime()
                        )
                        .slice(0, 5)
                        .map((book) => (
                          <div
                            key={book.id}
                            className="flex items-center space-x-3 p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <img
                              src={book.cover}
                              alt={book.title}
                              className="w-10 h-12 sm:w-12 sm:h-16 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                                {book.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                by {book.author}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Added{" "}
                                {new Date(book.dateAdded).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                                  book.status === "read"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : book.status === "currently-reading"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                                }`}
                              >
                                {book.status === "want-to-read"
                                  ? "Want to Read"
                                  : book.status === "currently-reading"
                                  ? "Reading"
                                  : "Read"}
                              </span>
                            </div>
                          </div>
                        ))}
                      {userBooks.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                          No books in your library yet. Start discovering books
                          to add them!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Favorite Genres Display */}
                  {(userData?.preferences?.genres ||
                    userPreferences?.genres) && (
                    <div>
                      <h3 className="text-xl font-serif font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-3">
                          <SparklesSolidIcon className="w-4 h-4 text-white" />
                        </div>
                        Your Enchanted Genres
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(
                          userData?.preferences?.genres ||
                          userPreferences?.genres ||
                          []
                        ).map((genre) => (
                          <div
                            key={genre}
                            className="group relative bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 border border-primary-200 dark:border-primary-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-105"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-secondary-100/20 dark:from-primary-800/20 dark:to-secondary-800/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                <span className="text-white font-serif font-bold text-lg">
                                  {genre.charAt(0)}
                                </span>
                              </div>
                              <h4 className="font-serif font-semibold text-gray-900 dark:text-white text-sm">
                                {genre}
                              </h4>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Library Tab */}
              {activeTab === "library" && (
                <LibraryDisplay userBooks={userBooks} />
              )}

              {/* Preferences Tab */}
              {activeTab === "preferences" && userData && (
                <PreferencesEditor
                  preferences={userData.preferences}
                  onUpdate={updatePreferences}
                />
              )}

              {/* Ratings Tab */}
              {activeTab === "ratings" && userData && (
                <RatingsDisplay ratings={userData.ratings} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Library Display Component
interface LibraryDisplayProps {
  userBooks: UserBook[];
}

function LibraryDisplay({ userBooks }: LibraryDisplayProps) {
  const [filter, setFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "dateAdded" | "title" | "author" | "rating"
  >("dateAdded");

  const filteredBooks = userBooks.filter((book) => {
    if (filter === "all") return true;
    if (filter === "liked") return book.isLiked;
    return book.status === filter;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "author":
        return a.author.localeCompare(b.author);
      case "rating":
        return (b.userRating || 0) - (a.userRating || 0);
      case "dateAdded":
      default:
        return (
          new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        );
    }
  });

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All Books" },
            { key: "want-to-read", label: "Want to Read" },
            { key: "currently-reading", label: "Reading" },
            { key: "read", label: "Read" },
            { key: "liked", label: "Favorites" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-purple-600 text-white dark:bg-purple-500"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="dateAdded">Sort by Date Added</option>
          <option value="title">Sort by Title</option>
          <option value="author">Sort by Author</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      {/* Books Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {sortedBooks.length} of {userBooks.length} books
      </div>

      {/* Books Grid */}
      {sortedBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedBooks.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative group">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {book.isLiked && (
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  )}
                  {book.status === "read" && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  by {book.author}
                </p>

                {book.userRating && (
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <StarSolidIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < book.userRating!
                            ? "text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                      {book.userRating}/5
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      book.status === "read"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : book.status === "currently-reading"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {book.status === "want-to-read"
                      ? "Want to Read"
                      : book.status === "currently-reading"
                      ? "Reading"
                      : "Read"}
                  </span>

                  <Link
                    href={`/books/${book.id}`}
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Added {new Date(book.dateAdded).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpenIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No books found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filter === "all"
              ? "You haven't added any books to your library yet."
              : `You don't have any books in the "${filter}" category.`}
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            Discover Books
          </Link>
        </div>
      )}
    </div>
  );
}

// Preferences Editor Component
function PreferencesEditor({
  preferences,
  onUpdate,
}: {
  preferences: UserData["preferences"];
  onUpdate: (preferences: UserData["preferences"]) => void;
}) {
  const [editedPreferences, setEditedPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const availableGenres = [
    "Fantasy",
    "Science Fiction",
    "Mystery",
    "Romance",
    "Thriller",
    "Non-Fiction",
    "Biography",
    "History",
    "Self-Help",
    "Business",
    "Young Adult",
    "Literary Fiction",
    "Horror",
    "Comedy",
    "Poetry",
  ];

  const availableTopics = [
    "Book Clubs",
    "Author Events",
    "Reading Challenges",
    "Book Reviews",
    "Buddy Reading",
    "Genre Deep Dives",
    "New Releases",
    "Classic Literature",
    "International Books",
    "Award Winners",
  ];

  useEffect(() => {
    const changed =
      JSON.stringify(editedPreferences) !== JSON.stringify(preferences);
    setHasChanges(changed);
  }, [editedPreferences, preferences]);

  const toggleGenre = (genre: string) => {
    const newGenres = editedPreferences.genres.includes(genre)
      ? editedPreferences.genres.filter((g) => g !== genre)
      : [...editedPreferences.genres, genre];

    setEditedPreferences({
      ...editedPreferences,
      genres: newGenres,
    });
  };

  const toggleTopic = (topic: string) => {
    const newTopics = editedPreferences.topics.includes(topic)
      ? editedPreferences.topics.filter((t) => t !== topic)
      : [...editedPreferences.topics, topic];

    setEditedPreferences({
      ...editedPreferences,
      topics: newTopics,
    });
  };

  const handleSave = () => {
    onUpdate(editedPreferences);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Favorite Genres
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                editedPreferences.genres.includes(genre)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interests
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                editedPreferences.topics.includes(topic)
                  ? "bg-secondary-400 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            You have unsaved changes
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditedPreferences(preferences);
                setHasChanges(false);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Ratings Display Component
function RatingsDisplay({ ratings }: { ratings: UserData["ratings"] }) {
  const [activeRatingTab, setActiveRatingTab] = useState<"books" | "authors">(
    "books"
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveRatingTab("books")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeRatingTab === "books"
              ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Books ({ratings.books.length})
        </button>
        <button
          onClick={() => setActiveRatingTab("authors")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeRatingTab === "authors"
              ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Authors ({ratings.authors.length})
        </button>
      </div>

      {activeRatingTab === "books" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratings.books.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
              No book ratings yet. Complete the onboarding to rate books!
            </p>
          ) : (
            ratings.books.map((book) => (
              <div
                key={book.id}
                className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {book.cover && (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {book.author}
                  </p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= book.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {book.rating}/5
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeRatingTab === "authors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratings.authors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
              No author ratings yet. Complete the onboarding to rate authors!
            </p>
          ) : (
            ratings.authors.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {author.name}
                  </h4>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= author.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {author.rating}/5
                    </span>
                  </div>
                </div>
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
