import { useState, useCallback, useRef, useEffect } from "react";
import { userDataSync } from "../lib/userDataSync";
import { useSession } from "next-auth/react";

interface NYTBook {
  title: string;
  author: string;
  description: string;
  book_image: string;
  amazon_product_url: string;
  rank: number;
  weeks_on_list: number;
  primary_isbn13: string;
  publisher: string;
}

interface CacheEntry {
  data: NYTBook[];
  timestamp: number;
  loading: boolean;
  version: number; // Add version for cache invalidation
}

// Enhanced cache with cloud sync awareness
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for daily freshness
const cache = new Map<string, CacheEntry>();
let cacheVersion = 0; // Global cache version

export const useEnhancedNYTBooksCache = () => {
  const { data: session } = useSession();
  const [, forceUpdate] = useState({});
  const requestsInFlight = useRef(new Set<string>());

  // Listen for cloud sync events to invalidate cache
  useEffect(() => {
    const handleCloudUpdate = () => {
      console.log("📡 Cloud update detected, invalidating NYT books cache");
      cacheVersion++;
      // Clear cache on cloud updates that might affect book data
      cache.clear();
      forceUpdate({});
    };

    // Set up listener for cloud data changes if user is authenticated
    if (session?.user?.email) {
      userDataSync
        .initializeUser(session.user.email)
        .then(() => {
          userDataSync.setupRealtimeSync(
            (cloudData) => {
              // If user preferences changed, it might affect book recommendations
              if (cloudData.preferences || cloudData.userBooks) {
                handleCloudUpdate();
              }
            },
            (error) => console.warn("Real-time sync error in cache:", error)
          );
        })
        .catch((error) => {
          console.warn("Failed to setup cache sync listener:", error);
        });
    }

    // Cleanup on unmount
    return () => {
      if (session?.user?.email) {
        userDataSync.cleanup();
      }
    };
  }, [session]);

  const fetchNYTBooks = useCallback(
    async (listName: string): Promise<NYTBook[]> => {
      const cacheKey = `nyt-${listName}`;
      const now = Date.now();

      // Check cache first (with version check)
      const cached = cache.get(cacheKey);
      if (
        cached &&
        now - cached.timestamp < CACHE_DURATION &&
        cached.version === cacheVersion &&
        !cached.loading
      ) {
        console.log(`💾 Enhanced cache hit for: ${listName}`);
        return cached.data;
      }

      // Prevent duplicate requests
      if (requestsInFlight.current.has(cacheKey)) {
        console.log(`⏳ Request already in flight for: ${listName}`);
        return new Promise((resolve) => {
          const checkCache = () => {
            const updated = cache.get(cacheKey);
            if (
              updated &&
              !updated.loading &&
              updated.version === cacheVersion
            ) {
              resolve(updated.data);
            } else {
              setTimeout(checkCache, 100);
            }
          };
          checkCache();
        });
      }

      try {
        requestsInFlight.current.add(cacheKey);

        // Mark as loading in cache
        cache.set(cacheKey, {
          data: cached?.data || [],
          timestamp: now,
          loading: true,
          version: cacheVersion,
        });

        console.log(`🌐 Fetching from API with sync awareness: ${listName}`);

        const response = await fetch(`/api/nytimes?list=${listName}`);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch ${listName}: ${response.statusText}`
          );
        }

        const apiData = await response.json();
        const books = apiData.results.books.map((book: any) => ({
          title: book.title,
          author: book.author,
          description: book.description,
          book_image: book.book_image,
          amazon_product_url: book.amazon_product_url,
          rank: book.rank,
          weeks_on_list: book.weeks_on_list,
          primary_isbn13: book.primary_isbn13,
          publisher: book.publisher,
        }));

        // Update cache with successful result
        cache.set(cacheKey, {
          data: books,
          timestamp: now,
          loading: false,
          version: cacheVersion,
        });

        forceUpdate({});
        return books;
      } catch (error) {
        console.error(`Error fetching ${listName}:`, error);

        // Remove loading state from cache on error
        const errorCached = cache.get(cacheKey);
        if (errorCached) {
          cache.set(cacheKey, {
            ...errorCached,
            loading: false,
            version: cacheVersion,
          });
        }

        throw error;
      } finally {
        requestsInFlight.current.delete(cacheKey);
      }
    },
    [session]
  );

  const invalidateCache = useCallback(() => {
    console.log("🗑️ Manually invalidating NYT books cache");
    cacheVersion++;
    cache.clear();
    forceUpdate({});
  }, []);

  const getCachedBooks = useCallback((listName: string): NYTBook[] | null => {
    const cacheKey = `nyt-${listName}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (
      cached &&
      now - cached.timestamp < CACHE_DURATION &&
      cached.version === cacheVersion &&
      !cached.loading
    ) {
      return cached.data;
    }

    return null;
  }, []);

  const isLoading = useCallback((listName: string): boolean => {
    const cacheKey = `nyt-${listName}`;
    const cached = cache.get(cacheKey);
    return cached?.loading || false;
  }, []);

  const clearCache = useCallback(() => {
    cache.clear();
    cacheVersion++;
    forceUpdate({});
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.values());
    const expired = entries.filter(
      (entry) => now - entry.timestamp > CACHE_DURATION
    ).length;
    const stale = entries.filter(
      (entry) => entry.version !== cacheVersion
    ).length;

    return {
      total: cache.size,
      expired,
      stale,
      active: cache.size - expired - stale,
      currentVersion: cacheVersion,
    };
  }, []);

  return {
    fetchNYTBooks,
    getCachedBooks,
    isLoading,
    clearCache,
    invalidateCache,
    getCacheStats,
  };
};
