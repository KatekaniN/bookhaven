"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore, ReadingGoal } from "../../stores/useAppStore";
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
    "month" | "year" | "all"
  >("year");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ReadingGoal | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    calculateStats();
  }, [session, status, userBooks, selectedPeriod]);

  const calculateStats = () => {
    setLoading(true);

    try {
      const readBooks = userBooks.filter((book) => book.status === "read");
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      // Filter books based on selected period
      let filteredBooks = readBooks;
      if (selectedPeriod === "year") {
        filteredBooks = readBooks.filter(
          (book) =>
            book.finishedReading &&
            new Date(book.finishedReading).getFullYear() === currentYear
        );
      } else if (selectedPeriod === "month") {
        filteredBooks = readBooks.filter(
          (book) =>
            book.finishedReading &&
            new Date(book.finishedReading).getFullYear() === currentYear &&
            new Date(book.finishedReading).getMonth() === currentMonth
        );
      }

      // Calculate basic stats
      const totalBooksRead = filteredBooks.length;
      const totalPagesRead = filteredBooks.reduce(
        (total, book) => total + (book.pages || 0),
        0
      );
      const averageRating =
        filteredBooks.length > 0
          ? filteredBooks.reduce(
              (total, book) => total + (book.rating || 0),
              0
            ) / filteredBooks.length
          : 0;

      // Estimate reading time (assuming 250 words per page, 200 words per minute)
      const totalReadingTime = Math.round((totalPagesRead * 250) / 200);

      // Books this month/year
      const booksThisMonth = readBooks.filter(
        (book) =>
          book.finishedReading &&
          new Date(book.finishedReading).getFullYear() === currentYear &&
          new Date(book.finishedReading).getMonth() === currentMonth
      ).length;

      const booksThisYear = readBooks.filter(
        (book) =>
          book.finishedReading &&
          new Date(book.finishedReading).getFullYear() === currentYear
      ).length;

      // Favorite genres
      const genreCounts: Record<string, number> = {};
      filteredBooks.forEach((book) => {
        book.genre?.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      });

      const favoriteGenres = Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Monthly progress (last 12 months)
      const monthlyProgress = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const monthBooks = readBooks.filter((book) => {
          if (!book.finishedReading) return false;
          const bookDate = new Date(book.finishedReading);
          return (
            bookDate.getFullYear() === date.getFullYear() &&
            bookDate.getMonth() === date.getMonth()
          );
        }).length;

        monthlyProgress.push({
          month: date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
          }),
          books: monthBooks,
        });
      }

      // Reading streak (consecutive days with reading activity)
      const readingStreak = calculateReadingStreak(readBooks);

      // Longest and shortest books
      const booksWithPages = filteredBooks.filter(
        (book) => book.pages && book.pages > 0
      );
      const longestBook =
        booksWithPages.length > 0
          ? booksWithPages.reduce((longest, book) =>
              (book.pages || 0) > (longest.pages || 0) ? book : longest
            )
          : null;

      const shortestBook =
        booksWithPages.length > 0
          ? booksWithPages.reduce((shortest, book) =>
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
        averageRating,
        totalReadingTime,
        booksThisMonth,
        booksThisYear,
        favoriteGenres,
        monthlyProgress,
        readingStreak,
        longestBook: longestBook
          ? { title: longestBook.title, pages: longestBook.pages || 0 }
          : null,
        shortestBook: shortestBook
          ? { title: shortestBook.title, pages: shortestBook.pages || 0 }
          : null,
        mostRatedGenre,
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadingStreak = (books: any[]) => {
    // Simple implementation - count consecutive days with completed books
    const completedDates = books
      .filter((book) => book.finishedReading)
      .map((book) => new Date(book.finishedReading).toDateString())
      .sort();

    if (completedDates.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < completedDates.length; i++) {
      const current = new Date(completedDates[i]);
      const previous = new Date(completedDates[i - 1]);
      const diffTime = current.getTime() - previous.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays <= 7) {
        // Within a week
        streak++;
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

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex gap-2">
            {[
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
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Books Read
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
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
              <BookOpenIcon className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Pages Read
              </h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {stats.totalPagesRead.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ~{Math.round(stats.totalReadingTime / 60)} hours reading
            </p>
          </div>

          {/* Average Rating */}
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <StarIcon className="h-6 w-6 text-yellow-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Avg Rating
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-yellow-600">
                {stats.averageRating.toFixed(1)}
              </p>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarSolidIcon
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(stats.averageRating)
                        ? "text-yellow-400"
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
              <TrophyIcon className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Reading Streak
              </h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {stats.readingStreak}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              consecutive periods
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
          <GoalModal
            goal={editingGoal}
            onClose={() => {
              setShowGoalModal(false);
              setEditingGoal(null);
            }}
            onSave={(goalData) => {
              if (editingGoal) {
                updateReadingGoal(editingGoal.id, goalData);
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
        )}
      </div>
    </div>
  );
}

// Reading Goals Section Component
interface ReadingGoalsSectionProps {
  readingGoals: ReadingGoal[];
  userBooks: any[];
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
  const activeGoal = readingGoals.find(
    (goal) => goal.year === currentYear && goal.isActive
  );

  const booksReadThisYear = userBooks.filter((book) => {
    if (book.status !== "read" || !book.finishedReading) return false;
    return new Date(book.finishedReading).getFullYear() === currentYear;
  }).length;

  const pagesReadThisYear = userBooks
    .filter((book) => {
      if (book.status !== "read" || !book.finishedReading) return false;
      return new Date(book.finishedReading).getFullYear() === currentYear;
    })
    .reduce((total, book) => total + (book.pages || 0), 0);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-primary-600" />
          {currentYear} Reading Goals
        </h2>
        <button
          onClick={onAddGoal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {activeGoal ? "Edit Goal" : "Set Goal"}
        </button>
      </div>

      {activeGoal ? (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/20 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Books Goal */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Books Goal
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => onEditGoal(activeGoal)}
                    className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(activeGoal.id)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>
                    {booksReadThisYear} of {activeGoal.targetBooks} books
                  </span>
                  <span>
                    {Math.round(
                      (booksReadThisYear / activeGoal.targetBooks) * 100
                    )}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        (booksReadThisYear / activeGoal.targetBooks) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              {booksReadThisYear >= activeGoal.targetBooks && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                  <CheckCircleIcon className="h-4 w-4" />
                  Goal achieved! 🎉
                </div>
              )}
            </div>

            {/* Pages Goal (if set) */}
            {activeGoal.targetPages && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Pages Goal
                </h3>
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>
                      {pagesReadThisYear.toLocaleString()} of{" "}
                      {activeGoal.targetPages.toLocaleString()} pages
                    </span>
                    <span>
                      {Math.round(
                        (pagesReadThisYear / activeGoal.targetPages) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          (pagesReadThisYear / activeGoal.targetPages) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                {pagesReadThisYear >= activeGoal.targetPages && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                    <CheckCircleIcon className="h-4 w-4" />
                    Goal achieved! 🎉
                  </div>
                )}
              </div>
            )}
          </div>

          {activeGoal.description && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {activeGoal.description}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-8 border border-white/20 dark:border-gray-700/20 shadow-lg text-center">
          <TrophyIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Reading Goal Set for {currentYear}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set a reading goal to track your progress and stay motivated!
          </p>
          <button
            onClick={onAddGoal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
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
  const [targetPages, setTargetPages] = useState(goal?.targetPages || "");
  const [description, setDescription] = useState(goal?.description || "");
  const currentYear = new Date().getFullYear();

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
