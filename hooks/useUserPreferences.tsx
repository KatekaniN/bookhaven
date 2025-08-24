import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export interface UserPreferences {
  genres: string[];
  topics: string[];
  languages: string[];
}

export interface UserRatings {
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
}

export interface UserData {
  preferences: UserPreferences;
  ratings: UserRatings;
  updatedAt?: string;
}

export function useUserPreferences() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences
  const fetchPreferences = async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/user/preferences", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }

      const data = await response.json();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Save user preferences
  const savePreferences = async (
    preferences: UserPreferences,
    bookRatings?: UserRatings["books"],
    authorRatings?: UserRatings["authors"]
  ) => {
    if (!session?.user?.email) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);

      const body = {
        preferences,
        bookRatings: bookRatings || userData?.ratings.books || [],
        authorRatings: authorRatings || userData?.ratings.authors || [],
      };

      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save preferences");
      }

      const result = await response.json();
      setUserData(result.data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Add a book rating
  const addBookRating = async (book: UserRatings["books"][0]) => {
    if (!userData) return;

    const existingBooks = userData.ratings.books.filter(
      (b) => b.id !== book.id
    );
    const updatedBooks = [...existingBooks, book];

    await savePreferences(
      userData.preferences,
      updatedBooks,
      userData.ratings.authors
    );
  };

  // Add an author rating
  const addAuthorRating = async (author: UserRatings["authors"][0]) => {
    if (!userData) return;

    const existingAuthors = userData.ratings.authors.filter(
      (a) => a.id !== author.id
    );
    const updatedAuthors = [...existingAuthors, author];

    await savePreferences(
      userData.preferences,
      userData.ratings.books,
      updatedAuthors
    );
  };

  // Remove a book rating
  const removeBookRating = async (bookId: string) => {
    if (!userData) return;

    const updatedBooks = userData.ratings.books.filter((b) => b.id !== bookId);
    await savePreferences(
      userData.preferences,
      updatedBooks,
      userData.ratings.authors
    );
  };

  // Remove an author rating
  const removeAuthorRating = async (authorId: string) => {
    if (!userData) return;

    const updatedAuthors = userData.ratings.authors.filter(
      (a) => a.id !== authorId
    );
    await savePreferences(
      userData.preferences,
      userData.ratings.books,
      updatedAuthors
    );
  };

  // Fetch preferences when session is available
  useEffect(() => {
    if (session?.user?.email && !userData) {
      fetchPreferences();
    }
  }, [session, userData]);

  return {
    userData,
    loading,
    error,
    savePreferences,
    addBookRating,
    addAuthorRating,
    removeBookRating,
    removeAuthorRating,
    refetch: fetchPreferences,
  };
}

// Hook for getting recommendations
export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchRecommendations = async (limit: number = 20) => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recommendations?limit=${limit}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const result = await response.json();
      setRecommendations(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchRecommendations();
    }
  }, [session]);

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations,
  };
}
