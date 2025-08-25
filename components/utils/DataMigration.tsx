"use client";

import { useEffect } from "react";
import { useAppStore } from "../../stores/useAppStore";

export default function DataMigration() {
  const _migrateOldPlaceholders = useAppStore(
    (state) => state._migrateOldPlaceholders
  );
  const userBooks = useAppStore((state) => state.userBooks);

  useEffect(() => {
    // Check if any books have the old placeholder URL
    const hasOldPlaceholders = userBooks.some((book) =>
      book.cover.includes("via.placeholder.com")
    );

    if (hasOldPlaceholders) {
      console.log("Migrating old placeholder URLs...");
      _migrateOldPlaceholders();
    }

    // Also clear any Next.js cache that might contain the old URLs
    if (typeof window !== "undefined") {
      // Clear any cached image URLs
      try {
        const cacheNames = ["next-image", "next-static-chunks"];
        cacheNames.forEach(async (cacheName) => {
          if ("caches" in window) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            keys.forEach(async (request) => {
              if (request.url.includes("via.placeholder.com")) {
                await cache.delete(request);
              }
            });
          }
        });
      } catch (error) {
        // Silent fail for cache clearing
        console.log("Cache clearing not available");
      }
    }
  }, [_migrateOldPlaceholders, userBooks]);

  return null; // This component doesn't render anything
}
