"use client";

import { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { BookCard } from "../books/BookCard";
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const mockFeedBooks = [
  {
    id: "feed-1",
    title: "The Atlas Six",
    author: "Olivie Blake",
    cover: "https://covers.openlibrary.org/b/id/12544332-L.jpg",
    rating: 4.1,
    reviewCount: 23891,
    description:
      "Six young magicians compete for a place in an ancient society...",
    userReview:
      "This dark academia fantasy had me completely hooked! The character development is incredible.",
    reviewer: "Sarah M.",
    reviewerAvatar: "/avatars/sarah.jpg",
    tags: ["Dark Academia", "Fantasy", "Magic"],
    mood: "mysterious",
    isLiked: false,
    likes: 127,
    comments: 23,
  },
  {
    id: "feed-2",
    title: "Beach Read",
    author: "Emily Henry",
    cover: "https://covers.openlibrary.org/b/id/12544333-L.jpg",
    rating: 4.4,
    reviewCount: 67234,
    description:
      "Two rival writers end up stuck next to each other at the beach...",
    userReview:
      "Perfect summer romance! Made me laugh and cry in the best way.",
    reviewer: "Alex K.",
    reviewerAvatar: "/avatars/alex.jpg",
    tags: ["Romance", "Contemporary", "Beach Read"],
    mood: "feel-good",
    isLiked: true,
    likes: 234,
    comments: 45,
  },
  {
    id: "feed-3",
    title: "The Thursday Murder Club",
    author: "Richard Osman",
    cover: "https://covers.openlibrary.org/b/id/12544334-L.jpg",
    rating: 4.3,
    reviewCount: 89456,
    description:
      "Four unlikely friends meet weekly to investigate cold cases...",
    userReview:
      "Clever mystery with heart! The characters are absolutely delightful.",
    reviewer: "Emma R.",
    reviewerAvatar: "/avatars/emma.jpg",
    tags: ["Mystery", "Cozy Mystery", "British"],
    mood: "clever",
    isLiked: false,
    likes: 189,
    comments: 31,
  },
];

export function BookFeed() {
  const [books, setBooks] = useState(mockFeedBooks);
  const swiperRef = useRef<any>(null);

  const handleLike = (bookId: string) => {
    setBooks(
      books.map((book) =>
        book.id === bookId
          ? {
              ...book,
              isLiked: !book.isLiked,
              likes: book.isLiked ? book.likes - 1 : book.likes + 1,
            }
          : book
      )
    );
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case "mysterious":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "feel-good":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "clever":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Discover Feed
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Swipe through books recommended by your reading community
          </p>
        </div>
      </div>

      <div className="relative">
        <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          navigation={{
            prevEl: ".swiper-button-prev-custom",
            nextEl: ".swiper-button-next-custom",
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1.2,
            },
            768: {
              slidesPerView: 1.5,
            },
            1024: {
              slidesPerView: 2,
            },
            1280: {
              slidesPerView: 2.5,
            },
          }}
          className="book-feed-swiper"
        >
          {books.map((book) => (
            <SwiperSlide key={book.id}>
              <div className="card p-6 h-full">
                <div className="flex space-x-4">
                  {/* Book cover */}
                  <div className="flex-shrink-0">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-24 h-36 object-cover rounded-lg shadow-sm"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {book.author}
                        </p>
                      </div>
                      <div
                        className={`badge ${getMoodColor(book.mood)} text-xs`}
                      >
                        {book.mood}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(book.rating))}
                        {"☆".repeat(5 - Math.floor(book.rating))}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        {book.rating} ({book.reviewCount?.toLocaleString()}{" "}
                        reviews)
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {book.tags.map((tag) => (
                        <span
                          key={tag}
                          className="badge badge-secondary text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* User review */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        "{book.userReview}"
                      </p>
                      <div className="flex items-center">
                        <img
                          src={book.reviewerAvatar}
                          alt={book.reviewer}
                          className="w-6 h-6 rounded-full mr-2"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          — {book.reviewer}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(book.id)}
                          className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          {book.isLiked ? (
                            <HeartSolidIcon className="h-5 w-5 text-red-500" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          <span className="text-sm">{book.likes}</span>
                        </button>

                        <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                          <ChatBubbleLeftIcon className="h-5 w-5" />
                          <span className="text-sm">{book.comments}</span>
                        </button>

                        <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                          <ShareIcon className="h-5 w-5" />
                        </button>
                      </div>

                      <button className="btn btn-primary btn-sm">
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom navigation buttons */}
        <button className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
