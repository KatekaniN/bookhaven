"use client";

import { useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, SparklesIcon } from "@heroicons/react/24/outline";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-800 rounded-full opacity-20 animate-float"></div>
        <div
          className="absolute top-32 right-20 w-16 h-16 bg-secondary-200 dark:bg-secondary-800 rounded-full opacity-20 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-32 w-12 h-12 bg-accent-200 dark:bg-accent-800 rounded-full opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="text-center">
          {/* Hero heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Your Next Great <span className="text-gradient">Adventure</span>{" "}
            Awaits
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Discover amazing books, connect with fellow readers, and track your
            reading journey. BookHaven is your modern companion for all things
            literary.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for books, authors, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-primary px-6 py-2 rounded-full"
              >
                Search
              </button>
            </div>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/discover"
              className="btn btn-primary px-8 py-3 text-lg inline-flex items-center space-x-2"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Discover Books</span>
            </Link>
            <Link
              href="/auth/signup"
              className="btn btn-outline px-8 py-3 text-lg"
            >
              Join BookHaven
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">10M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Books Available
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">500K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Active Readers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">2M+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Reviews
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-500">50K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Book Clubs
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
