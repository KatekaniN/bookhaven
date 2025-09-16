import { useState, useCallback, useRef } from "react";

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
}

// Client-side cache with 4 hour expiration
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours (shorter than server to ensure freshness)
const cache = new Map<string, CacheEntry>();

export const useNYTBooksCache = () => {
  const [, forceUpdate] = useState({});
  const requestsInFlight = useRef(new Set<string>());

  const fetchNYTBooks = useCallback(
    async (listName: string): Promise<NYTBook[]> => {
      const cacheKey = `nyt-${listName}`;
      const now = Date.now();

      // Check cache first
      const cached = cache.get(cacheKey);
      if (
        cached &&
        now - cached.timestamp < CACHE_DURATION &&
        !cached.loading
      ) {
        console.log(`💾 Client cache hit for: ${listName}`);
        return cached.data;
      }

      // Prevent duplicate requests
      if (requestsInFlight.current.has(cacheKey)) {
        console.log(`⏳ Request already in flight for: ${listName}`);
        // Wait for the existing request to complete
        return new Promise((resolve) => {
          const checkCache = () => {
            const updated = cache.get(cacheKey);
            if (updated && !updated.loading) {
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
        });

        console.log(`🌐 Fetching from API: ${listName}`);

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
          });
        }

        throw error;
      } finally {
        requestsInFlight.current.delete(cacheKey);
      }
    },
    []
  );

  const getCachedBooks = useCallback((listName: string): NYTBook[] | null => {
    const cacheKey = `nyt-${listName}`;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_DURATION && !cached.loading) {
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
    forceUpdate({});
  }, []);

  // Clean up expired cache entries
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    cache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        cache.delete(key);
      }
    });
  }, []);

  return {
    fetchNYTBooks,
    getCachedBooks,
    isLoading,
    clearCache,
    cleanupCache,
  };
};
