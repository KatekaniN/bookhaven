"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProgressiveLoader } from "@/components/ui/ProgressiveLoader";
import { BookCard } from "@/components/books/BookCard";
import { Book } from "@/types";

export interface OptimizedBookCarouselProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  gradient: string;
  books: Book[];
  isLoading: boolean;
  query: string;
  filters?: Record<string, any>;
  mood?: string;
  priority?: "high" | "normal" | "low";
}

interface OptimizedBookCarouselPropsWithRetry
  extends OptimizedBookCarouselProps {
  onRetry?: () => void;
}

export function OptimizedBookCarousel({
  id,
  title,
  subtitle,
  icon: Icon,
  gradient,
  books,
  isLoading,
  onRetry,
  priority = "normal",
}: OptimizedBookCarouselPropsWithRetry) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInView, setIsInView] = useState(false);

  // Intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "100px" }
    );

    const carouselElement = document.querySelector(
      `[data-carousel-id="${id}"]`
    );
    if (carouselElement) {
      observer.observe(carouselElement);
    }

    return () => observer.disconnect();
  }, [id]);

  // Update scroll buttons
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
  }, [books]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Width of approximately one book card
      const newScrollLeft =
        direction === "left"
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  // Progressive loading based on priority
  if (!isInView && priority === "low") {
    return (
      <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <ProgressiveLoader
          priority={priority}
          delay={1000}
          fallback={
            <div className="text-center">
              <div className="animate-pulse">
                <div className="h-4 w-32 bg-gray-300 rounded mx-auto mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded mx-auto"></div>
              </div>
            </div>
          }
        >
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-center">
            Loading {title}...
          </p>
        </ProgressiveLoader>
      </div>
    );
  }

  return (
    <div className="group">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Loading State */}
        {isLoading && (
          <div className="h-96 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-lg flex items-center justify-center">
            {priority === "high" ? (
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading {title}...
                </p>
              </div>
            ) : (
              <ProgressiveLoader
                priority={priority}
                delay={500}
                fallback={
                  <div className="animate-pulse">
                    <div className="h-4 w-32 bg-gray-300 rounded mx-auto mb-2"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded mx-auto"></div>
                  </div>
                }
              >
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading {title}...
                </p>
              </ProgressiveLoader>
            )}
          </div>
        )}

        {/* Error State */}
        {!isLoading && books.length === 0 && (
          <div className="h-96 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-lg flex flex-col items-center justify-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No books found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              We couldn&apos;t find any books for this collection right now.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Books Carousel */}
        {!isLoading && books.length > 0 && (
          <>
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 dark:border-gray-700/20 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 dark:border-gray-700/20 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              </button>
            )}

            {/* Books Grid */}
            <div
              ref={scrollRef}
              onScroll={updateScrollButtons}
              className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
            >
              {books.map((book, index) => (
                <div key={`${book.id}-${index}`} className="flex-shrink-0">
                  <BookCard book={book} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
