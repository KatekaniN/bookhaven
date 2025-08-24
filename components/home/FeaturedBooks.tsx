"use client";

import { useQuery } from "@tanstack/react-query";
import { BookCard } from "../books/BookCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";

async function fetchFeaturedBooks() {
  // Simulate featured books for now - in production, this would come from your API
  const featuredBooks = [
    {
      id: "OL123456M",
      title: "The Seven Husbands of Evelyn Hugo",
      author: "Taylor Jenkins Reid",
      cover: "https://covers.openlibrary.org/b/id/8739161-L.jpg",
      rating: 4.5,
      reviewCount: 89234,
      description: "A reclusive Hollywood icon finally tells her story...",
    },
    {
      id: "OL789012M",
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      cover: "https://covers.openlibrary.org/b/id/12544329-L.jpg",
      rating: 4.2,
      reviewCount: 45621,
      description: "A thrilling book about artificial intelligence...",
    },
    {
      id: "OL345678M",
      title: "The Midnight Library",
      author: "Matt Haig",
      cover: "https://covers.openlibrary.org/b/id/12544330-L.jpg",
      rating: 4.3,
      reviewCount: 67834,
      description: "Between life and death there is a library...",
    },
    {
      id: "OL901234M",
      title: "Project Hail Mary",
      author: "Andy Weir",
      cover: "https://covers.openlibrary.org/b/id/12544331-L.jpg",
      rating: 4.7,
      reviewCount: 52198,
      description: "A lone astronaut must save humanity...",
    },
  ];

  return featuredBooks;
}

export function FeaturedBooks() {
  const {
    data: books,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["featured-books"],
    queryFn: fetchFeaturedBooks,
  });

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12">
        <div className="text-center text-red-500">
          Failed to load featured books. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Featured Books
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Handpicked selections from our community
          </p>
        </div>
        <a
          href="/featured"
          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
        >
          View all →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {books?.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
