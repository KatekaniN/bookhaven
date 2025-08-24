"use client";

import { useEffect } from "react";
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
  const hasHydrated = useHydratedStore();

  useEffect(() => {
    if (status === "loading" || !hasHydrated) return; // Wait for session and hydration

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!hasCompletedOnboarding) {
      router.push("/onboarding");
      return;
    }
  }, [session, status, hasCompletedOnboarding, router, hasHydrated]);

  if (status === "loading" || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading BookHaven...
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
    <div className="space-y-12">
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PersonalizedRecommendations />
        <FeaturedBooks />
        <TrendingGenres />
        <BookFeed />
      </div>
    </div>
  );
}
