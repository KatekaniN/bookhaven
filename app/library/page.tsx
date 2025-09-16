"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  StarIcon,
  UserIcon,
  ClockIcon,
  SparklesIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useNYTBooksCache } from "../../hooks/useNYTBooksCache";
import toast from "react-hot-toast";

// Type definitions
type IconType = string | ComponentType<SVGProps<SVGSVGElement>>;

interface CuratedList {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  color: string;
  mood: string;
}

interface NYTBook {
  title: string;
  author: string;
  description: string;
  book_image: string;
  amazon_product_url: string;
  rank: number;
  weeks_on_list: number;
  primary_isbn13: string;
  publisher: string;
}

// Enhanced NY Times Book Lists with mood-based categories
const CURATED_LISTS: CuratedList[] = [
  {
    id: "hardcover-fiction",
    name: "Trending Fiction",
    description: "The hottest stories everyone's talking about",
    icon: "/library/icons/trending.png",
    color: "from-primary-500 to-primary-600",
    mood: "Trending",
  },
  {
    id: "combined-print-and-e-book-fiction",
    name: "All-Time Favorites",
    description: "Beloved stories across all formats",
    icon: "/library/icons/favorites.png",
    color: "from-secondary-500 to-accent-500",
    mood: "Beloved",
  },
  {
    id: "hardcover-nonfiction",
    name: "Mind Expanding",
    description: "Real stories that will change your perspective",
    icon: "/library/icons/mind-expanding.png",
    color: "from-primary-400 to-primary-500",
    mood: "Enlightening",
  },
  {
    id: "young-adult-hardcover",
    name: "Young Adult",
    description: "Adventures for young hearts and minds",
    icon: "/library/icons/young-adult.png",
    color: "from-primary-600 to-primary-700",
    mood: "Bold",
  },
  {
    id: "paperback-trade-fiction",
    name: "Cozy Reads",
    description: "Perfect companions for quiet evenings",
    icon: "/library/icons/cozy-reads.png",
    color: "from-accent-400 to-accent-500",
    mood: "Cozy",
  },
  {
    id: "advice-how-to-and-miscellaneous",
    name: "Life Changing",
    description: "Transform your world one page at a time",
    icon: "/library/icons/life-changing.png",
    color: "from-secondary-400 to-secondary-500",
    mood: "Inspiring",
  },
  {
    id: "combined-print-and-e-book-nonfiction",
    name: "Real Stories",
    description: "True tales that inspire and inform",
    icon: "/library/icons/real-stories.png",
    color: "from-primary-300 to-primary-400",
    mood: "Authentic",
  },
  {
    id: "paperback-nonfiction",
    name: "Knowledge Base",
    description: "Essential insights for curious minds",
    icon: "/library/icons/knowledge-base.png",
    color: "from-accent-300 to-accent-400",
    mood: "Educational",
  },
  {
    id: "business-books",
    name: "Success Stories",
    description: "Strategies and insights for achievers",
    icon: "/library/icons/success-stories.png",
    color: "from-secondary-600 to-accent-600",
    mood: "Ambitious",
  },
  {
    id: "science",
    name: "Wonder & Discovery",
    description: "Explore the mysteries of our universe",
    icon: "/library/icons/wonder-discovery.png",
    color: "from-primary-500 to-secondary-400",
    mood: "Curious",
  },
  {
    id: "graphic-books-and-manga",
    name: "Visual Stories",
    description: "Art and narrative beautifully combined",
    icon: "/library/icons/visual-stories.png",
    color: "from-accent-500 to-primary-500",
    mood: "Creative",
  },
  {
    id: "mass-market-monthly",
    name: "Quick Escapes",
    description: "Perfect reads for busy schedules",
    icon: "/library/icons/quick-escapes.png",
    color: "from-secondary-300 to-secondary-400",
    mood: "Fast-paced",
  },
];

interface BookSection {
  id: string;
  name: string;
  books: NYTBook[];
  loading: boolean;
  error?: string;
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedList, setSelectedList] = useState(
    categoryParam || "hardcover-fiction"
  );
  const { fetchNYTBooks } = useNYTBooksCache();
  const [currentSection, setCurrentSection] = useState<BookSection>(() => {
    const defaultCategory = categoryParam || "hardcover-fiction";
    const categoryConfig = CURATED_LISTS.find(
      (list) => list.id === defaultCategory
    );
    return {
      id: defaultCategory,
      name: categoryConfig?.name || "Hardcover Fiction",
      books: [],
      loading: true,
    };
  });

  // Load selected book section
  useEffect(() => {
    const loadSelectedSection = async () => {
      const selectedListConfig = CURATED_LISTS.find(
        (list) => list.id === selectedList
      );
      if (!selectedListConfig) return;

      setCurrentSection({
        id: selectedList,
        name: selectedListConfig.name,
        books: [],
        loading: true,
      });

      try {
        const books = await fetchNYTBooks(selectedList);
        setCurrentSection({
          id: selectedList,
          name: selectedListConfig.name,
          books,
          loading: false,
        });
      } catch (error) {
        setCurrentSection({
          id: selectedList,
          name: selectedListConfig.name,
          books: [],
          loading: false,
          error: "Failed to load books",
        });
      }
    };

    loadSelectedSection();
  }, [selectedList, fetchNYTBooks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Magical Library Background */}
      <div
        className="absolute inset-0 opacity-20 dark:opacity-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/library/backgrounds/background.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Magical Texture Overlay */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-20"
        style={{
          backgroundImage: "url(/library/textures/background-texture.png)",
          backgroundSize: "512px 512px",
          backgroundRepeat: "repeat",
        }}
      />

      {/* Magical Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-2 h-2 bg-secondary-300 rounded-full opacity-60 animate-float"></div>
        <div
          className="absolute top-40 right-20 w-1 h-1 bg-primary-300 rounded-full opacity-40 animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-accent-300 rounded-full opacity-50 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-2 h-2 bg-secondary-200 rounded-full opacity-30 animate-float"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Soft light rays */}
        <div className="absolute top-0 left-1/4 w-px h-64 bg-gradient-to-b from-secondary-200/20 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-48 bg-gradient-to-b from-primary-200/15 to-transparent transform -rotate-6"></div>
      </div>

      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Enchanted Library Header */}
        <div className="text-center mb-16 relative">
          {/* Decorative arch background */}
          <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 w-80 h-40 bg-contain bg-center bg-no-repeat opacity-40 dark:opacity-30"
            style={{
              backgroundImage: "url(/library/decorations/arch.png)",
            }}
          />

          <div className="flex justify-center mb-8 relative">
            <div className="relative group">
              {/* Magical glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-300 to-primary-300 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-br from-secondary-100 to-secondary-200 dark:from-secondary-300 dark:to-secondary-300 backdrop-blur-sm rounded-full p-8 border-2 border-secondary-300 dark:border-secondary-300 shadow-xl">
                <img
                  src="/library/icons/grand-library-building.png"
                  alt="The Grand Library"
                  className="h-24 w-24 object-contain"
                />
                <SparklesIcon className="h-6 w-6 text-secondary-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="relative">
            <h1 className="text-6xl font-serif font-bold text-gradient mb-6 relative">
              The Grand Library
              {/* Decorative underline using divider */}
              <div
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-4 bg-contain bg-center bg-no-repeat opacity-60"
                style={{
                  backgroundImage: "url(/library/decorations/divider-1.png)",
                }}
              />
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-serif italic">
              &ldquo;A sanctuary where stories live, breathe, and whisper their
              secrets to those who seek them. Step into our curated halls and
              discover worlds beyond imagination.&rdquo;
            </p>
          </div>
        </div>

        {/* Floating Library Sections */}
        <div className="mb-12 relative">
          {/* Magical shelf background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 via-white/50 to-secondary-50/30 dark:from-gray-800/30 dark:via-gray-700/50 dark:to-gray-800/30 rounded-3xl transform -rotate-1"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-accent-50/20 via-transparent to-primary-50/20 dark:from-gray-700/20 dark:to-gray-800/20 rounded-3xl transform rotate-1"></div>

          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-2 border-primary-100 dark:border-primary-800 shadow-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 mr-3 text-primary-500" />
                Choose Your Literary Journey
                <BookOpenIcon className="h-6 w-6 ml-3 text-primary-500 scale-x-[-1]" />
              </h3>
              <div className="w-32 h-1 bg-gradient-to-r from-secondary-400 to-primary-400 mx-auto rounded-full"></div>
            </div>

            {/* Floating Category Shelves */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {CURATED_LISTS.map((list, index) => {
                const isImageIcon = typeof list.icon === "string";
                const IconComponent = isImageIcon
                  ? null
                  : (list.icon as ComponentType<SVGProps<SVGSVGElement>>);
                return (
                  <div
                    key={list.id}
                    className="relative group animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Floating book shelf effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary-100/20 to-secondary-100/20 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300"></div>

                    <button
                      onClick={() => setSelectedList(list.id)}
                      className={`relative w-full p-5 rounded-lg text-center transition-all duration-300 transform group-hover:scale-105 ${
                        selectedList === list.id
                          ? `bg-gradient-to-br ${list.color} text-white shadow-lg shadow-primary-200/50 dark:shadow-primary-800/50 scale-105`
                          : "bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg"
                      }`}
                    >
                      {/* Magical book spine design */}
                      <div className="space-y-3">
                        {/* Icon with magical glow */}
                        <div
                          className={`mx-auto w-fit p-3 rounded-full ${
                            selectedList === list.id
                              ? "bg-white/20 backdrop-blur-sm"
                              : "bg-primary-100 dark:bg-primary-900/30"
                          } transition-all duration-300`}
                        >
                          {isImageIcon ? (
                            <img
                              src={list.icon as string}
                              alt={list.name}
                              className="h-16 w-16 object-contain"
                            />
                          ) : (
                            IconComponent && (
                              <IconComponent
                                className={`h-16 w-16 ${
                                  selectedList === list.id
                                    ? "text-white"
                                    : "text-primary-600 dark:text-primary-400"
                                }`}
                              />
                            )
                          )}
                        </div>

                        {/* Category mood */}
                        <div
                          className={`text-xs font-medium tracking-wide ${
                            selectedList === list.id
                              ? "text-white/90"
                              : "text-primary-600 dark:text-primary-400"
                          }`}
                        >
                          {list.mood}
                        </div>

                        {/* Category name */}
                        <h4
                          className={`font-serif font-semibold text-sm leading-tight ${
                            selectedList === list.id
                              ? "text-white"
                              : "text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {list.name}
                        </h4>
                      </div>

                      {/* Magical selection indicator */}
                      {selectedList === list.id && (
                        <>
                          <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg pointer-events-none"></div>
                          <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-secondary-300/50 to-primary-300/50 rounded-lg animate-pulse pointer-events-none"></div>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Enchanted Book Collection */}
        {currentSection.loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              {/* Magical loading circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-300 to-primary-300 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-primary-200 dark:border-primary-700 shadow-2xl p-16 text-center">
                <div className="relative">
                  <LoadingSpinner size="lg" />
                  {/* Magical loading animations */}
                  <img
                    src="/library/animations/loading-1.png"
                    alt=""
                    className="absolute -top-8 -left-8 w-6 h-8 animate-float opacity-60"
                  />
                  <img
                    src="/library/animations/loading-2.png"
                    alt=""
                    className="absolute -top-6 -right-6 w-5 h-7 animate-float opacity-60"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <img
                    src="/library/animations/loading-3.png"
                    alt=""
                    className="absolute -bottom-6 -left-6 w-4 h-6 animate-float opacity-60"
                    style={{ animationDelay: "1s" }}
                  />
                  <img
                    src="/library/animations/loading-4.png"
                    alt=""
                    className="absolute -bottom-8 -right-8 w-5 h-6 animate-float opacity-60"
                    style={{ animationDelay: "1.5s" }}
                  />
                </div>
                <p className="mt-6 text-gray-700 dark:text-gray-300 font-serif italic">
                  Gathering stories from the {currentSection.name} collection...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Magical book hall background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-50/20 via-white/30 to-secondary-50/20 dark:from-gray-800/20 dark:via-gray-700/30 dark:to-gray-800/20 rounded-3xl transform rotate-1"></div>

            <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl border-2 border-primary-100 dark:border-primary-800 shadow-2xl overflow-hidden">
              {/* Collection Header with Magical Elements */}
              <div className="relative bg-gradient-to-r from-primary-50/50 to-secondary-50/50 dark:from-gray-800/50 dark:to-gray-700/50 p-8 border-b border-primary-200/50 dark:border-primary-700/50">
                {/* Decorative corner elements */}
                <div
                  className="absolute top-0 left-0 w-16 h-16 bg-contain bg-no-repeat opacity-40"
                  style={{
                    backgroundImage: "url(/library/decorations/corner-1.png)",
                  }}
                />
                <div
                  className="absolute top-0 right-0 w-16 h-16 bg-contain bg-no-repeat opacity-40 transform scale-x-[-1]"
                  style={{
                    backgroundImage: "url(/library/decorations/corner-2.png)",
                  }}
                />

                {(() => {
                  const listConfig = CURATED_LISTS.find(
                    (l) => l.id === currentSection.id
                  );
                  if (!listConfig) return null;

                  const isHeaderImageIcon = typeof listConfig.icon === "string";
                  const HeaderIconComponent = isHeaderImageIcon
                    ? null
                    : (listConfig.icon as ComponentType<
                        SVGProps<SVGSVGElement>
                      >);

                  return (
                    <div className="flex items-center justify-between relative">
                      <div className="flex items-center space-x-6">
                        {/* Magical book icon */}
                        <div className="relative group">
                          <div className="absolute inset-0 bg-gradient-to-r from-secondary-300 to-primary-300 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity"></div>
                          <div
                            className={`relative p-4 rounded-2xl bg-gradient-to-br ${listConfig.color} shadow-lg`}
                          >
                            {isHeaderImageIcon ? (
                              <img
                                src={listConfig.icon as string}
                                alt={listConfig.name}
                                className="h-16 w-16 object-contain filter brightness-0 invert"
                              />
                            ) : (
                              HeaderIconComponent && (
                                <HeaderIconComponent className="h-16 w-16 text-white" />
                              )
                            )}
                          </div>
                          {/* Sparkle effect */}
                          <SparklesIcon className="absolute -top-2 -right-2 h-6 w-6 text-secondary-400 animate-pulse" />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="badge badge-primary font-serif">
                              {listConfig.mood}
                            </div>
                            <div className="badge badge-secondary font-serif">
                              Book Haven Collection
                            </div>
                          </div>
                          <h2 className="text-4xl font-serif font-bold text-gray-900 dark:text-white">
                            {currentSection.name}
                          </h2>
                          <p className="text-lg text-gray-600 dark:text-gray-400 font-serif italic max-w-2xl">
                            {listConfig.description}
                          </p>
                        </div>
                      </div>

                      {/* Book count indicator */}
                      <div className="hidden lg:block">
                        <div className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-4 border border-primary-200 dark:border-primary-700">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {currentSection.books.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-serif">
                              Enchanted Tales
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Book Gallery */}
              <div className="p-8">
                {currentSection.error ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full blur-2xl opacity-50"></div>
                      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-red-200 dark:border-red-800 p-12">
                        <div className="text-red-600 dark:text-red-400 text-xl font-serif font-semibold mb-4">
                          {currentSection.error}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-serif italic">
                          The magical tomes seem to be hiding. Please try
                          another collection or return later.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Floating decorative elements */}
                    <div className="absolute top-1/3 left-8 transform -translate-y-1/2">
                      <img
                        src="/library/decorations/divider-1.png"
                        alt=""
                        className="w-32 h-4 opacity-30 animate-float"
                      />
                    </div>
                    <div className="absolute top-2/3 right-8 transform -translate-y-1/2">
                      <img
                        src="/library/decorations/divider-2.png"
                        alt=""
                        className="w-24 h-3 opacity-30 animate-float"
                        style={{ animationDelay: "1s" }}
                      />
                    </div>

                    {/* Floating Books Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {currentSection.books.slice(0, 12).map((book, index) => (
                        <div
                          key={book.primary_isbn13 || index}
                          className="group relative animate-fade-in"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          {/* Floating effect shadow */}
                          <div className="absolute inset-0 bg-gradient-to-b from-primary-100/20 to-secondary-100/20 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl transform translate-y-2 group-hover:translate-y-1 transition-transform duration-300 blur-sm"></div>

                          {/* Main book card */}
                          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-primary-100 dark:border-primary-800 group-hover:scale-105 transform">
                            {/* Magical corner elements for book cards */}
                            <div
                              className="absolute top-0 left-0 w-8 h-8 bg-contain bg-no-repeat opacity-20 group-hover:opacity-40 transition-opacity z-10"
                              style={{
                                backgroundImage:
                                  "url(/library/decorations/corner-3.png)",
                              }}
                            />
                            <div
                              className="absolute bottom-0 right-0 w-8 h-8 bg-contain bg-no-repeat opacity-20 group-hover:opacity-40 transition-opacity transform rotate-180 z-10"
                              style={{
                                backgroundImage:
                                  "url(/library/decorations/corner-4.png)",
                              }}
                            />

                            {/* Book Cover */}
                            <div className="relative overflow-hidden">
                              <img
                                src={book.book_image || "/placeholder-book.jpg"}
                                alt={book.title}
                                className="book-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder-book.jpg";
                                }}
                              />

                              {/* Magical overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                              {/* Rank badge */}
                              <div className="absolute top-3 left-3">
                                <div className="bg-gradient-to-r from-secondary-400 to-secondary-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                  #{book.rank}
                                </div>
                              </div>

                              {/* Floating heart on hover */}
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <button className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                  <HeartIcon className="h-5 w-5 text-red-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>

                            {/* Book Information */}
                            <div className="p-5 space-y-4">
                              <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                                {book.title}
                              </h3>

                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                <UserIcon className="h-4 w-4 mr-2 flex-shrink-0 text-primary-500" />
                                <span className="line-clamp-1 font-serif">
                                  {book.author}
                                </span>
                              </p>

                              <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-3 leading-relaxed font-serif italic">
                                {book.description}
                              </p>

                              {/* Magical stats */}
                              <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span className="flex items-center text-primary-600 dark:text-primary-400">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {book.weeks_on_list} weeks
                                </span>
                                <span className="flex items-center text-secondary-600 dark:text-secondary-400">
                                  <StarIcon className="h-3 w-3 mr-1" />
                                  Bestseller
                                </span>
                              </div>

                              <p className="text-xs text-gray-400 dark:text-gray-500 font-serif">
                                Published by {book.publisher}
                              </p>
                            </div>

                            {/* Magical hover actions */}
                            <div className="p-5 pt-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                              <button className="btn btn-primary w-full font-serif">
                                Enter This World
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* View More Magical Portal */}
                    {currentSection.books.length > 12 && (
                      <div className="text-center mt-12">
                        <div className="relative inline-block">
                          <div className="absolute inset-0 bg-gradient-to-r from-secondary-300 to-primary-300 rounded-2xl blur-lg opacity-40 animate-pulse"></div>
                          <button className="relative bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-serif font-semibold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                            <span className="flex items-center">
                              Explore All {currentSection.books.length} Tales
                              <SparklesIcon className="ml-2 h-5 w-5" />
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
