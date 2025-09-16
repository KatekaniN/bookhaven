"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { userDataSync } from "../../lib/userDataSync";
import toast from "react-hot-toast";

export default function OfflineSync() {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);

      if (hasPendingSync && session?.user?.email) {
        try {
          console.log(
            "📡 Device back online, attempting to sync pending changes..."
          );

          // Re-initialize sync service
          await userDataSync.initializeUser(session.user.email);

          // The store will automatically sync any changes made while offline
          toast.success("Your changes have been synced to the cloud!", {
            duration: 3000,
          });

          setHasPendingSync(false);
        } catch (error) {
          console.error("Failed to sync after coming back online:", error);
          toast.error(
            "Failed to sync your changes. Please try refreshing the page.",
            {
              duration: 5000,
            }
          );
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasPendingSync(true);

      toast("You're offline. Your changes will sync when you're back online.", {
        duration: 4000,
        icon: "📱",
      });
    };

    // Set initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [session, hasPendingSync]);

  // Show sync status indicator
  if (!isOnline && hasPendingSync) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">
            Offline - Changes will sync when connected
          </span>
        </div>
      </div>
    );
  }

  return null;
}
