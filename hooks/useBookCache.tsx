import { useState, useEffect } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface BookCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

export function useBookCache<T>(options: BookCacheOptions = {}) {
  const { ttl = 60 * 60 * 1000, maxSize = 100 } = options; // 1 hour default TTL
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const set = (key: string, data: T) => {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };

    setCache((prev) => {
      const newCache = new Map(prev);

      // Remove expired entries and enforce size limit
      if (newCache.size >= maxSize) {
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        // Remove oldest 25% of entries
        const toRemove = Math.floor(entries.length * 0.25);
        entries.slice(0, toRemove).forEach(([key]) => newCache.delete(key));
      }

      newCache.set(key, entry);
      return newCache;
    });
  };

  const get = (key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      // Entry expired, remove it
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return entry.data;
  };

  const has = (key: string): boolean => {
    const entry = cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      setCache((prev) => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return false;
    }

    return true;
  };

  const clear = () => {
    setCache(new Map());
  };

  const size = () => cache.size;

  const getCacheStats = () => {
    const now = Date.now();
    const entries = Array.from(cache.values());
    const expired = entries.filter((entry) => now > entry.expiresAt).length;

    return {
      total: cache.size,
      expired,
      active: cache.size - expired,
    };
  };

  // Clean up expired entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setCache((prev) => {
        const newCache = new Map();
        prev.forEach((entry, key) => {
          if (now <= entry.expiresAt) {
            newCache.set(key, entry);
          }
        });
        return newCache;
      });
    }, 5 * 60 * 1000); // Cleanup every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  return { get, set, has, clear, size, getCacheStats };
}
