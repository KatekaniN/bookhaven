"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const genres = [
  {
    name: "Cozy Fantasy",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    count: "1.2k books",
  },
  {
    name: "Fast-paced Thriller",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    count: "856 books",
  },
  {
    name: "Romantic Comedy",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    count: "2.1k books",
  },
  {
    name: "Science Fiction",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    count: "3.4k books",
  },
  {
    name: "Historical Fiction",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    count: "1.8k books",
  },
  {
    name: "Mystery",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    count: "2.7k books",
  },
  {
    name: "Young Adult",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    count: "4.2k books",
  },
  {
    name: "Self-Help",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    count: "967 books",
  },
];

export function TrendingGenres() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 4;

  const nextSlide = () => {
    setCurrentIndex((prev) =>
      prev + itemsPerPage >= genres.length ? 0 : prev + itemsPerPage
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0
        ? Math.max(0, genres.length - itemsPerPage)
        : prev - itemsPerPage
    );
  };

  const visibleGenres = genres.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Trending Genres
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Discover books by mood and vibe
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            disabled={currentIndex === 0}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            disabled={currentIndex + itemsPerPage >= genres.length}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleGenres.map((genre, index) => (
          <div
            key={genre.name}
            className="group cursor-pointer"
            onClick={() =>
              (window.location.href = `/search?genre=${encodeURIComponent(
                genre.name
              )}`)
            }
          >
            <div className="card p-6 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${genre.color}`}
              >
                {genre.name}
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {genre.count}
              </p>
              <div className="mt-4 flex items-center text-primary-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Explore genre →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile dots indicator */}
      <div className="flex justify-center mt-6 space-x-2 lg:hidden">
        {Array.from({ length: Math.ceil(genres.length / itemsPerPage) }).map(
          (_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * itemsPerPage)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / itemsPerPage) === index
                  ? "bg-primary-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          )
        )}
      </div>
    </section>
  );
}
