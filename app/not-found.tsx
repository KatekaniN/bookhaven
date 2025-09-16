"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Magical Background Elements */}
      <div className="absolute inset-0">
        {/* Magical paper texture overlay */}
        <div
          className="absolute inset-0 opacity-30 dark:opacity-15"
          style={{
            backgroundImage: "url(/home/paper-texture.png)",
            backgroundSize: "512px 512px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Magical dust overlay */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{
            backgroundImage: "url(/home/magical-dust-overlay.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Floating magical elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-primary-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-32 right-20 w-24 h-24 bg-secondary-200/30 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 left-1/3 w-40 h-40 bg-accent-200/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Small floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-secondary-300 rounded-full opacity-60 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-1 h-1 bg-primary-300 rounded-full opacity-40 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-accent-300 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Soft light rays */}
        <div className="absolute top-0 left-1/4 w-px h-64 bg-gradient-to-b from-secondary-200/20 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-48 bg-gradient-to-b from-primary-200/15 to-transparent transform -rotate-6"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* 404 Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-300 to-secondary-300 rounded-full blur-lg opacity-30"></div>
          <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full p-8 border border-primary-200 dark:border-primary-700">
            <div className="relative w-24 h-24">
              <img
                src="/library/icons/grand-library-building.png"
                alt="Lost in the Library"
                className="w-full h-full object-contain opacity-60"
              />
              <SparklesIcon className="absolute -top-2 -right-2 h-8 w-8 text-secondary-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 404 Message */}
        <div className="max-w-2xl mx-auto mb-8">
          <h1 className="text-8xl font-serif font-bold mb-4 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
            404
          </h1>

          {/* Decorative divider */}
          <div className="flex justify-center mb-6">
            <img
              src="/library/decorations/divider-1.png"
              alt=""
              className="h-8 opacity-60"
            />
          </div>

          <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white mb-4">
            Lost in the Library!
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 font-serif italic mb-8 leading-relaxed">
            This page has wandered into the enchanted stacks of Book Haven.
            Maybe it&apos;s hidden in a magical tome, or perhaps it awaits
            discovery in a new adventure. Return to the library and let your
            next story find you!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-serif font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-white/20"
          >
            <HomeIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
            Return to Book Haven
          </Link>

          <Link
            href="/search"
            className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-serif font-medium text-primary-600 dark:text-primary-400 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border border-primary-200 dark:border-primary-700"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Search for Books
          </Link>
        </div>

        {/* Alternative Links */}
        <div className="flex flex-wrap justify-center gap-6 text-sm">
          <Link
            href="/library"
            className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-serif transition-colors"
          >
            <BookOpenIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform" />
            Browse Library
          </Link>

          <Link
            href="/explore"
            className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-serif transition-colors"
          >
            <SparklesIcon className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform" />
            Explore Books
          </Link>

          <button
            onClick={() => router.back()}
            className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-serif transition-colors"
          >
            ← Go Back
          </button>
        </div>

        {/* Decorative Quote */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-6 h-6 opacity-20">
                <img
                  src="/library/decorations/corner-1.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute top-0 right-0 w-6 h-6 opacity-20 transform scale-x-[-1]">
                <img
                  src="/library/decorations/corner-2.png"
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>

              <blockquote className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-serif italic mb-2">
                  &ldquo;Not all who wander are lost, but some pages certainly
                  are.&rdquo;
                </p>
                <footer className="text-xs text-gray-500 dark:text-gray-500 font-serif">
                  — The Book Haven Librarian
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
