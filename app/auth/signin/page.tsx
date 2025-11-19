"use client";

import { useState, useEffect } from "react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { useAppStore } from "../../../stores/useAppStore";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import toast from "react-hot-toast";

export default function SignInPage() {
  const { data: session, status } = useSession();
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding
  );
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const credentialsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_CREDENTIALS === "true";

  // Redirect authenticated users
  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session?.user) {
      // User is authenticated, redirect appropriately
      if (hasCompletedOnboarding) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    }
  }, [session, status, hasCompletedOnboarding, router]);

  // Handle transient OAuthCallback error by forcing session refresh and redirect
  useEffect(() => {
    const err = searchParams.get("error");
    const cb = searchParams.get("callbackUrl") || "/";
    if (err === "OAuthCallback") {
      // Force a fresh session check
      getSession().then((s) => {
        if (s?.user) router.replace(cb);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-serif">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-serif">
            Welcome back! Redirecting you to Book Haven...
          </p>
        </div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Something went wrong with Google sign in.");
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(183, 161, 202, 0.6), rgba(253, 238, 163, 0.3)), url('/illustration.png')`,
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Form Container */}
      <div className="flex-1 flex items-center justify-start px-4 sm:px-6 lg:px-8">
        <div className="max-w-md sm:max-w-lg lg:max-w-xl w-full space-y-8 bg-white/0 backdrop-blur-none p-8 rounded-lg">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Image src="/logo.png" alt="BookHaven" width={200} height={200} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Welcome back to{" "}
              <span className="text-secondary-300">Book Haven</span>
            </h2>
            <p className="text-white text-lg drop-shadow-md">
              Continue your reading journey
            </p>
          </div>

          {/* Google-only */}
          <div className="mt-8 space-y-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="group relative w-full flex justify-center items-center py-3 px-4 border border-white/80 text-lg font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/90 transition-colors"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-white drop-shadow-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-primary-600 hover:text-primary-700"
              >
                Sign up here
              </Link>
            </p>
          </div>

          {/* Features 
          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-center text-sm text-white/80 mb-4 drop-shadow-sm">
              Join thousands of readers who are:
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto">
                  <BookOpenIcon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs text-white/80 drop-shadow-sm">
                  Tracking Books
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-xl">🎯</span>
                </div>
                <p className="text-xs text-white/80 drop-shadow-sm">
                  Setting Goals
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-xs text-white/80 drop-shadow-sm">
                  Joining Clubs
                </p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
