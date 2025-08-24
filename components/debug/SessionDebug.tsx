"use client";

import { useSession } from "next-auth/react";

export function SessionDebug() {
  const { data: session, status } = useSession();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Session Debug</h3>
      <p>
        <strong>Status:</strong> {status}
      </p>
      {session ? (
        <div>
          <p>
            <strong>Email:</strong> {session.user?.email || "N/A"}
          </p>
          <p>
            <strong>Name:</strong> {session.user?.name || "N/A"}
          </p>
          <p>
            <strong>Image:</strong> {session.user?.image ? "Yes" : "No"}
          </p>
          {session.user?.image && (
            <p>
              <strong>Image URL:</strong> {session.user.image}
            </p>
          )}
        </div>
      ) : (
        <p>No session data</p>
      )}
    </div>
  );
}
