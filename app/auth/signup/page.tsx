"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  UserPlusIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { useAppStore } from "@/stores/useAppStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function SignUpPage() {
  const { data: session, status } = useSession();
  const hasCompletedOnboarding = useAppStore(
    (state) => state.hasCompletedOnboarding
  );
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      // If user is logged in, redirect them away from signup page
      if (hasCompletedOnboarding) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    }
  }, [status, session, hasCompletedOnboarding, router]);

  // Show loading spinner while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner />
      </div>
    );
  }

  // Auto-recover if OAuthCallback error is present
  useEffect(() => {
    const err = searchParams.get("error");
    const cb = searchParams.get("callbackUrl") || "/onboarding";
    if (err === "OAuthCallback") {
      // Force session check then redirect
      import("next-auth/react").then(({ getSession }) => {
        getSession().then((s) => {
          if (s?.user) router.replace(cb);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleGoogleSignUp = async () => {
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/onboarding",
      });

      console.log("Google sign up result:", result);

      if (result?.error) {
        console.error("Google sign up error:", result.error);
        toast.error("Google sign up failed. Please try again.");
      } else if (result?.ok) {
        toast.success(
          "Welcome to Book Haven! Let's set up your reading preferences."
        );
        // Wait a moment before redirecting to ensure session is set
        setTimeout(() => {
          router.push("/onboarding");
        }, 1000);
      } else {
        toast.error("Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Google sign up error:", error);
      toast.error("Something went wrong with Google sign up.");
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(183, 163, 202, 0.7), rgba(253, 238, 163, 0.7)), url('/illustration.png')`,
        backgroundPosition: "left center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Form Container */}
      <div className="flex-1 flex items-center justify-start px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-md sm:max-w-lg lg:max-w-xl w-full space-y-4 ">
          {/* Logo */}
          <div className="text-center">
            <div className="flex justify-center ">
              <Image src="/logo.png" alt="BookHaven" width={200} height={200} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-1 drop-shadow-lg">
              Join{" "}
              <span className="bg-gradient-to-r from-primary-300 to-secondary-300 bg-clip-text text-transparent">
                BookHaven
              </span>
            </h2>
            <p className="text-white/90 text-base drop-shadow-md">
              Start your personalized reading journey
            </p>
          </div>

          {/* Google-only sign up */}
          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="group relative w-full flex justify-center items-center py-2.5 px-4 border border-white/30 text-base font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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

          <div className="text-center pt-2">
            <p className="text-sm text-white/90">
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-primary-600 hover:text-primary-800 underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
          <div></div>

          {/* Features */}
          {/*  <div className="mt-8 pt-6 border-t border-white/20">
            <p className="text-center text-sm text-white/90 mb-4">
              After signing up, we'll help you:
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-white/90">
                  Discover books you'll love
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-secondary-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-sm">🎯</span>
                </div>
                <p className="text-sm text-white/90">Set your reading goals</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-accent-500/30 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <BookOpenIcon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-white/90">Track your progress</p>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
