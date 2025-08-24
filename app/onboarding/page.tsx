"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  CheckIcon,
  ChevronRightIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  HeartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import BookRatingStep from "../../components/onboarding/BookRatingStep";
import {
  useOnboardingState,
  useUserData,
  useHydratedStore,
  useAppStore,
} from "../../stores/useAppStore";

interface UserPreference {
  id: string;
  userId: string;
  bookId?: string;
  authorName?: string;
  genre?: string;
  preferenceType: "book" | "author" | "genre";
  rating: number;
  isLiked: boolean;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OnboardingData {
  favoriteGenres: string[];
  readingGoal: number;
  readingPace: string;
  interests: string[];
  favoriteAuthors: string[];
  bookFormats: string[];
  bookRatings: UserPreference[];
  authorRatings: UserPreference[];
}

const GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Thriller",
  "Non-Fiction",
  "Biography",
  "History",
  "Self-Help",
  "Business",
  "Young Adult",
  "Literary Fiction",
  "Horror",
  "Comedy",
  "Poetry",
];

const INTERESTS = [
  "Book Clubs",
  "Author Events",
  "Reading Challenges",
  "Book Reviews",
  "Buddy Reading",
  "Genre Deep Dives",
  "New Releases",
  "Classic Literature",
  "International Books",
  "Award Winners",
];

const READING_PACES = [
  { value: "slow", label: "Slow & Steady", description: "1-2 books per month" },
  {
    value: "moderate",
    label: "Moderate Reader",
    description: "2-4 books per month",
  },
  { value: "fast", label: "Speed Reader", description: "4+ books per month" },
];

const BOOK_FORMATS = [
  { value: "physical", label: "Physical Books", emoji: "📖" },
  { value: "ebook", label: "E-books", emoji: "📱" },
  { value: "audiobook", label: "Audiobooks", emoji: "🎧" },
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Zustand state
  const onboarding = useOnboardingState();
  const userData = useUserData();
  const hasHydrated = useHydratedStore();
  const { addUserBook } = useAppStore();

  // Local state for onboarding form data only
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const onboarding = useOnboardingState();
  const userData = useUserData();
  const store = useHydratedStore();
  const { addUserBook } = useAppStore();

  const [data, setData] = useState<OnboardingData>({
    favoriteGenres: [],
    readingGoal: 12,
    readingPace: "moderate",
    interests: [],
    favoriteAuthors: [],
    bookFormats: ["physical"],
    bookRatings: [],
    authorRatings: [],
  });

  const totalSteps = 6;

  // Handle redirect in useEffect to avoid render-time side effects
  // Only check after hydration is complete
  useEffect(() => {
    if (!hasHydrated) return; // Wait for hydration

    if (onboarding.hasCompleted && !isRedirecting) {
      setIsRedirecting(true);
      router.push("/");
    }
  }, [onboarding.hasCompleted, router, isRedirecting, hasHydrated]);

  // Handle session-based redirects
  useEffect(() => {
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, router]);

  const handleGenreToggle = (genre: string) => {
    setData((prev) => ({
      ...prev,
      favoriteGenres: prev.favoriteGenres.includes(genre)
        ? prev.favoriteGenres.filter((g) => g !== genre)
        : [...prev.favoriteGenres, genre],
    }));
  };

  const handleRatingsChange = (
    bookRatings: UserPreference[],
    authorRatings: UserPreference[]
  ) => {
    setData((prev) => ({
      ...prev,
      bookRatings,
      authorRatings,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleFormatToggle = (format: string) => {
    setData((prev) => ({
      ...prev,
      bookFormats: prev.bookFormats.includes(format)
        ? prev.bookFormats.filter((f) => f !== format)
        : [...prev.bookFormats, format],
    }));
  };

  const handleNext = () => {
    if (onboarding.currentStep < totalSteps) {
      onboarding.setStep(onboarding.currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const preferences = {
        genres: data.favoriteGenres,
        topics: data.interests,
        languages: ["en"], // Default to English, can be expanded later
        readingGoal: data.readingGoal,
        readingPace: data.readingPace,
        bookFormats: data.bookFormats,
      };

      const bookRatings = data.bookRatings.map((rating) => ({
        id: rating.id,
        bookId: rating.bookId || "",
        title: "", // Will be filled from API data
        author: "", // Will be filled from API data
        rating: rating.rating,
        isLiked: rating.isLiked,
        weight: rating.weight,
      }));

      const authorRatings = data.authorRatings.map((rating) => ({
        id: rating.id,
        authorName: rating.authorName || "",
        rating: rating.rating,
        isLiked: rating.isLiked,
        weight: rating.weight,
      }));

      console.log("Completing onboarding with data:", {
        preferences,
        bookRatings,
        authorRatings,
      });

      // Mark onboarding as completed in Zustand store FIRST
      onboarding.complete(preferences, bookRatings, authorRatings);

      // Add rated books to user's library
      const ratedBooksToAdd = data.bookRatings
        .filter(rating => rating.rating >= 3) // Only add books rated 3+ stars
        .map((rating, index) => {
          // Create meaningful book entries from onboarding ratings
          const bookTitles = [
            "The Seven Husbands of Evelyn Hugo",
            "Educated", 
            "The Thursday Murder Club",
            "Atomic Habits",
            "The Midnight Library",
            "Project Hail Mary",
            "Klara and the Sun",
            "The Silent Patient"
          ];
          
          const bookAuthors = [
            "Taylor Jenkins Reid",
            "Tara Westover",
            "Richard Osman", 
            "James Clear",
            "Matt Haig",
            "Andy Weir",
            "Kazuo Ishiguro",
            "Alex Michaelides"
          ];

          const bookCovers = [
            "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780241425442-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9780593318171-L.jpg",
            "https://covers.openlibrary.org/b/isbn/9781250301697-L.jpg"
          ];

          const bookId = rating.bookId || rating.id;
          const bookIndex = Math.min(index, bookTitles.length - 1);
          
          return {
            id: `onboarding-${bookId}`,
            title: bookTitles[bookIndex],
            author: bookAuthors[bookIndex],
            cover: bookCovers[bookIndex],
            description: "Book rated during onboarding - added to your reading history",
            pages: 300 + Math.floor(Math.random() * 200), // Random page count 300-500
            publishedYear: 2018 + Math.floor(Math.random() * 6), // Random year 2018-2023
            genre: data.favoriteGenres.slice(0, 2),
            mood: ["Engaging", "Thoughtful"],
            isbn: "",
            rating: 4.0 + Math.random(),
            status: "read" as const,
            dateAdded: new Date().toISOString().split('T')[0],
            currentPage: 300 + Math.floor(Math.random() * 200),
            startedReading: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            finishedReading: new Date().toISOString().split('T')[0],
            userRating: rating.rating,
            userReview: `Rated ${rating.rating} stars during onboarding - this was a great read that helped shape my reading preferences!`,
            reviewDate: new Date().toISOString().split('T')[0]
          };
        });

      // Add books to user library
      ratedBooksToAdd.forEach(book => addUserBook(book));

      // Show success message
      toast.success(`Welcome to BookHaven! ${ratedBooksToAdd.length > 0 ? `${ratedBooksToAdd.length} rated books added to your library!` : 'Your reading journey begins now!'}`);

      // Try to save to API if authenticated (but don't block the flow)
      if (session?.user?.email) {
        console.log("User is authenticated, saving to API in background...");

        const onboardingData = {
          preferences,
          bookRatings: data.bookRatings,
          authorRatings: data.authorRatings,
          completedAt: new Date().toISOString(),
        };

        fetch("/api/user/preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(onboardingData),
        })
          .then((response) => {
            if (response.ok) {
              console.log("Preferences saved to API successfully");
            } else {
              console.error(
                "Failed to save to API, but onboarding is still complete"
              );
            }
          })
          .catch((error) => {
            console.error("API save error:", error);
          });
      }

      console.log("Redirecting to home page...");

      // Redirect immediately
      router.push("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false); // Only set loading to false on error
    }
    // Note: Don't set isLoading to false on success, let the redirect handle it
  };

  const canProceed = () => {
    switch (onboarding.currentStep) {
      case 1:
        return data.favoriteGenres.length >= 3;
      case 2:
        return data.bookRatings.length >= 3 || data.authorRatings.length >= 2; // At least 3 books or 2 authors rated
      case 3:
        return data.readingGoal > 0;
      case 4:
        return data.readingPace !== "";
      case 5:
        return data.interests.length >= 2;
      case 6:
        return data.bookFormats.length >= 1;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (onboarding.currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Image
                src="/logo.png"
                alt="BookHaven"
                width={80}
                height={80}
                className="h-20 w-20 mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What do you love to read?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Select at least 3 genres you enjoy (you can change these later)
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    data.favoriteGenres.includes(genre)
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                  }`}
                >
                  <span className="text-sm font-medium">{genre}</span>
                  {data.favoriteGenres.includes(genre) && (
                    <CheckIcon className="h-4 w-4 mt-1 mx-auto text-primary-500" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-center text-gray-500">
              Selected: {data.favoriteGenres.length}/3+ genres
            </p>
          </div>
        );

      case 2:
        return (
          <BookRatingStep
            selectedGenres={data.favoriteGenres}
            onRatingsChange={handleRatingsChange}
            initialBookRatings={data.bookRatings}
            initialAuthorRatings={data.authorRatings}
          />
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrophyIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Set your reading goal
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                How many books would you like to read this year?
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-500 mb-2">
                  {data.readingGoal}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  books this year
                </p>
              </div>

              <input
                type="range"
                min="1"
                max="100"
                value={data.readingGoal}
                onChange={(e) =>
                  setData((prev) => ({
                    ...prev,
                    readingGoal: parseInt(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>1 book</span>
                <span>50 books</span>
                <span>100+ books</span>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <SparklesIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's your reading pace?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                This helps us recommend the right amount of content
              </p>
            </div>

            <div className="space-y-3">
              {READING_PACES.map((pace) => (
                <button
                  key={pace.value}
                  onClick={() =>
                    setData((prev) => ({ ...prev, readingPace: pace.value }))
                  }
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    data.readingPace === pace.value
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pace.label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pace.description}
                      </div>
                    </div>
                    {data.readingPace === pace.value && (
                      <CheckIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserGroupIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What interests you most?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Select at least 2 activities you'd like to explore
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    data.interests.includes(interest)
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                  }`}
                >
                  <span className="text-sm font-medium">{interest}</span>
                  {data.interests.includes(interest) && (
                    <CheckIcon className="h-4 w-4 mt-1 mx-auto text-primary-500" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-sm text-center text-gray-500">
              Selected: {data.interests.length}/2+ interests
            </p>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <HeartIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How do you like to read?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Select your preferred book formats
              </p>
            </div>

            <div className="space-y-3">
              {BOOK_FORMATS.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleFormatToggle(format.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    data.bookFormats.includes(format.value)
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{format.emoji}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {format.label}
                      </span>
                    </div>
                    {data.bookFormats.includes(format.value) && (
                      <CheckIcon className="h-5 w-5 text-primary-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading while hydrating or checking session
  if (!hasHydrated || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  if (onboarding.hasCompleted || isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated - already handled above

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span>
              Step {onboarding.currentStep} of {totalSteps}
            </span>
            <span>
              {Math.round((onboarding.currentStep / totalSteps) * 100)}%
              complete
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(onboarding.currentStep / totalSteps) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Welcome Message */}
        {onboarding.currentStep === 1 && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome to BookHaven, {session?.user?.name || "Reader"}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Let's personalize your reading experience in just a few steps
            </p>
          </div>
        )}

        {/* Step Content */}
        <div className="card p-8 mb-8">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() =>
              onboarding.setStep(Math.max(1, onboarding.currentStep - 1))
            }
            disabled={onboarding.currentStep === 1}
            className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed() || isLoading}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <span>
                  {onboarding.currentStep === totalSteps
                    ? "Complete Setup"
                    : "Next"}
                </span>
                <ChevronRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
