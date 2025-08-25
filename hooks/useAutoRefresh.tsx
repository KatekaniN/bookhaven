"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh: () => void | Promise<void>;
}

export function useAutoRefresh({
  interval = 60 * 60 * 1000, // 1 hour by default
  enabled = true,
  onRefresh,
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  const clearExistingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoRefresh = useCallback(() => {
    if (!enabled) return;

    clearExistingInterval();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshRef.current;

      // Only refresh if enough time has passed
      if (timeSinceLastRefresh >= interval) {
        console.log("Auto-refreshing books...");
        lastRefreshRef.current = now;
        onRefresh();
      }
    }, interval);
  }, [enabled, interval, onRefresh, clearExistingInterval]);

  // Manual refresh function that resets the timer
  const manualRefresh = useCallback(async () => {
    lastRefreshRef.current = Date.now();
    await onRefresh();

    // Restart the auto-refresh timer
    if (enabled) {
      startAutoRefresh();
    }
  }, [onRefresh, enabled, startAutoRefresh]);

  // Get time until next refresh
  const getTimeUntilNextRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;
    const timeUntilNext = Math.max(0, interval - timeSinceLastRefresh);
    return timeUntilNext;
  }, [interval]);

  // Format time until next refresh
  const getFormattedTimeUntilNext = useCallback(() => {
    const ms = getTimeUntilNextRefresh();
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return "< 1m";
    }
  }, [getTimeUntilNextRefresh]);

  useEffect(() => {
    if (enabled) {
      startAutoRefresh();
    } else {
      clearExistingInterval();
    }

    // Cleanup on unmount
    return () => {
      clearExistingInterval();
    };
  }, [enabled, startAutoRefresh, clearExistingInterval]);

  // Pause auto-refresh when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearExistingInterval();
      } else if (enabled) {
        // Check if we need to refresh immediately when tab becomes visible
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshRef.current;

        if (timeSinceLastRefresh >= interval) {
          console.log("Tab became visible, refreshing due to elapsed time...");
          manualRefresh();
        } else {
          startAutoRefresh();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    enabled,
    interval,
    manualRefresh,
    startAutoRefresh,
    clearExistingInterval,
  ]);

  return {
    manualRefresh,
    getTimeUntilNextRefresh,
    getFormattedTimeUntilNext,
    isEnabled: enabled,
  };
}
