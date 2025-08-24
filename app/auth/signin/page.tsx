"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid credentials. Please try again.");
      } else {
        // Check if user needs onboarding
        const session = await getSession();
        if (session?.user) {
          // Check if user has completed onboarding (you'd check this from your database)
          const hasCompletedOnboarding = false; // TODO: Check from Firebase/database

          if (hasCompletedOnboarding) {
            router.push("/");
          } else {
            router.push("/onboarding");
          }
          toast.success("Welcome back to Book Haven!");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/onboarding",
      });

      console.log("Google sign in result:", result);

      if (result?.error) {
        console.error("Google sign in error:", result.error);
        toast.error("Google sign in failed. Please try again.");
      } else if (result?.ok) {
        toast.success("Welcome to Book Haven!");
        // Wait a moment before redirecting to ensure session is set
        setTimeout(() => {
          router.push("/onboarding");
        }, 1000);
      } else {
        toast.error("Authentication failed. Please try again.");
      }
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

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-primary-600 mb-2 drop-shadow-sm"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border-2 border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-600 placeholder-purple-200 transition-all duration-200 hover:bg-gray-100 focus:bg-white"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-primary-600 mb-2 drop-shadow-sm"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border-2 border-primary-600 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600 text-primary-600 placeholder-purple-200 transition-all duration-200 hover:bg-gray-100 focus:bg-white"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-110 transition-transform duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-700 focus:ring-primary-600 border-white/30 rounded bg-white/20"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-primary-600 drop-shadow-sm font-medium"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-700 drop-shadow-sm underline"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-lg text-white bg-primary-600 hover:bg-primary-600 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>

            <div className="relative">
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-white/80">
                  Or continue with
                </span>
              </div>
            </div>

            <div>
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
                Don't have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>

          {/* Features 
          <div className="mt-8 pt-6 border-t border-white/30">
            <p className="text-center text-sm text-white/80 mb-4 drop-shadow-sm">
              Join thousands of readers who are:
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-xl">📚</span>
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
