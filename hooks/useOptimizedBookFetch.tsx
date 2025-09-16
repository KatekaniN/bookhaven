import { useState, useCallback } from "react";
import { OpenLibraryAPI } from "../lib/openLibrary";
import { useBookCache } from "./useBookCache";
import { UserData } from "./useUserPreferences";

interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  likelihoodScore: number;
  reviewCount: number;
  subjects: string[];
  mood: string;
  description: string;
  publishYear?: number;
  rating?: number;
}

interface CarouselConfig {
  id: string;
  title: string;
  subtitle?: string;
  query: string;
  filters?: {
    yearRange?: [number, number];
    minimumRating?: number;
    subjects?: string[];
  };
  mood?: string;
}

export function useOptimizedBookFetch() {
  const {
    get: getCached,
    set: setCached,
    has: hasCached,
    getCacheStats,
  } = useBookCache<Book[]>({
    ttl: 60 * 60 * 1000, // 1 hour cache
    maxSize: 50,
  });

  const [fetchQueue, setFetchQueue] = useState<Set<string>>(new Set());

  // Optimized single search with better error handling
  const fetchSingleSearch = useCallback(
    async (
      searchTerm: string,
      limit: number = 12,
      offset: number = 0
    ): Promise<any[]> => {
      try {
        const result = await OpenLibraryAPI.searchBooks(
          searchTerm,
          limit,
          offset,
          "relevance"
        );
        return result.docs || [];
      } catch (error) {
        console.warn(`Search failed for "${searchTerm}":`, error);
        return [];
      }
    },
    []
  );

  // Helper function for smart filtering with fallbacks
  const applyFiltersWithFallback = useCallback(
    (books: any[], filters: any): any[] => {
      let filtered = books;

      // Apply year filter
      if (filters.yearRange) {
        const [minYear, maxYear] = filters.yearRange;
        const yearFiltered = books.filter((book) => {
          const year = book.first_publish_year || book.publish_year?.[0];
          return year && year >= minYear && year <= maxYear;
        });

        // If year filter is too restrictive, expand the range
        if (yearFiltered.length < 6 && maxYear - minYear <= 10) {
          const expandedMin = Math.max(1900, minYear - 10);
          const expandedMax = Math.min(2025, maxYear + 10);
          filtered = books.filter((book) => {
            const year = book.first_publish_year || book.publish_year?.[0];
            return !year || (year >= expandedMin && year <= expandedMax);
          });
        } else {
          filtered = yearFiltered.length > 0 ? yearFiltered : filtered;
        }
      }

      // Apply rating filter (simplified for API limitations)
      if (filters.minimumRating && filtered.length > 6) {
        // Only apply if we have enough books to filter
        const ratingFiltered = filtered.filter(
          (book) =>
            !book.ratings_average ||
            book.ratings_average >= filters.minimumRating - 0.5
        );
        filtered = ratingFiltered.length >= 4 ? ratingFiltered : filtered;
      }

      return filtered;
    },
    []
  );

  // Determine mood from subjects
  const determineMood = useCallback((subjects: string[]): string => {
    const subjectStr = subjects.join(" ").toLowerCase();

    if (subjectStr.includes("romance") || subjectStr.includes("love"))
      return "Emotional & Deep";
    if (subjectStr.includes("thriller") || subjectStr.includes("mystery"))
      return "Dark & Mysterious";
    if (subjectStr.includes("comedy") || subjectStr.includes("humor"))
      return "Light & Fun";
    if (subjectStr.includes("science") || subjectStr.includes("adventure"))
      return "Fast-paced & Exciting";
    if (subjectStr.includes("fantasy") || subjectStr.includes("cozy"))
      return "Cozy & Comfortable";

    return "Educational";
  }, []);

  // Generate realistic rating
  const generateRealisticRating = useCallback((book: any): number => {
    const baseRating = book.ratings_average || 3.5 + Math.random() * 1.5;
    return Math.round(Math.min(5.0, Math.max(3.0, baseRating)) * 10) / 10;
  }, []);

  // Calculate likelihood score
  const calculateLikelihoodScore = useCallback(
    (
      book: any,
      subjects: string[],
      mood: string,
      userData?: UserData
    ): number => {
      let score = 50;

      if (userData?.preferences?.genres) {
        const genreMatches = subjects.filter((subject) =>
          userData.preferences.genres.some((genre) =>
            subject.toLowerCase().includes(genre.toLowerCase())
          )
        ).length;
        score += genreMatches * 15;
      }

      // Boost for popularity indicators
      if (book.want_to_read_count > 1000) score += 10;
      if (book.edition_count > 5) score += 5;

      // Recent publication bonus
      const currentYear = new Date().getFullYear();
      const bookYear = book.first_publish_year || currentYear - 5;
      if (currentYear - bookYear <= 5) score += 10;

      return Math.max(0, Math.min(100, score));
    },
    []
  );

  // Optimized book formatting
  const formatBookData = useCallback(
    (book: any, userData?: UserData, forcedMood?: string): Book => {
      const subjects = book.subject?.slice(0, 3) || ["Fiction"];
      const mood = forcedMood || determineMood(subjects);

      return {
        id: book.key || `book_${book.title}_${book.author_name?.[0]}`,
        title: book.title,
        author: book.author_name?.[0] || "Unknown Author",
        cover: book.cover_i
          ? OpenLibraryAPI.getCoverUrl(book.cover_i, "M")
          : "/placeholder-book.jpg",
        likelihoodScore: calculateLikelihoodScore(
          book,
          subjects,
          mood,
          userData
        ),
        reviewCount:
          book.want_to_read_count || Math.floor(Math.random() * 10000) + 1000,
        subjects,
        mood,
        description:
          book.first_sentence?.[0] || `An engaging ${mood.toLowerCase()} book.`,
        publishYear: book.first_publish_year || book.publish_year?.[0],
        rating: generateRealisticRating(book),
      };
    },
    [determineMood, calculateLikelihoodScore, generateRealisticRating]
  );

  // Optimized carousel fetching with caching and fallbacks
  const fetchCarouselBooks = useCallback(
    async (
      config: CarouselConfig,
      userData?: UserData,
      priority: "high" | "normal" | "low" = "normal"
    ): Promise<Book[]> => {
      const cacheKey = `carousel-${config.id}-${config.query}-${JSON.stringify(
        config.filters
      )}-${userData?.preferences?.genres?.join(",") || "no-user"}`;

      // Check cache first
      const cached = getCached(cacheKey);
      if (cached && cached.length > 0) {
        console.log(
          `Cache hit for carousel ${config.id} (${cached.length} books)`
        );
        return cached;
      }

      // Prevent duplicate requests
      if (fetchQueue.has(config.id)) {
        console.log(`Request already in progress for carousel ${config.id}`);
        return [];
      }

      setFetchQueue((prev) => {
        const newSet = new Set(prev);
        newSet.add(config.id);
        return newSet;
      });

      try {
        let allBooks: any[] = [];

        // Strategy 1: Try primary search terms first
        const primaryTerms = config.query.split(" ").slice(0, 2); // Use only first 2 terms

        for (const term of primaryTerms) {
          const books = await fetchSingleSearch(
            term,
            priority === "high" ? 15 : 10,
            Math.floor(Math.random() * 20)
          );
          allBooks.push(...books);

          if (allBooks.length >= 20) break; // Stop early if we have enough
        }

        // Strategy 2: If not enough books, try broader search
        if (allBooks.length < 8) {
          console.log(
            `Carousel ${config.id}: Primary search yielded ${allBooks.length} books, trying broader search...`
          );

          const broadSearches = [
            config.query.split(" ")[0], // Just first word
            "fiction", // Fallback to fiction
            "popular", // Fallback to popular
          ];

          for (const broadTerm of broadSearches) {
            if (allBooks.length >= 8) break;

            const books = await fetchSingleSearch(
              broadTerm,
              10,
              Math.floor(Math.random() * 30)
            );
            allBooks.push(...books);
          }
        }

        // Filter and format books
        const validBooks = allBooks
          .filter((book) => book.cover_i && book.author_name?.[0] && book.title)
          .filter(
            (book, index, self) =>
              index ===
              self.findIndex(
                (b) =>
                  b.title === book.title &&
                  b.author_name?.[0] === book.author_name?.[0]
              )
          );

        // Apply filters with smart fallbacks
        let filteredBooks = validBooks;

        if (config.filters) {
          filteredBooks = applyFiltersWithFallback(validBooks, config.filters);
        }

        // Format books
        const formattedBooks = filteredBooks
          .slice(0, 15)
          .map((book) => formatBookData(book, userData, config.mood));

        // Sort by likelihood score
        formattedBooks.sort(
          (a, b) => (b.likelihoodScore || 0) - (a.likelihoodScore || 0)
        );

        const finalBooks = formattedBooks.slice(0, 12);

        // Cache the results
        setCached(cacheKey, finalBooks);

        console.log(
          `Carousel ${config.id}: Found ${finalBooks.length} books (cached for 1 hour)`
        );
        return finalBooks;
      } catch (error) {
        console.error(`Error fetching carousel ${config.id}:`, error);
        return [];
      } finally {
        setFetchQueue((prev) => {
          const newSet = new Set(prev);
          newSet.delete(config.id);
          return newSet;
        });
      }
    },
    [
      getCached,
      setCached,
      fetchQueue,
      fetchSingleSearch,
      applyFiltersWithFallback,
      formatBookData,
    ]
  );

  return {
    fetchCarouselBooks,
    isInQueue: (id: string) => fetchQueue.has(id),
    getCacheStats,
  };
}
