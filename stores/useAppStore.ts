import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

export interface UserPreferences {
  genres: string[];
  topics: string[];
  languages: string[];
  readingGoal?: number;
  readingPace?: string;
  bookFormats?: string[];
}

export interface BookRating {
  id: string;
  bookId: string;
  title: string;
  author: string;
  rating: number;
  isLiked: boolean;
  weight: number;
}

export interface AuthorRating {
  id: string;
  authorName: string;
  rating: number;
  isLiked: boolean;
  weight: number;
}

export interface UserBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  pages: number;
  publishedYear: number;
  genre: string[];
  mood: string[];
  isbn: string;
  rating: number;
  status: "want-to-read" | "currently-reading" | "read";
  dateAdded: string;
  currentPage?: number;
  userRating?: number;
  notes?: string;
  startedReading?: string;
  finishedReading?: string;
  userReview?: string;
  reviewDate?: string;
  isLiked?: boolean;
}

export interface ReadingGoal {
  id: string;
  year: number;
  targetBooks: number;
  targetPages?: number;
  targetGenres?: string[];
  isActive: boolean;
  createdAt: string;
  description?: string;
}

interface AppState {
  // Onboarding state
  hasCompletedOnboarding: boolean;
  isOnboardingInProgress: boolean;
  currentOnboardingStep: number;

  // User preferences
  userPreferences: UserPreferences | null;
  bookRatings: BookRating[];
  authorRatings: AuthorRating[];

  // User books library
  userBooks: UserBook[];

  // Reading goals
  readingGoals: ReadingGoal[];

  // UI state
  isLoading: boolean;

  // Actions
  setOnboardingCompleted: (completed: boolean) => void;
  setOnboardingStep: (step: number) => void;
  setOnboardingInProgress: (inProgress: boolean) => void;

  setUserPreferences: (preferences: UserPreferences) => void;
  setBookRatings: (ratings: BookRating[]) => void;
  setAuthorRatings: (ratings: AuthorRating[]) => void;

  // User books actions
  setUserBooks: (books: UserBook[]) => void;
  addUserBook: (book: UserBook) => void;
  updateUserBook: (bookId: string, updates: Partial<UserBook>) => void;
  removeUserBook: (bookId: string) => void;
  isBookInLibrary: (bookId: string) => boolean;
  getBookFromLibrary: (bookId: string) => UserBook | undefined;
  clearOldDiscoverBooks: () => void;

  // Reading goals actions
  setReadingGoals: (goals: ReadingGoal[]) => void;
  addReadingGoal: (goal: ReadingGoal) => void;
  updateReadingGoal: (goalId: string, updates: Partial<ReadingGoal>) => void;
  removeReadingGoal: (goalId: string) => void;
  getActiveReadingGoal: (year?: number) => ReadingGoal | undefined;

  // Book interaction actions
  likeBook: (bookId: string, bookData: Partial<UserBook>) => void;
  unlikeBook: (bookId: string) => void;
  rateBook: (
    bookId: string,
    rating: number,
    bookData?: Partial<UserBook>
  ) => void;

  setLoading: (loading: boolean) => void;

  // Complex actions
  completeOnboarding: (
    preferences: UserPreferences,
    bookRatings: BookRating[],
    authorRatings: AuthorRating[]
  ) => void;
  resetOnboarding: () => void;

  // Helper actions
  _migrateOldPlaceholders: () => void;

  // Computed getters
  getRecommendationData: () => {
    preferences: UserPreferences | null;
    bookRatings: BookRating[];
    authorRatings: AuthorRating[];
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      hasCompletedOnboarding: false,
      isOnboardingInProgress: false,
      currentOnboardingStep: 1,
      userPreferences: null,
      bookRatings: [],
      authorRatings: [],
      userBooks: [],
      readingGoals: [],
      isLoading: false,

      // Helper function to migrate old placeholder URLs
      _migrateOldPlaceholders: () =>
        set((state) => ({
          userBooks: state.userBooks.map((book) => ({
            ...book,
            cover: book.cover.includes("via.placeholder.com")
              ? "/placeholder-book.jpg"
              : book.cover,
          })),
        })),

      // Basic setters
      setOnboardingCompleted: (completed) =>
        set({ hasCompletedOnboarding: completed }),

      setOnboardingStep: (step) => set({ currentOnboardingStep: step }),

      setOnboardingInProgress: (inProgress) =>
        set({ isOnboardingInProgress: inProgress }),

      setUserPreferences: (preferences) =>
        set({ userPreferences: preferences }),

      setBookRatings: (ratings) => set({ bookRatings: ratings }),

      setAuthorRatings: (ratings) => set({ authorRatings: ratings }),

      // User books actions
      setUserBooks: (books) => set({ userBooks: books }),

      addUserBook: (book) =>
        set((state) => ({ userBooks: [...state.userBooks, book] })),

      updateUserBook: (bookId, updates) =>
        set((state) => ({
          userBooks: state.userBooks.map((book) =>
            book.id === bookId ? { ...book, ...updates } : book
          ),
        })),

      removeUserBook: (bookId) =>
        set((state) => ({
          userBooks: state.userBooks.filter((book) => book.id !== bookId),
        })),

      clearOldDiscoverBooks: () =>
        set((state) => ({
          userBooks: state.userBooks.filter(
            (book) => !book.id.startsWith("discover-")
          ),
        })),

      isBookInLibrary: (bookId) => {
        const state = get();
        return state.userBooks.some((book) => book.id === bookId);
      },

      getBookFromLibrary: (bookId) => {
        const state = get();
        return state.userBooks.find((book) => book.id === bookId);
      },

      // Reading goals actions
      setReadingGoals: (goals) => set({ readingGoals: goals }),

      addReadingGoal: (goal) =>
        set((state) => ({ readingGoals: [...state.readingGoals, goal] })),

      updateReadingGoal: (goalId, updates) =>
        set((state) => ({
          readingGoals: state.readingGoals.map((goal) =>
            goal.id === goalId ? { ...goal, ...updates } : goal
          ),
        })),

      removeReadingGoal: (goalId) =>
        set((state) => ({
          readingGoals: state.readingGoals.filter((goal) => goal.id !== goalId),
        })),

      getActiveReadingGoal: (year) => {
        const state = get();
        const currentYear = year || new Date().getFullYear();
        return state.readingGoals.find(
          (goal) => goal.year === currentYear && goal.isActive
        );
      },

      likeBook: (bookId, bookData) =>
        set((state) => {
          const existingBook = state.userBooks.find(
            (book) => book.id === bookId
          );
          if (existingBook) {
            // Update existing book
            return {
              userBooks: state.userBooks.map((book) =>
                book.id === bookId ? { ...book, isLiked: true } : book
              ),
            };
          } else {
            // Add new book as liked
            const newBook: UserBook = {
              id: bookId,
              title: bookData.title || "Unknown Title",
              author: bookData.author || "Unknown Author",
              cover: bookData.cover || "/placeholder-book.jpg",
              description: bookData.description || "",
              rating: bookData.rating || 0,
              status: "want-to-read",
              dateAdded: new Date().toISOString().split("T")[0],
              genre: bookData.genre || [],
              mood: bookData.mood || [],
              isbn: bookData.isbn || "",
              pages: bookData.pages || 0,
              publishedYear: bookData.publishedYear || new Date().getFullYear(),
              isLiked: true,
              ...bookData,
            };
            return { userBooks: [...state.userBooks, newBook] };
          }
        }),

      unlikeBook: (bookId) =>
        set((state) => ({
          userBooks: state.userBooks.map((book) =>
            book.id === bookId ? { ...book, isLiked: false } : book
          ),
        })),

      rateBook: (bookId, rating, bookData) =>
        set((state) => {
          const existingBook = state.userBooks.find(
            (book) => book.id === bookId
          );
          if (existingBook) {
            // Update existing book
            return {
              userBooks: state.userBooks.map((book) =>
                book.id === bookId ? { ...book, userRating: rating } : book
              ),
            };
          } else if (bookData) {
            // Add new book with rating
            const newBook: UserBook = {
              id: bookId,
              title: bookData.title || "Unknown Title",
              author: bookData.author || "Unknown Author",
              cover: bookData.cover || "/placeholder-book.jpg",
              description: bookData.description || "",
              rating: bookData.rating || 0,
              status: "want-to-read",
              dateAdded: new Date().toISOString().split("T")[0],
              genre: bookData.genre || [],
              mood: bookData.mood || [],
              isbn: bookData.isbn || "",
              pages: bookData.pages || 0,
              publishedYear: bookData.publishedYear || new Date().getFullYear(),
              userRating: rating,
              ...bookData,
            };
            return { userBooks: [...state.userBooks, newBook] };
          }
          return state;
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      // Complex actions
      completeOnboarding: (preferences, bookRatings, authorRatings) =>
        set({
          hasCompletedOnboarding: true,
          isOnboardingInProgress: false,
          userPreferences: preferences,
          bookRatings,
          authorRatings,
          currentOnboardingStep: 1, // Reset for next time
        }),

      resetOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          isOnboardingInProgress: false,
          currentOnboardingStep: 1,
          userPreferences: null,
          bookRatings: [],
          authorRatings: [],
        }),

      // Debug action to completely reset the store
      resetAllData: () =>
        set({
          hasCompletedOnboarding: false,
          isOnboardingInProgress: false,
          currentOnboardingStep: 1,
          userPreferences: null,
          bookRatings: [],
          authorRatings: [],
          userBooks: [],
          readingGoals: [],
          isLoading: false,
        }),

      // Computed getters
      getRecommendationData: () => {
        const state = get();
        return {
          preferences: state.userPreferences,
          bookRatings: state.bookRatings,
          authorRatings: state.authorRatings,
        };
      },
    }),
    {
      name: "bookhaven-app-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist certain parts of the state
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentOnboardingStep: state.currentOnboardingStep,
        userPreferences: state.userPreferences,
        bookRatings: state.bookRatings,
        authorRatings: state.authorRatings,
        userBooks: state.userBooks, // Include userBooks in persistence
        readingGoals: state.readingGoals, // Include reading goals
      }),
      // Add some safeguards to prevent hydration issues
      skipHydration: false,
    }
  )
);

// Hydration-safe hook to prevent SSR mismatches
export const useHydratedStore = () => {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // If already hydrated
    if (useAppStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsubscribe;
  }, []);

  return hasHydrated;
};

// Individual selectors for better performance
export const useHasCompletedOnboarding = () =>
  useAppStore((state) => state.hasCompletedOnboarding);

export const useOnboardingStep = () =>
  useAppStore((state) => state.currentOnboardingStep);

export const useOnboardingActions = () =>
  useAppStore((state) => ({
    setStep: state.setOnboardingStep,
    complete: state.completeOnboarding,
    reset: state.resetOnboarding,
  }));

// For backward compatibility, keep the combined hook but make it more stable
export const useOnboardingState = () => {
  const hasCompleted = useAppStore((state) => state.hasCompletedOnboarding);
  const isInProgress = useAppStore((state) => state.isOnboardingInProgress);
  const currentStep = useAppStore((state) => state.currentOnboardingStep);
  const setCompleted = useAppStore((state) => state.setOnboardingCompleted);
  const setInProgress = useAppStore((state) => state.setOnboardingInProgress);
  const setStep = useAppStore((state) => state.setOnboardingStep);
  const complete = useAppStore((state) => state.completeOnboarding);
  const reset = useAppStore((state) => state.resetOnboarding);

  // Return a stable object by using useMemo if needed
  return {
    hasCompleted,
    isInProgress,
    currentStep,
    setCompleted,
    setInProgress,
    setStep,
    complete,
    reset,
  };
};

export const useUserData = () => {
  const preferences = useAppStore((state) => state.userPreferences);
  const bookRatings = useAppStore((state) => state.bookRatings);
  const authorRatings = useAppStore((state) => state.authorRatings);
  const setPreferences = useAppStore((state) => state.setUserPreferences);
  const setBookRatings = useAppStore((state) => state.setBookRatings);
  const setAuthorRatings = useAppStore((state) => state.setAuthorRatings);
  const getRecommendationData = useAppStore(
    (state) => state.getRecommendationData
  );

  return {
    preferences,
    bookRatings,
    authorRatings,
    setPreferences,
    setBookRatings,
    setAuthorRatings,
    getRecommendationData,
  };
};

export const useAppLoading = () =>
  useAppStore((state) => ({
    isLoading: state.isLoading,
    setLoading: state.setLoading,
  }));
