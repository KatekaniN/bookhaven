// Shared in-memory store for user preferences
// In a real app, this would be replaced with database operations
import fs from "fs";
import path from "path";

export interface UserData {
  preferences: {
    genres: string[];
    topics: string[];
    languages: string[];
    readingGoal?: string;
    readingPace?: string;
    bookFormats?: string[];
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
  completedAt?: string;
  updatedAt: string;
}

// Shared in-memory store (singleton across module reloads)
const globalForUserStore = globalThis as unknown as {
  __bookhaven_userPreferencesStore?: Map<string, UserData>;
};

const userPreferencesStore: Map<string, UserData> | undefined =
  globalForUserStore.__bookhaven_userPreferencesStore;

if (!userPreferencesStore) {
  globalForUserStore.__bookhaven_userPreferencesStore = new Map<
    string,
    UserData
  >();
}

const store = globalForUserStore.__bookhaven_userPreferencesStore as Map<
  string,
  UserData
>;

// Lightweight file persistence so data survives dev server restarts
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-preferences.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn("Failed to create data directory:", e);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const json = JSON.parse(raw) as Record<string, UserData>;
      Object.entries(json).forEach(([email, data]) => {
        store.set(email, data);
      });
      console.log("UserDataStore: loaded", store.size, "users from disk");
    }
  } catch (e) {
    console.warn("UserDataStore: failed to load from disk:", e);
  }
}

let saveTimer: NodeJS.Timeout | null = null;
function saveToDiskDebounced() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      ensureDataDir();
      const obj: Record<string, UserData> = {};
      store.forEach((data, email) => {
        obj[email] = data;
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf-8");
      console.log("UserDataStore: persisted", store.size, "users to disk");
    } catch (e) {
      console.warn("UserDataStore: failed to save to disk:", e);
    }
  }, 250);
}

// Load once on module import
loadFromDisk();

export const UserDataStore = {
  // Get user data
  get(userEmail: string): UserData | null {
    return store.get(userEmail) || null;
  },

  // Save user data
  set(userEmail: string, userData: UserData): void {
    store.set(userEmail, userData);
    saveToDiskDebounced();
  },

  // Check if user has completed onboarding
  hasCompletedOnboarding(userEmail: string): boolean {
    const userData = store.get(userEmail);
    return !!userData?.preferences?.genres?.length;
  },

  // Clear user data
  delete(userEmail: string): boolean {
    const res = store.delete(userEmail);
    if (res) saveToDiskDebounced();
    return res;
  },

  // Get all users (for debugging)
  getAllUsers(): string[] {
    return Array.from(store.keys());
  },
};
