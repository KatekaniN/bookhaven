"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useAppStore, useHydratedStore } from "../../stores/useAppStore";
import { userDataSync } from "../../lib/userDataSync";
import { auth } from "../../lib/firebase";
import { signInAnonymously } from "firebase/auth";
import toast from "react-hot-toast";

export default function UserDataInitializer() {
  const { data: session, status } = useSession();
  const hasHydrated = useHydratedStore();

  const {
    hasCompletedOnboarding,
    userPreferences,
    bookRatings,
    authorRatings,
    userBooks,
    readingGoals,
    isSyncInitialized,
    isSyncInProgress,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
    setUserBooks,
    setReadingGoals,
    setSyncInitialized,
    setSyncInProgress,
    setLastSyncTime,
    completeOnboarding,
  } = useAppStore();

  // Setup realtime sync function - defined before use in useEffect
  const setupRealtimeSync = useCallback(
    (userEmail: string) => {
      userDataSync.setupRealtimeSync(
        (cloudData) => {
          console.log("🔄 Real-time update received:", cloudData);

          // Update local store with cloud changes
          if (cloudData.preferences) {
            setUserPreferences(cloudData.preferences);
          }
          if (cloudData.bookRatings) {
            setBookRatings(cloudData.bookRatings);
          }
          if (cloudData.authorRatings) {
            setAuthorRatings(cloudData.authorRatings);
          }
          if (cloudData.userBooks) {
            setUserBooks(cloudData.userBooks);
          }
          if (cloudData.readingGoals) {
            setReadingGoals(cloudData.readingGoals);
          }
          if (cloudData.onboardingCompleted !== undefined) {
            setOnboardingCompleted(cloudData.onboardingCompleted);
          }

          toast.success("Your data has been updated from another device!", {
            duration: 2000,
          });
        },
        (error) => {
          console.error("🔄 Real-time sync error:", error);
          toast.error("Real-time sync temporarily unavailable", {
            duration: 2000,
          });
        }
      );
    },
    [
      setUserPreferences,
      setBookRatings,
      setAuthorRatings,
      setUserBooks,
      setReadingGoals,
      setOnboardingCompleted,
    ]
  );

  useEffect(() => {
    const initializeUserData = async () => {
      // Only run once when all conditions are met
      if (
        status !== "authenticated" ||
        !session?.user?.email ||
        !hasHydrated ||
        isSyncInitialized ||
        isSyncInProgress
      ) {
        return;
      }

      console.log(
        "🚀 UserDataInitializer: Starting initialization for",
        session.user.email
      );
      setSyncInProgress(true);

      try {
        // Step 1: Authenticate with Firebase using the user's email
        await initializeFirebaseAuth(session.user.email);

        // Step 2: Initialize user data sync service
        await userDataSync.initializeUser(session.user.email);

        // Step 3: Check if user has cloud data
        const cloudData = await userDataSync.fetchUserDataFromCloud();
        console.log("📥 Cloud data fetched:", cloudData);

        // Step 4: Prepare local data for merging
        const localData = {
          onboardingCompleted: hasCompletedOnboarding,
          preferences: userPreferences,
          bookRatings: bookRatings,
          authorRatings: authorRatings,
          userBooks: userBooks,
          readingGoals: readingGoals,
        };

        // Step 5: Merge local and cloud data intelligently
        const mergedData = await userDataSync.mergeLocalAndCloudData(localData);
        console.log("🔄 Data merged successfully:", mergedData);

        // Step 6: Update local store with merged data
        if (mergedData.preferences) {
          setUserPreferences(mergedData.preferences);
        }
        setBookRatings(mergedData.bookRatings);
        setAuthorRatings(mergedData.authorRatings);
        setUserBooks(mergedData.userBooks);
        setReadingGoals(mergedData.readingGoals);
        setOnboardingCompleted(mergedData.onboardingCompleted);

        // Step 7: Set up real-time sync for future changes
        setupRealtimeSync(session.user.email);

        console.log("✅ UserDataInitializer: Initialization complete");
        setSyncInitialized(true);
        setLastSyncTime(new Date().toISOString());
        toast.success("Your data has been synchronized across devices!", {
          duration: 3000,
        });
      } catch (error) {
        console.error("❌ UserDataInitializer: Failed to initialize:", error);
        toast.error(
          "Failed to sync your data. Some features may not work properly.",
          {
            duration: 5000,
          }
        );
      } finally {
        setSyncInProgress(false);
      }
    };

    // Add a small delay to ensure all other components have initialized
    const timer = setTimeout(initializeUserData, 500);
    return () => clearTimeout(timer);
  }, [
    session,
    status,
    hasHydrated,
    isSyncInitialized,
    isSyncInProgress,
    hasCompletedOnboarding,
    userPreferences,
    bookRatings,
    authorRatings,
    userBooks,
    readingGoals,
    setOnboardingCompleted,
    setUserPreferences,
    setBookRatings,
    setAuthorRatings,
    setUserBooks,
    setReadingGoals,
    setSyncInitialized,
    setSyncInProgress,
    setLastSyncTime,
    setupRealtimeSync,
    // Note: setupRealtimeSync is defined below and used conditionally
  ]);

  // Remove the duplicate setupRealtimeSync function

  const initializeFirebaseAuth = async (userEmail: string) => {
    // Check if user is already authenticated with Firebase
    if (auth.currentUser) {
      console.log("🔥 Firebase auth already initialized");
      return;
    }

    // For now, use anonymous auth since we're using NextAuth for main authentication
    // In production, you might want to implement custom token authentication
    // where your backend creates Firebase custom tokens for NextAuth users
    try {
      await signInAnonymously(auth);
      console.log("🔥 Firebase anonymous auth successful for", userEmail);
    } catch (error) {
      console.error("🔥 Firebase auth failed:", error);
      // Don't throw here - we can still use Firestore with admin SDK via API
      console.warn(
        "Continuing without Firebase client auth - using API fallback"
      );
    }
  };

  // Cleanup on unmount

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSyncInitialized) {
        userDataSync.cleanup();
        console.log("🧹 UserDataInitializer: Cleaned up");
      }
    };
  }, [isSyncInitialized]);

  // This component doesn't render anything
  return null;
}
