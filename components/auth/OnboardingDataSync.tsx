"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  getStoredOnboardingData,
  saveOnboardingDataToAPI,
} from "../../lib/onboardingUtils";

export default function OnboardingDataSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    const syncOnboardingData = async () => {
      // Only run when user is authenticated and session is loaded
      if (status !== "authenticated" || !session?.user) {
        return;
      }

      const storedData = getStoredOnboardingData();
      if (!storedData) {
        return;
      }

      console.log("Found stored onboarding data, syncing to API...");

      try {
        await saveOnboardingDataToAPI(storedData);
        toast.success("Your preferences have been saved!");
      } catch (error) {
        console.error("Failed to sync onboarding data:", error);
        // Don't show error toast as it might be confusing to users
        // The data remains in localStorage for future attempts
      }
    };

    // Small delay to ensure the session is fully loaded
    const timer = setTimeout(syncOnboardingData, 1000);

    return () => clearTimeout(timer);
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
