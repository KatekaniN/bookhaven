export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: Date;
  readingGoal?: number;
  booksRead: number;
  followers: number;
  following: number;
  favoriteGenres: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  authors: string[];
  cover: string;
  isbn?: string;
  publishYear?: number;
  publisher?: string;
  pages?: number;
  description?: string;
  rating?: number;
  reviewCount?: number;
  subjects: string[];
  languages: string[];
  openLibraryKey: string;
}

export interface BookList {
  id: string;
  userId: string;
  bookId: string;
  status: "want-to-read" | "currently-reading" | "read";
  rating?: number;
  review?: string;
  startedAt?: Date;
  finishedAt?: Date;
  progress?: number; // percentage for currently reading
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  content: string;
  isShort: boolean; // for micro-reviews
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  mood?: string;
  spoilerWarning: boolean;
}

export interface BookClub {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  ownerId: string;
  members: string[];
  isPrivate: boolean;
  currentBook?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  memberLimit?: number;
}

export interface BookClubReading {
  id: string;
  clubId: string;
  bookId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  discussionThreads: string[];
  progress: { [userId: string]: number };
}

export interface ReadingGoal {
  id: string;
  userId: string;
  year: number;
  target: number;
  current: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  userId: string;
  type: "streak" | "milestone" | "genre" | "social";
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  progress?: number;
  target?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: "follow" | "like" | "comment" | "club-invite" | "reading-reminder";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  relatedId?: string; // ID of the related entity
  relatedType?: string; // Type of the related entity
}

export interface UserPreference {
  id: string;
  userId: string;
  bookId?: string;
  authorName?: string;
  genre?: string;
  preferenceType: "book" | "author" | "genre";
  rating: number; // 1-5 stars
  isLiked: boolean;
  weight: number; // For recommendation algorithm (1-10)
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationProfile {
  id: string;
  userId: string;
  genreWeights: { [genre: string]: number };
  authorWeights: { [author: string]: number };
  bookWeights: { [bookId: string]: number };
  readingPace: string;
  preferredFormats: string[];
  lastUpdated: Date;
}

export interface OnboardingData {
  favoriteGenres: string[];
  readingGoal: number;
  readingPace: string;
  interests: string[];
  favoriteAuthors: string[];
  bookFormats: string[];
  bookRatings: UserPreference[];
  authorRatings: UserPreference[];
}

export interface SearchFilters {
  query?: string;
  author?: string;
  genre?: string;
  publishYear?: {
    min?: number;
    max?: number;
  };
  rating?: {
    min?: number;
    max?: number;
  };
  language?: string;
  availability?: "all" | "in-stock" | "digital";
}

export interface BookSearchResult {
  books: Book[];
  totalCount: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
