"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  BookOpenIcon,
  FolderIcon,
  BoltIcon,
  ChartBarIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session, status } = useSession();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(to bottom right, rgba(183, 161, 202, 0.6), rgba(253, 238, 163, 0.3)), url('/illustration.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full opacity-40 animate-float backdrop-blur-sm"></div>
        <div
          className="absolute top-32 right-20 w-16 h-16 bg-primary-200/30 rounded-full opacity-40 animate-float backdrop-blur-sm"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-12 h-12 bg-secondary-200/30 rounded-full opacity-40 animate-float backdrop-blur-sm"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-8 h-8 bg-white/20 rounded-full opacity-30 animate-float backdrop-blur-sm"
          style={{ animationDelay: "3s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
        {/* Hero heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
          Your Next Great <span className="text-secondary-300">Adventure</span>{" "}
          Awaits
        </h1>

        <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-3xl mx-auto drop-shadow-md">
          Book Haven is your modern companion for all things literary.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary-600" />
            <input
              type="text"
              placeholder="Search for books, authors, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-32 py-4 text-lg rounded-full border-2 border-primary-600 bg-white/95 backdrop-blur-sm text-primary-600 placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 shadow-lg hover:bg-white transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 text-white px-6 py-2 rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              Search
            </button>
          </div>
        </form>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Link
            href="/explore"
            className="group relative flex justify-center items-center space-x-2 py-3 px-8 border border-transparent text-lg font-bold rounded-lg text-white bg-primary-500/90 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 transition-all duration-200 hover:scale-105 transform shadow-lg hover:shadow-xl"
          >
            <SparklesIcon className="h-5 w-5" />
            <span>Explore Books</span>
          </Link>
          {status === "loading" ? (
            // Show loading state while checking authentication
            <div className="relative flex justify-center items-center py-3 px-8 border border-white/80 text-lg font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm opacity-50 cursor-not-allowed">
              Loading...
            </div>
          ) : session ? (
            // Show My Books button for signed-in users
            <Link
              href="/my-books"
              className="group relative flex justify-center items-center space-x-2 py-3 px-8 border border-white/80 text-lg font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/90 transition-all duration-200 hover:scale-105 transform shadow-lg"
            >
              <BookOpenIcon className="h-5 w-5" />
              <span>My Books</span>
            </Link>
          ) : (
            // Show Join BookHaven for non-authenticated users
            <Link
              href="/auth/signup"
              className="group relative flex justify-center items-center py-3 px-8 border border-white/80 text-lg font-medium rounded-lg text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/90 transition-all duration-200 hover:scale-105 transform shadow-lg"
            >
              Join Book Haven
            </Link>
          )}
        </div>

        {/* App Features */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center bg-primary-500/90 backdrop-blur-sm rounded-lg p-4 border border-primary-400/50 hover:bg-primary-400/90 hover:scale-105 transition-all duration-200 ">
            <div className="flex justify-center mb-3">
              <FolderIcon className="h-8 w-8 text-secondary-300 drop-shadow-lg" />
            </div>
            <div className="text-sm font-medium text-white/90 drop-shadow-sm">
              Personal Library
            </div>
          </div>
          <div className="text-center bg-primary-500/90 backdrop-blur-sm rounded-lg p-4 border border-primary-400/50 hover:bg-primary-400/90 hover:scale-105 transition-all duration-200">
            <div className="flex justify-center mb-3">
              <BoltIcon className="h-8 w-8 text-secondary-300 drop-shadow-lg" />
            </div>
            <div className="text-sm font-medium text-white/90 drop-shadow-sm">
              Smart Recommendations
            </div>
          </div>
          <div className="text-center bg-primary-500/90 backdrop-blur-sm rounded-lg p-4 border border-primary-400/50 hover:bg-primary-400/90 hover:scale-105 transition-all duration-200 ">
            <div className="flex justify-center mb-3">
              <ChartBarIcon className="h-8 w-8 text-secondary-300 drop-shadow-lg" />
            </div>
            <div className="text-sm font-medium text-white/90 drop-shadow-sm">
              Track Your Reading Progress
            </div>
          </div>
          <div className="text-center bg-primary-500/90 backdrop-blur-sm rounded-lg p-4 border border-primary-400/50 hover:bg-primary-400/90 hover:scale-105 transition-all duration-200">
            <div className="flex justify-center mb-3">
              <StarIcon className="h-8 w-8 text-secondary-300 drop-shadow-lg" />
            </div>
            <div className="text-sm font-medium text-white/90 drop-shadow-sm">
              Book Reviews
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
