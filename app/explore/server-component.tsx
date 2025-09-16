import { Suspense } from "react";
import { Metadata } from "next";
import dynamic from "next/dynamic";

// Simple server-compatible loading component
function SimpleLoadingSpinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-3 h-3 bg-primary-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// Dynamic import of the client component
const ExplorePageClient = dynamic(() => import("./page"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
      <SimpleLoadingSpinner />
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Explore Books | BookHaven",
  description:
    "Discover amazing books through our curated collections. Find your next favorite read with personalized recommendations.",
  keywords: [
    "books",
    "reading",
    "book discovery",
    "recommendations",
    "explore books",
  ],
  openGraph: {
    title: "Explore Books | BookHaven",
    description: "Discover amazing books through our curated collections",
    type: "website",
  },
};

// Server component that provides SEO benefits
export default function ExplorePage() {
  return (
    <main>
      {/* SEO-friendly static content */}
      <div className="sr-only">
        <h1>Explore Amazing Books</h1>
        <p>
          Discover your next favorite read through our curated collections of
          books across various genres and moods.
        </p>
        <nav aria-label="Book categories">
          <ul>
            <li>Trending Now</li>
            <li>Cozy Vibes</li>
            <li>Page Turners</li>
            <li>Emotional Journeys</li>
            <li>Light & Breezy</li>
            <li>Dark & Mysterious</li>
          </ul>
        </nav>
      </div>

      {/* Client-side interactive content */}
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
            <div className="text-center">
              <SimpleLoadingSpinner />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Loading amazing book collections...
              </p>
            </div>
          </div>
        }
      >
        <ExplorePageClient />
      </Suspense>
    </main>
  );
}
