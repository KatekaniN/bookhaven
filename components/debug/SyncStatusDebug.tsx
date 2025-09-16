"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppStore } from "../../stores/useAppStore";
import { userDataSync } from "../../lib/userDataSync";
import { AppCacheManager } from "../../lib/cacheManager";

export function SyncStatusDebug() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [cloudData, setCloudData] = useState<any>(null);
  const [cacheHealth, setCacheHealth] = useState<any>(null);
  const [syncStats, setSyncStats] = useState({
    lastSync: null as Date | null,
    totalBooks: 0,
    totalRatings: 0,
    isOnline: navigator?.onLine || false,
  });

  const {
    hasCompletedOnboarding,
    userBooks,
    bookRatings,
    authorRatings,
    userPreferences,
    readingGoals,
  } = useAppStore();

  const refreshCloudData = async () => {
    if (!session?.user?.email) return;

    try {
      await userDataSync.initializeUser(session.user.email);
      const data = await userDataSync.fetchUserDataFromCloud();
      setCloudData(data);
      setSyncStats((prev) => ({
        ...prev,
        lastSync: new Date(),
        totalBooks: data?.userBooks?.length || 0,
        totalRatings:
          (data?.bookRatings?.length || 0) + (data?.authorRatings?.length || 0),
      }));

      // Get cache health
      const cacheManager = AppCacheManager.getInstance();
      const health = cacheManager.getCacheHealth();
      setCacheHealth(health);
    } catch (error) {
      console.error("Failed to fetch cloud data:", error);
    }
  };

  const invalidateAllCaches = () => {
    const cacheManager = AppCacheManager.getInstance();
    cacheManager.invalidateAllCache();
    refreshCloudData();
  };

  const warmCaches = async () => {
    const cacheManager = AppCacheManager.getInstance();
    await cacheManager.warmCache();
    refreshCloudData();
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStats((prev) => ({ ...prev, isOnline: navigator.onLine }));
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      {/* Debug toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg"
        title="Sync Status Debug"
      >
        🔄 Sync
      </button>

      {/* Debug panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Sync & Cache Debug</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Sync Status */}
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    syncStats.isOnline ? "text-green-600" : "text-red-600"
                  }
                >
                  {syncStats.isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <div>
                <strong>User:</strong> {session?.user?.email || "Not signed in"}
              </div>
            </div>

            <div>
              <strong>Last Sync:</strong>{" "}
              {syncStats.lastSync?.toLocaleTimeString() || "Never"}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Local Books:</strong> {userBooks.length}
              </div>
              <div>
                <strong>Cloud Books:</strong> {syncStats.totalBooks}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Local Ratings:</strong>{" "}
                {bookRatings.length + authorRatings.length}
              </div>
              <div>
                <strong>Cloud Ratings:</strong> {syncStats.totalRatings}
              </div>
            </div>

            <div>
              <strong>Onboarding:</strong>{" "}
              <span
                className={
                  hasCompletedOnboarding ? "text-green-600" : "text-red-600"
                }
              >
                {hasCompletedOnboarding ? "Complete" : "Incomplete"}
              </span>
            </div>

            <div>
              <strong>Preferences:</strong>{" "}
              <span
                className={userPreferences ? "text-green-600" : "text-red-600"}
              >
                {userPreferences
                  ? `${userPreferences.genres?.length || 0} genres`
                  : "None"}
              </span>
            </div>

            <div>
              <strong>Reading Goals:</strong> {readingGoals.length}
            </div>

            {/* Cache Health Section */}
            {cacheHealth && (
              <div className="border-t pt-2 mt-2">
                <h4 className="font-semibold text-xs mb-1">Cache Health</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <strong>Synced:</strong>{" "}
                    <span
                      className={
                        cacheHealth.userDataSynced
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {cacheHealth.userDataSynced ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <strong>Cache Size:</strong> {cacheHealth.cacheSize}
                  </div>
                </div>

                {cacheHealth.staleCaches.length > 0 && (
                  <div>
                    <strong>Stale Caches:</strong>{" "}
                    <span className="text-yellow-600">
                      {cacheHealth.staleCaches.join(", ")}
                    </span>
                  </div>
                )}

                <div>
                  <strong>Last Cache Sync:</strong>{" "}
                  {cacheHealth.lastSync?.toLocaleTimeString() || "Never"}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-3 space-y-2">
            <button
              onClick={refreshCloudData}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
              disabled={!session?.user?.email}
            >
              Refresh Cloud Data
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={invalidateAllCaches}
                className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                disabled={!session?.user?.email}
              >
                Clear All Cache
              </button>
              <button
                onClick={warmCaches}
                className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                disabled={!session?.user?.email}
              >
                Warm Cache
              </button>
            </div>

            {cloudData && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">
                  View Cloud Data
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto max-h-32">
                  {JSON.stringify(cloudData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}
    </>
  );
}
