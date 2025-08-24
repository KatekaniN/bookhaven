"use client";

import { useSession } from "next-auth/react";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { status } = useSession();

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Loading BookHaven...
          </p>
        </div>
      </div>
    );
  }

  // Let individual pages handle their own auth logic
  return <>{children}</>;
}
