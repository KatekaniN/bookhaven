interface OnboardingData {
  preferences: {
    genres: string[];
    topics: string[];
    languages: string[];
    readingGoal?: number;
    readingPace?: string;
    bookFormats?: string[];
  };
  bookRatings: any[];
  authorRatings: any[];
  completedAt: string;
}

export const getStoredOnboardingData = (): OnboardingData | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("onboarding_data");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error parsing stored onboarding data:", error);
    localStorage.removeItem("onboarding_data");
    return null;
  }
};

export const clearStoredOnboardingData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("onboarding_data");
};

export const saveOnboardingDataToAPI = async (data: OnboardingData) => {
  try {
    const response = await fetch("/api/user/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save preferences");
    }

    const result = await response.json();
    console.log("Onboarding data saved successfully:", result);

    // Clear localStorage after successful save
    clearStoredOnboardingData();

    return result;
  } catch (error) {
    console.error("Error saving onboarding data to API:", error);
    throw error;
  }
};

export const fetchUserPreferences = async () => {
  try {
    const response = await fetch("/api/user/preferences", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized");
      }
      throw new Error("Failed to fetch preferences");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
};

export const hasCompletedOnboarding = (): boolean => {
  console.warn(
    "hasCompletedOnboarding function is deprecated. Use Zustand store instead."
  );
  return false;
};
