"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAppStore, useHydratedStore } from "../stores/useAppStore";
import { Hero } from "../components/home/Hero";
import { FeaturedBooks } from "../components/home/FeaturedBooks";
import { BookFeed } from "../components/home/BookFeed";
import { TrendingGenres } from "../components/home/TrendingGenres";
import { PersonalizedRecommendations } from "../components/home/PersonalizedRecommendations";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding
  );
  const clearOldDiscoverBooks = useAppStore(
    (state) => state.clearOldDiscoverBooks
  );
  const hasHydrated = useHydratedStore();

  // Add a delay to ensure OnboardingDataSync has time to check server state
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (status === "loading" || !hasHydrated) return; // Wait for session and hydration

    // Clear old discover books from cache
    clearOldDiscoverBooks();

    // Give OnboardingDataSync component time to check server state
    const timer = setTimeout(() => {
      setHasInitialized(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, hasHydrated, clearOldDiscoverBooks]);

  useEffect(() => {
    if (!hasInitialized || status === "loading" || !hasHydrated) return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!hasCompletedOnboarding) {
      console.log("User has not completed onboarding, redirecting...");
      router.push("/onboarding");
      return;
    }
  }, [
    session,
    hasCompletedOnboarding,
    router,
    hasInitialized,
    status,
    hasHydrated,
  ]);

  if (status === "loading" || !hasHydrated || !hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading Book Haven...
          </p>
        </div>
      </div>
    );
  }

  if (!session || !hasCompletedOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Hero />
      <div className="relative -mt-16 z-10">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 space-y-16 pb-16">
          {/* Content sections with glass-morphism cards */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-8">
            <PersonalizedRecommendations />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-8">
            <FeaturedBooks />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-8">
            <TrendingGenres />
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-xl p-8">
            <BookFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
