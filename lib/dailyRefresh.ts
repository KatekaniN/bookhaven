/**
 * Daily Refresh System for BookHaven
 * Ensures content refreshes properly for "Daily Updates" promise
 */

const DAILY_REFRESH_KEY = "bookhaven_daily_refresh";
const LAST_REFRESH_KEY = "bookhaven_last_refresh";

interface DailyRefreshState {
  lastRefreshDate: string;
  cacheVersion: number;
}

/**
 * Checks if we need to invalidate caches for daily refresh
 * Returns true if it's a new day and caches should be cleared
 */
export function shouldInvalidateDailyCache(): boolean {
  if (typeof window === "undefined") return false;

  const today = new Date().toDateString();
  const stored = localStorage.getItem(DAILY_REFRESH_KEY);

  if (!stored) {
    // First time - mark as refreshed today
    markDailyRefreshComplete();
    return true;
  }

  try {
    const { lastRefreshDate } = JSON.parse(stored) as DailyRefreshState;
    return lastRefreshDate !== today;
  } catch {
    // Corrupted data - force refresh
    markDailyRefreshComplete();
    return true;
  }
}

/**
 * Marks that daily refresh has been completed for today
 */
export function markDailyRefreshComplete(): void {
  if (typeof window === "undefined") return;

  const today = new Date().toDateString();
  const cacheVersion = Date.now();

  const state: DailyRefreshState = {
    lastRefreshDate: today,
    cacheVersion,
  };

  localStorage.setItem(DAILY_REFRESH_KEY, JSON.stringify(state));
  localStorage.setItem(LAST_REFRESH_KEY, today);
}

/**
 * Forces a complete cache invalidation for daily content refresh
 */
export function invalidateAllDailyCaches(): void {
  if (typeof window === "undefined") return;

  console.log("🗑️ Performing daily cache invalidation for fresh content");

  // Clear all book-related caches
  const keysToRemove = [
    "featured_books_cache",
    "bookfeed_cache",
    "discover_books_cache",
    "nyt_books_cache",
    "personalized_recommendations_cache",
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });

  // Mark refresh as complete
  markDailyRefreshComplete();
}

/**
 * Gets a deterministic but daily-changing seed based on current date
 * Useful for consistent daily randomization
 */
export function getDailySeed(): number {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  return dateString
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

/**
 * Gets a daily-varying random offset for API calls
 * Same throughout the day but changes daily
 */
export function getDailyRandomOffset(max: number = 50): number {
  const seed = getDailySeed();
  return seed % max;
}

/**
 * Hook to handle daily refresh logic
 */
export function useDailyRefresh() {
  const checkAndRefresh = (): boolean => {
    if (shouldInvalidateDailyCache()) {
      invalidateAllDailyCaches();
      return true;
    }
    return false;
  };

  const forceRefresh = (): void => {
    invalidateAllDailyCaches();
  };

  const getLastRefreshDate = (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_REFRESH_KEY);
  };

  return {
    checkAndRefresh,
    forceRefresh,
    getLastRefreshDate,
    getDailySeed,
    getDailyRandomOffset,
  };
}
