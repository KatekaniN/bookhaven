"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore, ReadingGoal, UserBook } from "../../stores/useAppStore";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import {
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  CalendarIcon,
  TagIcon,
  HeartIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

interface ReadingStats {
  totalBooksRead: number;
  totalPagesRead: number;
  averageRating: number;
  totalReadingTime: number; // in minutes
  booksThisMonth: number;
  booksThisYear: number;
  favoriteGenres: { genre: string; count: number }[];
  monthlyProgress: { month: string; books: number }[];
  readingStreak: number;
  longestBook: { title: string; pages: number } | null;
  shortestBook: { title: string; pages: number } | null;
  mostRatedGenre: string;
}

export default function ReadingDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userBooks = useAppStore((state) => state.userBooks);
  const readingGoals = useAppStore((state) => state.readingGoals);
  const addReadingGoal = useAppStore((state) => state.addReadingGoal);
  const updateReadingGoal = useAppStore((state) => state.updateReadingGoal);
  const removeReadingGoal = useAppStore((state) => state.removeReadingGoal);
  const getActiveReadingGoal = useAppStore(
    (state) => state.getActiveReadingGoal
  );

  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year" | "all"
  >("year");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ReadingGoal | null>(null);

  const calculateStats = useCallback(() => {
    setLoading(true);

    try {
      const readBooks = userBooks.filter((book) => book.status === "read");
      const currentlyReading = userBooks.filter(
        (book) => book.status === "currently-reading"
      );
      const wantToRead = userBooks.filter(
        (book) => book.status === "want-to-read"
      );

      // Filter by period if not "all"
      let filteredBooks = readBooks;
      if (selectedPeriod !== "all") {
        const now = new Date();
        const cutoffDate = new Date();

        switch (selectedPeriod) {
          case "year":
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          case "month":
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case "week":
            // Get start of current week (Sunday)
            const currentDay = now.getDay();
            cutoffDate.setDate(now.getDate() - currentDay);
            cutoffDate.setHours(0, 0, 0, 0);
            break;
        }

        filteredBooks = readBooks.filter((book) => {
          if (!book.finishedReading) return false;
          return new Date(book.finishedReading) >= cutoffDate;
        });
      }

      // Basic stats
      const totalBooksRead = filteredBooks.length;
      const totalPagesRead = filteredBooks.reduce(
        (sum, book) => sum + (book.pages || 0),
        0
      );
      const avgRating =
        filteredBooks.length > 0
          ? filteredBooks.reduce(
              (sum, book) => sum + (book.userRating || book.rating || 0),
              0
            ) / filteredBooks.length
          : 0;

      // Reading pace (books per month)
      const readingPace = selectedPeriod === "all" ? totalBooksRead / 12 : 0; // Simplified

      // Favorite genres
      const genreCounts: Record<string, number> = {};
      filteredBooks.forEach((book) => {
        book.genre?.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });
      const favoriteGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([genre, count]) => ({ genre, count }));

      // Reading streak
      const readingStreak = calculateReadingStreak(readBooks);

      // Currently reading progress
      const currentlyReadingWithProgress = currentlyReading.map((book) => ({
        ...book,
        progress: book.pages
          ? Math.round(((book.currentPage || 0) / book.pages) * 100)
          : 0,
      }));

      // Monthly reading data for chart
      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date();
        month.setMonth(i);
        const monthBooks = readBooks.filter((book) => {
          if (!book.finishedReading) return false;
          const finishedDate = new Date(book.finishedReading);
          return (
            finishedDate.getMonth() === i &&
            finishedDate.getFullYear() === new Date().getFullYear()
          );
        });
        return {
          month: month.toLocaleDateString("en-US", { month: "short" }),
          books: monthBooks.length,
          pages: monthBooks.reduce((sum, book) => sum + (book.pages || 0), 0),
        };
      });

      // Longest and shortest books
      const longest = filteredBooks.reduce(
        (max, book) => ((book.pages || 0) > (max.pages || 0) ? book : max),
        filteredBooks[0] || null
      );
      const shortest =
        filteredBooks.length > 1
          ? filteredBooks.reduce((shortest, book) =>
              (book.pages || 0) < (shortest.pages || 0) ? book : shortest
            )
          : null;

      // Most rated genre
      const ratedGenreCounts: Record<string, number> = {};
      readBooks
        .filter((book) => book.rating && book.rating > 0)
        .forEach((book) => {
          book.genre?.forEach((genre: string) => {
            ratedGenreCounts[genre] = (ratedGenreCounts[genre] || 0) + 1;
          });
        });
      const mostRatedGenre =
        Object.entries(ratedGenreCounts).sort(
          ([, a], [, b]) => b - a
        )[0]?.[0] || "No ratings yet";

      setStats({
        totalBooksRead,
        totalPagesRead,
        averageRating: avgRating,
        totalReadingTime: readingPace * 60, // Convert to minutes
        booksThisMonth: 0, // Will be calculated based on period
        booksThisYear: 0, // Will be calculated based on period
        favoriteGenres,
        monthlyProgress: monthlyData,
        readingStreak,
        longestBook: longest,
        shortestBook: shortest,
        mostRatedGenre,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    } finally {
      setLoading(false);
    }
  }, [userBooks, selectedPeriod]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    calculateStats();
  }, [session, status, userBooks, selectedPeriod, calculateStats, router]);

  const calculateReadingStreak = (books: any[]) => {
    // Calculate consecutive weeks with reading activity
    const completedDates = books
      .filter((book) => book.finishedReading)
      .map((book) => new Date(book.finishedReading))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort newest first

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();

    // Get the start of current week (Sunday)
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day;
      return new Date(d.setDate(diff));
    };

    let weekToCheck = getWeekStart(currentDate);

    // Check each week going backwards
    while (true) {
      const weekEnd = new Date(weekToCheck);
      weekEnd.setDate(weekEnd.getDate() + 6);

      // Check if there's any book completed in this week
      const hasBookThisWeek = completedDates.some(
        (date) => date >= weekToCheck && date <= weekEnd
      );

      if (hasBookThisWeek) {
        streak++;
        // Move to previous week
        weekToCheck.setDate(weekToCheck.getDate() - 7);
      } else {
        break;
      }
    }

    return streak;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your reading stats...
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Unable to load reading stats
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-primary-600" />
            Reading Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Track your reading progress, set goals, and celebrate achievements
          </p>
        </div>

        {/* Reading Goals Section */}
        <Suspense
          fallback={
            <div className="mb-8 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-64"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          }
        >
          <ReadingGoalsSection
            readingGoals={readingGoals}
            userBooks={userBooks}
            currentYear={new Date().getFullYear()}
            onAddGoal={() => setShowGoalModal(true)}
            onEditGoal={(goal) => {
              setEditingGoal(goal);
              setShowGoalModal(true);
            }}
            onDeleteGoal={(goalId) => {
              removeReadingGoal(goalId);
              toast.success("Reading goal deleted");
            }}
          />
        </Suspense>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[
              { key: "week" as const, label: "This Week" },
              { key: "month" as const, label: "This Month" },
              { key: "year" as const, label: "This Year" },
              { key: "all" as const, label: "All Time" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSelectedPeriod(key)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedPeriod === key
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80"
                } backdrop-blur-sm border border-white/20 dark:border-gray-700/20`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Books Read */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <BookOpenIcon className="h-6 w-6 text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Books Read
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-400">
              {stats.totalBooksRead}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedPeriod === "month"
                ? "This month"
                : selectedPeriod === "year"
                ? "This year"
                : "Total"}
            </p>
          </div>

          {/* Pages Read */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <BookOpenIcon className="h-6 w-6 text-secondary-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Pages Read
              </h3>
            </div>
            <p className="text-3xl font-bold text-secondary-400">
              {stats.totalPagesRead.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ~{Math.round(stats.totalReadingTime / 60)} hours reading
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <StarIcon className="h-6 w-6 text-primary-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Avg Rating
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-primary-600">
                {stats.averageRating.toFixed(1)}
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarSolidIcon
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(stats.averageRating)
                        ? "text-secondary-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Reading Streak */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrophyIcon className="h-6 w-6 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Reading Streak
              </h3>
            </div>
            <p className="text-3xl font-bold text-orange-500">
              {stats.readingStreak}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              consecutive weeks
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Favorite Genres */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary-600" />
              Favorite Genres
            </h3>
            <div className="space-y-3">
              {stats.favoriteGenres.map((genre, index) => (
                <div
                  key={genre.genre}
                  className="flex items-center justify-between"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {genre.genre}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${
                            (genre.count /
                              (stats.favoriteGenres[0]?.count || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                      {genre.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Record Books */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-primary-600" />
              Reading Records
            </h3>
            <div className="space-y-4">
              {stats.longestBook && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Longest Book
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {stats.longestBook.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.longestBook.pages} pages
                  </p>
                </div>
              )}
              {stats.shortestBook && (
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Shortest Book
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {stats.shortestBook.title}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.shortestBook.pages} pages
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Most Rated Genre
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  {stats.mostRatedGenre}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary-600" />
            Reading Progress (Last 12 Months)
          </h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {stats.monthlyProgress.map((month, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-primary-600 rounded-t transition-all hover:bg-primary-700"
                  style={{
                    height: `${Math.max(
                      4,
                      (month.books /
                        (Math.max(
                          ...stats.monthlyProgress.map((m) => m.books)
                        ) || 1)) *
                        120
                    )}px`,
                  }}
                  title={`${month.month}: ${month.books} books`}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 transform -rotate-45 origin-left">
                  {month.month}
                </p>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                  {month.books}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Year Summary */}
        <div className="mt-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-primary-600" />
            {new Date().getFullYear()} Reading Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600">
                {stats.booksThisYear}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Books This Year
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.booksThisMonth}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Books This Month
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((stats.booksThisYear / 12) * 10) / 10}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Avg Books/Month
              </p>
            </div>
          </div>
        </div>

        {/* Goal Modal */}
        {showGoalModal && (
          <Suspense
            fallback={
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              </div>
            }
          >
            <GoalModal
              goal={editingGoal}
              onClose={() => {
                setShowGoalModal(false);
                setEditingGoal(null);
              }}
              onSave={(goalData) => {
                console.log("Goal modal onSave called:", {
                  editingGoal,
                  goalData,
                });
                if (editingGoal) {
                  // When editing, preserve the original goal's properties and only update the provided ones
                  const updatedGoalData = {
                    ...goalData,
                    id: editingGoal.id, // Ensure we keep the original ID
                    year: editingGoal.year, // Keep the original year
                    isActive: editingGoal.isActive, // Preserve active status
                    createdAt: editingGoal.createdAt, // Keep original creation date
                  };
                  console.log(
                    "Calling updateReadingGoal with:",
                    editingGoal.id,
                    updatedGoalData
                  );
                  updateReadingGoal(editingGoal.id, updatedGoalData);
                  toast.success("Reading goal updated!");
                } else {
                  const newGoal: ReadingGoal = {
                    id: Date.now().toString(),
                    year: goalData.year || new Date().getFullYear(),
                    targetBooks: goalData.targetBooks || 12,
                    targetPages: goalData.targetPages,
                    targetGenres: goalData.targetGenres,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    description: goalData.description,
                  };
                  addReadingGoal(newGoal);
                  toast.success("Reading goal created!");
                }
                setShowGoalModal(false);
                setEditingGoal(null);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

// Reading Goals Section Component
interface ReadingGoalsSectionProps {
  readingGoals: ReadingGoal[];
  userBooks: UserBook[];
  currentYear: number;
  onAddGoal: () => void;
  onEditGoal: (goal: ReadingGoal) => void;
  onDeleteGoal: (goalId: string) => void;
}

function ReadingGoalsSection({
  readingGoals,
  userBooks,
  currentYear,
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
}: ReadingGoalsSectionProps) {
  const currentGoal = readingGoals.find((goal) => goal.year === currentYear);
  const booksRead = userBooks.filter((book) => {
    if (!book.finishedReading) return false;
    const finishedYear = new Date(book.finishedReading).getFullYear();
    return finishedYear === currentYear;
  }).length;

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-amber-600" />
          Reading Goals
        </h3>
        <button
          onClick={onAddGoal}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {currentGoal ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentYear} Reading Goal
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Target: {currentGoal.targetBooks} books
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEditGoal(currentGoal)}
                className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/30 text-blue-600 rounded-lg transition-colors"
                title="Edit Goal"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteGoal(currentGoal.id)}
                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 text-red-600 rounded-lg transition-colors"
                title="Delete Goal"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress: {booksRead} / {currentGoal.targetBooks} books
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {Math.round((booksRead / currentGoal.targetBooks) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary-500 to-secondary-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (booksRead / currentGoal.targetBooks) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Books Remaining
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {Math.max(0, currentGoal.targetBooks - booksRead)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {booksRead >= currentGoal.targetBooks
                  ? "Goal Achieved!"
                  : "Behind/Ahead"}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {booksRead >= currentGoal.targetBooks
                  ? "🎉"
                  : `${
                      booksRead -
                      Math.floor(
                        (new Date().getMonth() + 1) *
                          (currentGoal.targetBooks / 12)
                      )
                    }`}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrophyIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Reading Goal Set
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set a reading goal for {currentYear} to track your progress!
          </p>
          <button
            onClick={onAddGoal}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Set Reading Goal
          </button>
        </div>
      )}
    </div>
  );
}

// Goal Modal Component
interface GoalModalProps {
  goal: ReadingGoal | null;
  onClose: () => void;
  onSave: (goalData: Partial<ReadingGoal>) => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const [targetBooks, setTargetBooks] = useState(goal?.targetBooks || 12);
  const [targetPages, setTargetPages] = useState(
    goal?.targetPages?.toString() || ""
  );
  const [description, setDescription] = useState(goal?.description || "");
  const currentYear = goal?.year || new Date().getFullYear(); // Use goal's year if editing

  // Update form values when goal prop changes
  useEffect(() => {
    if (goal) {
      setTargetBooks(goal.targetBooks || 12);
      setTargetPages(goal.targetPages?.toString() || "");
      setDescription(goal.description || "");
    } else {
      // Reset to defaults for new goal
      setTargetBooks(12);
      setTargetPages("");
      setDescription("");
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      year: currentYear,
      targetBooks,
      targetPages: targetPages ? Number(targetPages) : undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {goal ? "Edit Reading Goal" : "Set Reading Goal"} for {currentYear}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Books *
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={targetBooks}
              onChange={(e) => setTargetBooks(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Pages (Optional)
            </label>
            <input
              type="number"
              min="0"
              max="100000"
              value={targetPages}
              onChange={(e) => setTargetPages(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 12000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., Focus on reading more classics this year"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {goal ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
