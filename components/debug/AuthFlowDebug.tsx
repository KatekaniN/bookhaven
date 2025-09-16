"use client";

import { useSession } from "next-auth/react";
import { useAppStore } from "../../stores/useAppStore";

export function AuthFlowDebug() {
  const { data: session, status } = useSession();
  const {
    hasCompletedOnboarding,
    isSyncInitialized,
    isSyncInProgress,
    lastSyncTime,
  } = useAppStore();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white text-xs p-3 rounded-lg max-w-xs">
      <div className="font-bold mb-2">🔍 Auth Flow Debug</div>
      <div className="space-y-1">
        <div>
          Status: <span className="text-blue-300">{status}</span>
        </div>
        <div>
          User:{" "}
          <span className="text-green-300">
            {session?.user?.email || "None"}
          </span>
        </div>
        <div>
          Onboarding:{" "}
          <span
            className={
              hasCompletedOnboarding ? "text-green-300" : "text-red-300"
            }
          >
            {hasCompletedOnboarding ? "Complete" : "Incomplete"}
          </span>
        </div>
        <div>
          Sync Init:{" "}
          <span
            className={isSyncInitialized ? "text-green-300" : "text-yellow-300"}
          >
            {isSyncInitialized ? "✓" : "✗"}
          </span>
        </div>
        <div>
          Sync Progress:{" "}
          <span
            className={isSyncInProgress ? "text-blue-300" : "text-gray-300"}
          >
            {isSyncInProgress ? "In Progress" : "Idle"}
          </span>
        </div>
        {lastSyncTime && (
          <div>
            Last Sync:{" "}
            <span className="text-purple-300">
              {new Date(lastSyncTime).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
