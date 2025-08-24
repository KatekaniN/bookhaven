"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  StarIcon,
  HeartIcon,
  PencilIcon,
  BookOpenIcon,
  UserIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { PersonalizedRecommendations } from "../../components/home/PersonalizedRecommendations";
import toast from "react-hot-toast";

interface UserData {
  preferences: {
    genres: string[];
    topics: string[];
    languages: string[];
  };
  ratings: {
    books: Array<{
      id: string;
      title: string;
      author: string;
      rating: number;
      cover?: string;
    }>;
    authors: Array<{
      id: string;
      name: string;
      rating: number;
    }>;
  };
  updatedAt?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "preferences" | "ratings"
  >("overview");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/preferences");

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: UserData["preferences"]) => {
    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preferences: newPreferences,
          bookRatings: userData?.ratings.books || [],
          authorRatings: userData?.ratings.authors || [],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      const result = await response.json();
      setUserData(result.data);
      toast.success("Preferences updated successfully!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.user.name || session.user.email}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {session.user.email}
              </p>
              {userData?.updatedAt && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Profile updated:{" "}
                  {new Date(userData.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <BookOpenIcon className="w-5 h-5 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("preferences")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "preferences"
                    ? "border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <Cog6ToothIcon className="w-5 h-5 inline mr-2" />
                Preferences
              </button>
              <button
                onClick={() => setActiveTab("ratings")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "ratings"
                    ? "border-purple-500 text-purple-600 dark:text-purple-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <StarIcon className="w-5 h-5 inline mr-2" />
                My Ratings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && userData && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                    <div className="flex items-center">
                      <StarSolidIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      <div className="ml-3">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {userData.ratings.books.length}
                        </p>
                        <p className="text-purple-800 dark:text-purple-200">
                          Books Rated
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900 rounded-lg p-4">
                    <div className="flex items-center">
                      <HeartSolidIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
                      <div className="ml-3">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {userData.ratings.authors.length}
                        </p>
                        <p className="text-red-800 dark:text-red-200">
                          Authors Liked
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                    <div className="flex items-center">
                      <BookOpenIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className="ml-3">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {userData.preferences.genres.length}
                        </p>
                        <p className="text-blue-800 dark:text-blue-200">
                          Favorite Genres
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Your Favorite Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.preferences.genres.map((genre) => (
                      <span
                        key={genre}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>

                <PersonalizedRecommendations limit={4} />
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && userData && (
              <PreferencesEditor
                preferences={userData.preferences}
                onUpdate={updatePreferences}
              />
            )}

            {/* Ratings Tab */}
            {activeTab === "ratings" && userData && (
              <RatingsDisplay ratings={userData.ratings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Preferences Editor Component
function PreferencesEditor({
  preferences,
  onUpdate,
}: {
  preferences: UserData["preferences"];
  onUpdate: (preferences: UserData["preferences"]) => void;
}) {
  const [editedPreferences, setEditedPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  const availableGenres = [
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

  const availableTopics = [
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

  useEffect(() => {
    const changed =
      JSON.stringify(editedPreferences) !== JSON.stringify(preferences);
    setHasChanges(changed);
  }, [editedPreferences, preferences]);

  const toggleGenre = (genre: string) => {
    const newGenres = editedPreferences.genres.includes(genre)
      ? editedPreferences.genres.filter((g) => g !== genre)
      : [...editedPreferences.genres, genre];

    setEditedPreferences({
      ...editedPreferences,
      genres: newGenres,
    });
  };

  const toggleTopic = (topic: string) => {
    const newTopics = editedPreferences.topics.includes(topic)
      ? editedPreferences.topics.filter((t) => t !== topic)
      : [...editedPreferences.topics, topic];

    setEditedPreferences({
      ...editedPreferences,
      topics: newTopics,
    });
  };

  const handleSave = () => {
    onUpdate(editedPreferences);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Favorite Genres
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                editedPreferences.genres.includes(genre)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interests
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableTopics.map((topic) => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                editedPreferences.topics.includes(topic)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            You have unsaved changes
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setEditedPreferences(preferences);
                setHasChanges(false);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Ratings Display Component
function RatingsDisplay({ ratings }: { ratings: UserData["ratings"] }) {
  const [activeRatingTab, setActiveRatingTab] = useState<"books" | "authors">(
    "books"
  );

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveRatingTab("books")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeRatingTab === "books"
              ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Books ({ratings.books.length})
        </button>
        <button
          onClick={() => setActiveRatingTab("authors")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeRatingTab === "authors"
              ? "border-b-2 border-purple-500 text-purple-600 dark:text-purple-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          Authors ({ratings.authors.length})
        </button>
      </div>

      {activeRatingTab === "books" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratings.books.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
              No book ratings yet. Complete the onboarding to rate books!
            </p>
          ) : (
            ratings.books.map((book) => (
              <div
                key={book.id}
                className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                {book.cover && (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {book.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {book.author}
                  </p>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= book.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {book.rating}/5
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeRatingTab === "authors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ratings.authors.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 col-span-full text-center py-8">
              No author ratings yet. Complete the onboarding to rate authors!
            </p>
          ) : (
            ratings.authors.map((author) => (
              <div
                key={author.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {author.name}
                  </h4>
                  <div className="flex items-center mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarSolidIcon
                        key={star}
                        className={`w-4 h-4 ${
                          star <= author.rating
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {author.rating}/5
                    </span>
                  </div>
                </div>
                <HeartSolidIcon className="w-6 h-6 text-red-500" />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
