"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useAppStore, useHydratedStore } from "../../stores/useAppStore";
import { userDataSync } from "../../lib/userDataSync";
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
    isSyncInitialized,
    isSyncInProgress,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
  } = useAppStore();

  useEffect(() => {
    const syncAndCheckOnboardingData = async () => {
      // Only run when user is authenticated, session is loaded, and store is hydrated
      // Also wait for UserDataInitializer to complete
      if (
        status !== "authenticated" ||
        !session?.user ||
        !hasHydrated ||
        hasCheckedServer ||
        isSyncInProgress ||
        !isSyncInitialized
      ) {
        return;
      }

      console.log("Checking onboarding status for user:", session.user.email);

      try {
        // Initialize Firebase sync service
        await userDataSync.initializeUser(session.user.email!);

        // Check cloud data first (Firebase Firestore)
        const cloudOnboardingComplete =
          await userDataSync.hasCompletedOnboarding();

        if (cloudOnboardingComplete) {
          console.log(
            "User has completed onboarding in cloud, fetching data..."
          );

          const cloudData = await userDataSync.fetchUserDataFromCloud();

          if (cloudData && cloudData.preferences) {
            // Update Zustand store with cloud data
            setUserPreferences(cloudData.preferences);
            setBookRatings(cloudData.bookRatings || []);
            setAuthorRatings(cloudData.authorRatings || []);
            setOnboardingCompleted(true);

            // Clear any old localStorage onboarding data
            clearStoredOnboardingData();

            setHasCheckedServer(true);
            return;
          }
        }

        // Fallback to API check for backward compatibility
        const response = await fetch("/api/user/preferences", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const serverData = await response.json();
          console.log("Server preferences data:", serverData);

          if (
            serverData.preferences &&
            serverData.preferences.genres &&
            serverData.preferences.genres.length > 0
          ) {
            console.log(
              "Found server data, syncing to cloud and updating local state"
            );

            // Sync API data to cloud storage
            await userDataSync.syncUserDataToCloud({
              onboardingCompleted: true,
              preferences: serverData.preferences,
              bookRatings: serverData.ratings?.books || [],
              authorRatings: serverData.ratings?.authors || [],
              userBooks: [],
              readingGoals: [],
              bookClubMemberships: [],
              buddyReadParticipations: [],
            });

            // Update local store
            setUserPreferences(serverData.preferences);
            setBookRatings(serverData.ratings?.books || []);
            setAuthorRatings(serverData.ratings?.authors || []);
            setOnboardingCompleted(true);

            clearStoredOnboardingData();
            setHasCheckedServer(true);
            return;
          }
        }

        // Check for local stored data to sync
        const storedData = getStoredOnboardingData();
        if (storedData) {
          console.log("Found stored onboarding data, syncing to cloud...");

          try {
            // Sync to cloud storage (Firebase)
            await userDataSync.syncUserDataToCloud({
              onboardingCompleted: true,
              preferences: storedData.preferences,
              bookRatings: storedData.bookRatings || [],
              authorRatings: storedData.authorRatings || [],
              userBooks: [],
              readingGoals: [],
              bookClubMemberships: [],
              buddyReadParticipations: [],
            });

            // Also save to API for backward compatibility
            await saveOnboardingDataToAPI(
              storedData,
              session?.user?.email || undefined
            );

            // Update local store
            setUserPreferences(storedData.preferences);
            setBookRatings(storedData.bookRatings || []);
            setAuthorRatings(storedData.authorRatings || []);
            setOnboardingCompleted(true);

            toast.success("Your preferences have been saved and synced!");
          } catch (error) {
            console.error("Failed to sync onboarding data:", error);
            toast.error("Failed to sync preferences. Please try again.");
          }
        } else if (!hasCompletedOnboarding) {
          console.log("User has not completed onboarding");
          setOnboardingCompleted(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        toast.error(
          "Failed to check your account status. Please refresh the page."
        );
      } finally {
        setHasCheckedServer(true);
      }
    };

    // Small delay to ensure everything is loaded
    const timer = setTimeout(syncAndCheckOnboardingData, 100);

    return () => clearTimeout(timer);
  }, [
    session,
    status,
    hasHydrated,
    hasCheckedServer,
    isSyncInitialized,
    isSyncInProgress,
    hasCompletedOnboarding,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
  ]);

  // This component doesn't render anything
  return null;
}
