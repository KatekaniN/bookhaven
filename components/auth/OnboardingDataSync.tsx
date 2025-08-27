"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useAppStore, useHydratedStore } from "../../stores/useAppStore";
import {
  getStoredOnboardingData,
  saveOnboardingDataToAPI,
  clearStoredOnboardingData,
} from "../../lib/onboardingUtils";

export default function OnboardingDataSync() {
  const { data: session, status } = useSession();
  const hasHydrated = useHydratedStore();
  const [hasCheckedServer, setHasCheckedServer] = useState(false);

  const {
    hasCompletedOnboarding,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
  } = useAppStore();

  useEffect(() => {
    const syncAndCheckOnboardingData = async () => {
      // Only run when user is authenticated, session is loaded, and store is hydrated
      if (
        status !== "authenticated" ||
        !session?.user ||
        !hasHydrated ||
        hasCheckedServer
      ) {
        return;
      }

      console.log("Checking onboarding status for user:", session.user.email);

      try {
        // First, check if user has existing preferences on the server
        const response = await fetch("/api/user/preferences", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const serverData = await response.json();
          console.log("Server preferences data:", serverData);

          // If server has preferences data, user has completed onboarding
          if (
            serverData.preferences &&
            serverData.preferences.genres &&
            serverData.preferences.genres.length > 0
          ) {
            console.log(
              "User has completed onboarding on server, updating local state"
            );

            // Update Zustand store with server data
            setUserPreferences(serverData.preferences);
            setBookRatings(serverData.ratings?.books || []);
            setAuthorRatings(serverData.ratings?.authors || []);
            setOnboardingCompleted(true);

            // Clear any old localStorage onboarding data
            clearStoredOnboardingData();

            setHasCheckedServer(true);
            return;
          }
        }

        // If no server data, check for local stored data to sync
        const storedData = getStoredOnboardingData();
        if (storedData) {
          console.log("Found stored onboarding data, syncing to API...");

          try {
            await saveOnboardingDataToAPI(storedData);

            // Update local store with the synced data
            setUserPreferences(storedData.preferences);
            setBookRatings(storedData.bookRatings || []);
            setAuthorRatings(storedData.authorRatings || []);
            setOnboardingCompleted(true);

            toast.success("Your preferences have been saved!");
          } catch (error) {
            console.error("Failed to sync onboarding data:", error);
            // Data remains in localStorage for future attempts
          }
        } else if (!hasCompletedOnboarding) {
          // No server data and no local data - user needs to complete onboarding
          console.log("User has not completed onboarding");
          setOnboardingCompleted(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setHasCheckedServer(true);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(syncAndCheckOnboardingData, 500);

    return () => clearTimeout(timer);
  }, [
    session,
    status,
    hasHydrated,
    hasCheckedServer,
    hasCompletedOnboarding,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
  ]);

  // This component doesn't render anything
  return null;
}
