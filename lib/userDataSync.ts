import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  UserBook,
  ReadingGoal,
  UserPreferences,
  BookRating,
  AuthorRating,
} from "@/stores/useAppStore";
import { UserBookClubMembership, UserBuddyReadParticipation } from "@/types";

// User data collection structure in Firestore
export interface FirestoreUserData {
  // Core user info
  email: string;
  displayName?: string;
  photoURL?: string;

  // Onboarding data
  onboardingCompleted: boolean;
  preferences: UserPreferences | null;
  bookRatings: BookRating[];
  authorRatings: AuthorRating[];

  // User library
  userBooks: UserBook[];

  // Reading goals
  readingGoals: ReadingGoal[];

  // Book clubs and buddy reads
  bookClubMemberships: UserBookClubMembership[];
  buddyReadParticipations: UserBuddyReadParticipation[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt: Date;
}

export class UserDataSyncService {
  private static instance: UserDataSyncService;
  private userId: string | null = null;
  private unsubscribeCallbacks: (() => void)[] = [];

  static getInstance(): UserDataSyncService {
    if (!UserDataSyncService.instance) {
      UserDataSyncService.instance = new UserDataSyncService();
    }
    return UserDataSyncService.instance;
  }

  /**
   * Initialize sync for a user using their email as document ID
   */
  async initializeUser(userEmail: string): Promise<void> {
    this.userId = userEmail;

    try {
      // Check if user document exists
      const userRef = doc(db, "users", userEmail);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user document
        const initialData: Partial<FirestoreUserData> = {
          email: userEmail,
          onboardingCompleted: false,
          preferences: null,
          bookRatings: [],
          authorRatings: [],
          userBooks: [],
          readingGoals: [],
          bookClubMemberships: [],
          buddyReadParticipations: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSyncAt: new Date(),
        };

        await setDoc(userRef, initialData);
        console.log(
          "✅ UserDataSync: Created new user document for",
          userEmail
        );
      } else {
        console.log("✅ UserDataSync: User document exists for", userEmail);
      }
    } catch (error) {
      console.error("❌ UserDataSync: Failed to initialize user:", error);
      throw error;
    }
  }

  /**
   * Sync complete user data to cloud
   */
  async syncUserDataToCloud(userData: {
    onboardingCompleted: boolean;
    preferences: UserPreferences | null;
    bookRatings: BookRating[];
    authorRatings: AuthorRating[];
    userBooks: UserBook[];
    readingGoals: ReadingGoal[];
    bookClubMemberships: UserBookClubMembership[];
    buddyReadParticipations: UserBuddyReadParticipation[];
  }): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        onboardingCompleted: userData.onboardingCompleted,
        preferences: userData.preferences,
        bookRatings: userData.bookRatings,
        authorRatings: userData.authorRatings,
        userBooks: userData.userBooks,
        readingGoals: userData.readingGoals,
        bookClubMemberships: userData.bookClubMemberships,
        buddyReadParticipations: userData.buddyReadParticipations,
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: Complete user data synced to cloud");
    } catch (error) {
      console.error("❌ UserDataSync: Failed to sync user data:", error);
      throw error;
    }
  }

  /**
   * Fetch complete user data from cloud
   */
  async fetchUserDataFromCloud(): Promise<Partial<FirestoreUserData> | null> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        console.log("✅ UserDataSync: Fetched user data from cloud");
        return userSnap.data() as FirestoreUserData;
      }

      return null;
    } catch (error) {
      console.error("❌ UserDataSync: Failed to fetch user data:", error);
      throw error;
    }
  }

  /**
   * Sync user books to cloud
   */
  async syncUserBooksToCloud(userBooks: UserBook[]): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        userBooks,
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: User books synced to cloud");
    } catch (error) {
      console.error("❌ UserDataSync: Failed to sync user books:", error);
      throw error;
    }
  }

  /**
   * Add a single book to user's library
   */
  async addBookToLibrary(book: UserBook): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        userBooks: arrayUnion(book),
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: Book added to cloud library");
    } catch (error) {
      console.error("❌ UserDataSync: Failed to add book to library:", error);
      throw error;
    }
  }

  /**
   * Update a book in user's library
   */
  async updateBookInLibrary(
    bookId: string,
    updates: Partial<UserBook>
  ): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      // We need to fetch, update, and replace the entire array
      // This is a limitation of Firestore's array operations
      const userData = await this.fetchUserDataFromCloud();
      if (!userData?.userBooks) return;

      const updatedBooks = userData.userBooks.map((book) =>
        book.id === bookId ? { ...book, ...updates } : book
      );

      await this.syncUserBooksToCloud(updatedBooks);

      console.log("✅ UserDataSync: Book updated in cloud library");
    } catch (error) {
      console.error(
        "❌ UserDataSync: Failed to update book in library:",
        error
      );
      throw error;
    }
  }

  /**
   * Remove a book from user's library
   */
  async removeBookFromLibrary(bookId: string): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userData = await this.fetchUserDataFromCloud();
      if (!userData?.userBooks) return;

      const filteredBooks = userData.userBooks.filter(
        (book) => book.id !== bookId
      );
      await this.syncUserBooksToCloud(filteredBooks);

      console.log("✅ UserDataSync: Book removed from cloud library");
    } catch (error) {
      console.error(
        "❌ UserDataSync: Failed to remove book from library:",
        error
      );
      throw error;
    }
  }

  /**
   * Sync reading goals to cloud
   */
  async syncReadingGoalsToCloud(readingGoals: ReadingGoal[]): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        readingGoals,
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: Reading goals synced to cloud");
    } catch (error) {
      console.error("❌ UserDataSync: Failed to sync reading goals:", error);
      throw error;
    }
  }

  /**
   * Join a book club
   */
  async joinBookClub(
    clubId: string,
    role: "member" | "moderator" | "owner" = "member"
  ): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userData = await this.fetchUserDataFromCloud();
      const memberships = userData?.bookClubMemberships || [];

      // Check if already a member
      const existingMembership = memberships.find((m) => m.clubId === clubId);
      if (existingMembership) {
        console.log("✅ UserDataSync: Already a member of this book club");
        return;
      }

      const newMembership: UserBookClubMembership = {
        clubId,
        joinedAt: new Date(),
        role,
        isActive: true,
      };

      const updatedMemberships = [...memberships, newMembership];
      await this.syncBookClubMembershipsToCloud(updatedMemberships);

      console.log("✅ UserDataSync: Joined book club:", clubId);
    } catch (error) {
      console.error("❌ UserDataSync: Failed to join book club:", error);
      throw error;
    }
  }

  /**
   * Leave a book club
   */
  async leaveBookClub(clubId: string): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userData = await this.fetchUserDataFromCloud();
      const memberships = userData?.bookClubMemberships || [];

      const updatedMemberships = memberships.map((m) =>
        m.clubId === clubId ? { ...m, isActive: false } : m
      );

      await this.syncBookClubMembershipsToCloud(updatedMemberships);

      console.log("✅ UserDataSync: Left book club:", clubId);
    } catch (error) {
      console.error("❌ UserDataSync: Failed to leave book club:", error);
      throw error;
    }
  }

  /**
   * Join a buddy read
   */
  async joinBuddyRead(
    buddyReadId: string,
    role: "participant" | "host" = "participant"
  ): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userData = await this.fetchUserDataFromCloud();
      const participations = userData?.buddyReadParticipations || [];

      // Check if already participating
      const existingParticipation = participations.find(
        (p) => p.buddyReadId === buddyReadId
      );
      if (existingParticipation) {
        console.log(
          "✅ UserDataSync: Already participating in this buddy read"
        );
        return;
      }

      const newParticipation: UserBuddyReadParticipation = {
        buddyReadId,
        joinedAt: new Date(),
        progress: 0,
        isActive: true,
        role,
      };

      const updatedParticipations = [...participations, newParticipation];
      await this.syncBuddyReadParticipationsToCloud(updatedParticipations);

      console.log("✅ UserDataSync: Joined buddy read:", buddyReadId);
    } catch (error) {
      console.error("❌ UserDataSync: Failed to join buddy read:", error);
      throw error;
    }
  }

  /**
   * Leave a buddy read
   */
  async leaveBuddyRead(buddyReadId: string): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userData = await this.fetchUserDataFromCloud();
      const participations = userData?.buddyReadParticipations || [];

      const updatedParticipations = participations.map((p) =>
        p.buddyReadId === buddyReadId ? { ...p, isActive: false } : p
      );

      await this.syncBuddyReadParticipationsToCloud(updatedParticipations);

      console.log("✅ UserDataSync: Left buddy read:", buddyReadId);
    } catch (error) {
      console.error("❌ UserDataSync: Failed to leave buddy read:", error);
      throw error;
    }
  }

  /**
   * Sync book club memberships to cloud
   */
  async syncBookClubMembershipsToCloud(
    memberships: UserBookClubMembership[]
  ): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        bookClubMemberships: memberships,
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: Book club memberships synced to cloud");
    } catch (error) {
      console.error(
        "❌ UserDataSync: Failed to sync book club memberships:",
        error
      );
      throw error;
    }
  }

  /**
   * Sync buddy read participations to cloud
   */
  async syncBuddyReadParticipationsToCloud(
    participations: UserBuddyReadParticipation[]
  ): Promise<void> {
    if (!this.userId) throw new Error("User not initialized");

    try {
      const userRef = doc(db, "users", this.userId);

      await updateDoc(userRef, {
        buddyReadParticipations: participations,
        updatedAt: serverTimestamp(),
        lastSyncAt: serverTimestamp(),
      });

      console.log("✅ UserDataSync: Buddy read participations synced to cloud");
    } catch (error) {
      console.error(
        "❌ UserDataSync: Failed to sync buddy read participations:",
        error
      );
      throw error;
    }
  }

  /**
   * Set up real-time sync listener
   */
  setupRealtimeSync(
    onDataUpdate: (data: Partial<FirestoreUserData>) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.userId) throw new Error("User not initialized");

    const userRef = doc(db, "users", this.userId);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as FirestoreUserData;
          onDataUpdate(data);
          console.log("🔄 UserDataSync: Real-time data update received");
        }
      },
      (error) => {
        console.error("❌ UserDataSync: Real-time sync error:", error);
        if (onError) onError(error);
      }
    );

    this.unsubscribeCallbacks.push(unsubscribe);
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.userId = null;
    console.log("🧹 UserDataSync: Cleaned up subscriptions");
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const userData = await this.fetchUserDataFromCloud();
      return userData?.onboardingCompleted || false;
    } catch (error) {
      console.error(
        "❌ UserDataSync: Failed to check onboarding status:",
        error
      );
      return false;
    }
  }

  /**
   * Merge local and cloud data intelligently
   */
  async mergeLocalAndCloudData(localData: {
    onboardingCompleted: boolean;
    preferences: UserPreferences | null;
    bookRatings: BookRating[];
    authorRatings: AuthorRating[];
    userBooks: UserBook[];
    readingGoals: ReadingGoal[];
    bookClubMemberships?: UserBookClubMembership[];
    buddyReadParticipations?: UserBuddyReadParticipation[];
  }): Promise<
    typeof localData & {
      bookClubMemberships: UserBookClubMembership[];
      buddyReadParticipations: UserBuddyReadParticipation[];
    }
  > {
    try {
      const cloudData = await this.fetchUserDataFromCloud();

      if (!cloudData) {
        // No cloud data, use local data with defaults
        const dataWithDefaults = {
          ...localData,
          bookClubMemberships: localData.bookClubMemberships || [],
          buddyReadParticipations: localData.buddyReadParticipations || [],
        };
        await this.syncUserDataToCloud(dataWithDefaults);
        return dataWithDefaults;
      }

      // Merge strategies for different data types
      const merged = {
        // Onboarding: cloud takes precedence
        onboardingCompleted:
          cloudData.onboardingCompleted || localData.onboardingCompleted,

        // Preferences: cloud takes precedence if exists
        preferences: cloudData.preferences || localData.preferences,

        // Ratings: merge by ID, keep most recent
        bookRatings: this.mergeRatings(
          localData.bookRatings,
          cloudData.bookRatings || []
        ),
        authorRatings: this.mergeRatings(
          localData.authorRatings,
          cloudData.authorRatings || []
        ),

        // Books: merge by ID, keep most recent dateAdded
        userBooks: this.mergeBooks(
          localData.userBooks,
          cloudData.userBooks || []
        ),

        // Goals: merge by year, keep most recent
        readingGoals: this.mergeGoals(
          localData.readingGoals,
          cloudData.readingGoals || []
        ),

        // Book club memberships: merge by clubId, keep most recent
        bookClubMemberships: this.mergeClubMemberships(
          localData.bookClubMemberships || [],
          cloudData.bookClubMemberships || []
        ),

        // Buddy read participations: merge by buddyReadId, keep most recent
        buddyReadParticipations: this.mergeBuddyReadParticipations(
          localData.buddyReadParticipations || [],
          cloudData.buddyReadParticipations || []
        ),
      };

      // Sync merged data back to cloud
      await this.syncUserDataToCloud(merged);

      console.log("✅ UserDataSync: Local and cloud data merged successfully");
      return merged;
    } catch (error) {
      console.error("❌ UserDataSync: Failed to merge data:", error);
      // Return local data with defaults as fallback
      return {
        ...localData,
        bookClubMemberships: localData.bookClubMemberships || [],
        buddyReadParticipations: localData.buddyReadParticipations || [],
      };
    }
  }

  private mergeRatings<T extends { id: string }>(local: T[], cloud: T[]): T[] {
    const merged = new Map<string, T>();

    // Add cloud items first
    cloud.forEach((item) => merged.set(item.id, item));

    // Add local items (will override cloud if same ID)
    local.forEach((item) => merged.set(item.id, item));

    return Array.from(merged.values());
  }

  private mergeBooks(local: UserBook[], cloud: UserBook[]): UserBook[] {
    const merged = new Map<string, UserBook>();

    // Add cloud items first
    cloud.forEach((book) => merged.set(book.id, book));

    // Add local items, keeping most recently added
    local.forEach((localBook) => {
      const cloudBook = merged.get(localBook.id);
      if (
        !cloudBook ||
        new Date(localBook.dateAdded) > new Date(cloudBook.dateAdded)
      ) {
        merged.set(localBook.id, localBook);
      }
    });

    return Array.from(merged.values());
  }

  private mergeGoals(
    local: ReadingGoal[],
    cloud: ReadingGoal[]
  ): ReadingGoal[] {
    const merged = new Map<string, ReadingGoal>();

    // Add cloud items first
    cloud.forEach((goal) => merged.set(goal.id, goal));

    // Add local items (will override cloud if same ID)
    local.forEach((goal) => merged.set(goal.id, goal));

    return Array.from(merged.values());
  }

  private mergeClubMemberships(
    local: UserBookClubMembership[],
    cloud: UserBookClubMembership[]
  ): UserBookClubMembership[] {
    const merged = new Map<string, UserBookClubMembership>();

    // Add cloud items first
    cloud.forEach((membership) => merged.set(membership.clubId, membership));

    // Add local items, keeping most recently joined
    local.forEach((localMembership) => {
      const cloudMembership = merged.get(localMembership.clubId);
      if (
        !cloudMembership ||
        new Date(localMembership.joinedAt) > new Date(cloudMembership.joinedAt)
      ) {
        merged.set(localMembership.clubId, localMembership);
      }
    });

    return Array.from(merged.values());
  }

  private mergeBuddyReadParticipations(
    local: UserBuddyReadParticipation[],
    cloud: UserBuddyReadParticipation[]
  ): UserBuddyReadParticipation[] {
    const merged = new Map<string, UserBuddyReadParticipation>();

    // Add cloud items first
    cloud.forEach((participation) =>
      merged.set(participation.buddyReadId, participation)
    );

    // Add local items, keeping most recently joined
    local.forEach((localParticipation) => {
      const cloudParticipation = merged.get(localParticipation.buddyReadId);
      if (
        !cloudParticipation ||
        new Date(localParticipation.joinedAt) >
          new Date(cloudParticipation.joinedAt)
      ) {
        merged.set(localParticipation.buddyReadId, localParticipation);
      }
    });

    return Array.from(merged.values());
  }
}

// Export singleton instance
export const userDataSync = UserDataSyncService.getInstance();
