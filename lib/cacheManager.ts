import { useEffect } from "react";
import { userDataSync } from "../lib/userDataSync";
import { useSession } from "next-auth/react";

interface CacheManager {
  // Cache invalidation strategies
  invalidateUserData: () => void;
  invalidateBookData: () => void;
  invalidateAllCache: () => void;

  // Cache warming strategies
  warmCache: () => Promise<void>;

  // Cache stats
  getCacheHealth: () => {
    userDataSynced: boolean;
    lastSync: Date | null;
    cacheSize: number;
    staleCaches: string[];
  };
}

export class AppCacheManager implements CacheManager {
  private static instance: AppCacheManager;
  private userEmail: string | null = null;
  private lastSyncTime: Date | null = null;
  private invalidationCallbacks: Map<string, () => void> = new Map();

  static getInstance(): AppCacheManager {
    if (!AppCacheManager.instance) {
      AppCacheManager.instance = new AppCacheManager();
    }
    return AppCacheManager.instance;
  }

  initialize(userEmail: string) {
    this.userEmail = userEmail;
    this.setupSyncListeners();
  }

  private async setupSyncListeners() {
    if (!this.userEmail) return;

    try {
      await userDataSync.initializeUser(this.userEmail);

      userDataSync.setupRealtimeSync(
        (cloudData) => {
          console.log("🔄 Cloud data changed, invalidating relevant caches");
          this.lastSyncTime = new Date();

          // Invalidate specific caches based on what changed
          if (cloudData.preferences) {
            this.invalidateBookData(); // Preferences affect recommendations
          }

          if (cloudData.userBooks) {
            this.invalidateUserData(); // User library changed
          }

          // Trigger any registered callbacks
          this.invalidationCallbacks.forEach((callback) => callback());
        },
        (error) => {
          console.error("Cache manager sync error:", error);
        }
      );
    } catch (error) {
      console.error("Failed to setup cache sync listeners:", error);
    }
  }

  registerInvalidationCallback(key: string, callback: () => void) {
    this.invalidationCallbacks.set(key, callback);
  }

  unregisterInvalidationCallback(key: string) {
    this.invalidationCallbacks.delete(key);
  }

  invalidateUserData() {
    console.log("🗑️ Invalidating user data caches");

    // Clear localStorage user data (force re-sync from cloud)
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.includes("bookhaven") || key.includes("user")) {
          console.log(`Clearing localStorage key: ${key}`);
          // Don't actually clear - let Zustand handle this
          // localStorage.removeItem(key);
        }
      });
    }

    // Trigger callbacks
    this.invalidationCallbacks.forEach((callback, key) => {
      if (key.includes("user")) {
        callback();
      }
    });
  }

  invalidateBookData() {
    console.log("🗑️ Invalidating book data caches");

    // Clear NYT books cache
    this.invalidationCallbacks.forEach((callback, key) => {
      if (key.includes("book") || key.includes("nyt")) {
        callback();
      }
    });
  }

  invalidateAllCache() {
    console.log("🗑️ Invalidating ALL caches");

    // Clear all browser caches
    if (typeof window !== "undefined" && "caches" in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
    }

    // Trigger all callbacks
    this.invalidationCallbacks.forEach((callback) => callback());
  }

  async warmCache() {
    if (!this.userEmail) return;

    console.log("🔥 Warming caches with fresh data");

    try {
      // Pre-fetch user data from cloud
      await userDataSync.initializeUser(this.userEmail);
      const cloudData = await userDataSync.fetchUserDataFromCloud();

      if (cloudData) {
        console.log("✅ User data pre-fetched for cache warming");
        this.lastSyncTime = new Date();
      }

      // Could also pre-fetch commonly accessed book data here
      // const commonLists = ['hardcover-fiction', 'hardcover-nonfiction'];
      // await Promise.all(commonLists.map(list => fetchNYTBooks(list)));
    } catch (error) {
      console.error("Failed to warm cache:", error);
    }
  }

  getCacheHealth() {
    const userDataSynced = this.lastSyncTime !== null;
    const cacheSize = this.invalidationCallbacks.size;

    // Check for stale caches (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const staleCaches: string[] = [];

    if (this.lastSyncTime && this.lastSyncTime < oneHourAgo) {
      staleCaches.push("userDataSync");
    }

    // Check localStorage cache age
    if (typeof window !== "undefined") {
      const zustandData = localStorage.getItem("bookhaven-app-store");
      if (zustandData) {
        try {
          const parsed = JSON.parse(zustandData);
          if (parsed.state?.lastUpdated) {
            const lastUpdated = new Date(parsed.state.lastUpdated);
            if (lastUpdated < oneHourAgo) {
              staleCaches.push("zustandStore");
            }
          }
        } catch (e) {
          staleCaches.push("zustandStore");
        }
      }
    }

    return {
      userDataSynced,
      lastSync: this.lastSyncTime,
      cacheSize,
      staleCaches,
    };
  }

  cleanup() {
    this.invalidationCallbacks.clear();
    this.userEmail = null;
    this.lastSyncTime = null;

    if (this.userEmail) {
      userDataSync.cleanup();
    }
  }
}

// Hook to use the cache manager
export function useAppCacheManager() {
  const { data: session } = useSession();
  const cacheManager = AppCacheManager.getInstance();

  // Initialize when user logs in
  useEffect(() => {
    if (session?.user?.email) {
      cacheManager.initialize(session.user.email);
    }

    return () => {
      if (!session?.user?.email) {
        cacheManager.cleanup();
      }
    };
  }, [session, cacheManager]);

  return cacheManager;
}
