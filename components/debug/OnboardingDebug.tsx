"use client";

import { useAppStore, useHydratedStore } from "../../stores/useAppStore";
import { useSession } from "next-auth/react";

export function OnboardingDebug() {
  const { data: session } = useSession();
  const hasHydrated = useHydratedStore();
  const {
    hasCompletedOnboarding,
    userPreferences,
    bookRatings,
    authorRatings,
    currentOnboardingStep,
  } = useAppStore();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Onboarding Debug</h3>
      <div className="space-y-1">
        <div>Session: {session ? "✅" : "❌"}</div>
        <div>Email: {session?.user?.email || "None"}</div>
        <div>Hydrated: {hasHydrated ? "✅" : "❌"}</div>
        <div>Completed: {hasCompletedOnboarding ? "✅" : "❌"}</div>
        <div>Step: {currentOnboardingStep}</div>
        <div>Preferences: {userPreferences ? "✅" : "❌"}</div>
        <div>Book Ratings: {bookRatings.length}</div>
        <div>Author Ratings: {authorRatings.length}</div>
        {userPreferences && (
          <div className="mt-2 text-[10px]">
            <div>Genres: {userPreferences.genres.length}</div>
            <div>Topics: {userPreferences.topics?.length || 0}</div>
          </div>
        )}
      </div>
    </div>
  );
}
