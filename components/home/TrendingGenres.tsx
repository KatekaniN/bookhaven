"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const genres = [
  {
    name: "Cozy Fantasy",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    count: "1.2k books",
    cover: "/bookcovers/cozyfantasy.png",
  },
  {
    name: "Fast-paced Thriller",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    count: "856 books",
    cover: "/bookcovers/fastpacedthriller.png",
  },
  {
    name: "Romantic Comedy",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    count: "2.1k books",
    cover: "/bookcovers/romanticcomedy.png",
  },
  {
    name: "Science Fiction",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    count: "3.4k books",
    cover: "/bookcovers/sciencefiction.png",
  },
  {
    name: "Historical Fiction",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    count: "1.8k books",
    cover: "/bookcovers/historicalfiction.png",
  },
  {
    name: "Mystery",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    count: "2.7k books",
    cover: "/bookcovers/mystery.png",
  },
  {
    name: "Young Adult",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    count: "4.2k books",
    cover: "/bookcovers/youngadult.png",
  },
  {
    name: "Self-Help",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    count: "967 books",
    cover: "/bookcovers/self-help.png",
  },
];

export function TrendingGenres() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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
    <section>
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
          {currentIndex > 0 && (
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          )}
          {currentIndex + itemsPerPage < genres.length && (
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {visibleGenres.map((genre, index) => (
          <div
            key={genre.name}
            className="group cursor-pointer"
            onMouseEnter={() => setHoveredCard(genre.name)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() =>
              (window.location.href = `/explore?genre=${encodeURIComponent(
                genre.name
              )}`)
            }
          >
            <div className="relative bg-gradient-to-b from-white/70 via-white/60 to-white/50 dark:from-gray-800/70 dark:via-gray-800/60 dark:to-gray-800/50 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-2 p-6 overflow-hidden">
              {/* Animated background particles */}
              {hoveredCard === genre.name && (
                <>
                  <div
                    className="absolute top-2 left-4 w-1 h-1 bg-primary-400 rounded-full opacity-0 animate-ping"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="absolute top-8 right-6 w-0.5 h-0.5 bg-secondary-400 rounded-full opacity-0 animate-ping"
                    style={{ animationDelay: "200ms" }}
                  ></div>
                  <div
                    className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-primary-300 rounded-full opacity-0 animate-ping"
                    style={{ animationDelay: "400ms" }}
                  ></div>
                  <div
                    className="absolute bottom-4 right-4 w-1 h-1 bg-secondary-300 rounded-full opacity-0 animate-ping"
                    style={{ animationDelay: "600ms" }}
                  ></div>
                </>
              )}

              {/* Background gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

              {/* Book Cover - Made much larger */}
              <div className="relative z-10 flex justify-center mb-6">
                <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={genre.cover}
                    alt={`${genre.name} book cover`}
                    className="w-32 h-48 object-cover rounded-xl shadow-2xl border-2 border-white/40 dark:border-gray-600/40 group-hover:shadow-primary-500/20 transition-all duration-300"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder-book.jpg";
                    }}
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Magical sparkle overlay */}
                  {hoveredCard === genre.name && (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <div
                        className="absolute top-4 left-4 w-2 h-2 bg-white opacity-0 animate-pulse"
                        style={{
                          animationDelay: "0ms",
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                        }}
                      ></div>
                      <div
                        className="absolute top-8 right-8 w-1.5 h-1.5 bg-yellow-200 opacity-0 animate-pulse"
                        style={{
                          animationDelay: "300ms",
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                        }}
                      ></div>
                      <div
                        className="absolute bottom-6 left-6 w-1 h-1 bg-primary-200 opacity-0 animate-pulse"
                        style={{
                          animationDelay: "600ms",
                          clipPath:
                            "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Genre Tag - Enhanced styling */}
              <div className="relative z-10 flex justify-center mb-4">
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:scale-105 ${genre.color}`}
                >
                  {genre.name}
                </div>
              </div>

              {/* Book Count - Enhanced */}
              <p className="relative z-10 text-center text-gray-700 dark:text-gray-300 text-sm font-medium mb-4">
                {genre.count}
              </p>

              {/* Call to Action - Enhanced */}
              <div className="relative z-10 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="bg-primary-50 dark:bg-primary-900/30 px-4 py-2 rounded-full border border-primary-200 dark:border-primary-800 backdrop-blur-sm">
                  Explore genre →
                </span>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-primary-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-4 left-4 w-1 h-1 bg-secondary-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                Math.floor(currentIndex / itemsPerPage) === index
                  ? "bg-gradient-to-r from-primary-500 to-secondary-500 shadow-lg"
                  : "bg-white/60 backdrop-blur-sm border border-white/20"
              }`}
            />
          )
        )}
      </div>
    </section>
  );
}
