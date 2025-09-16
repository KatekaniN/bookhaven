"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { userDataSync } from "../../lib/userDataSync";
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  BookOpenIcon,
  HeartIcon,
  StarIcon,
  ClockIcon,
  UsersIcon,
  FireIcon,
  SparklesIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  TagIcon,
  LockClosedIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon,
} from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

interface BookClub {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  memberCount: number;
  currentBook?: {
    title: string;
    author: string;
    cover: string;
    progress: number;
  };
  isPublic: boolean;
  category: string;
  createdBy: string;
  createdAt: string;
  nextMeeting?: string;
  tags: string[];
  isJoined: boolean;
  activity: "high" | "medium" | "low";
  // local-only: whether this is a curated demo club (not persisted in Firestore)
  isDemo?: boolean;
}

interface BuddyRead {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  startDate: string;
  targetEndDate: string;
  progress: number;
  isJoined: boolean;
  maxParticipants: number;
  description: string;
}

interface ClubFormData {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  tags: string[];
  coverImage?: string;
  currentBook?: {
    title: string;
    author: string;
    cover: string;
  };
}

interface BuddyReadFormData {
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  description: string;
  maxParticipants: number;
  targetEndDate: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
  isCurrentUser: boolean;
}

export default function BookClubsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "clubs" | "buddy-reads" | "my-clubs"
  >("clubs");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bookClubs, setBookClubs] = useState<BookClub[]>([]);
  const [buddyReads, setBuddyReads] = useState<BuddyRead[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"club" | "buddy-read">("club");
  const [selectedClub, setSelectedClub] = useState<BookClub | null>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);

  // Define loadData before useEffect to avoid TDZ issues
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch book clubs from API (this will include both curated and user-created clubs)
      // Fetch book clubs from API, falling back to curated demo clubs when empty
      const response = await fetch("/api/book-clubs");
      let apiClubs: any[] = [];
      let hasApiData = false;

      if (response.ok) {
        const data = await response.json();
        apiClubs = data.bookClubs || [];
        hasApiData = apiClubs.length > 0;
      } else {
        console.warn(
          "Failed to fetch book clubs from API, using fallback data"
        );
      }

  // No local demo fallback: if no API data, show empty state in UI

      // Map clubs and compute membership accurately
      // Map clubs and compute membership accurately only when real API data exists
  if (hasApiData) {
        const userEmail = session?.user?.email;
        let cloudMembershipIds: string[] = [];
        if (userEmail) {
          try {
            await userDataSync.initializeUser(userEmail);
            const userData = await userDataSync.fetchUserDataFromCloud();
            cloudMembershipIds = (userData?.bookClubMemberships || [])
              .filter((m: any) => m?.isActive !== false)
              .map((m: any) => m.clubId);
          } catch (e) {
            console.warn("Failed to fetch cloud memberships, continuing:", e);
          }
        }

        const mapped = apiClubs.map((club: any) => {
          const memberCount = Array.isArray(club.members)
            ? club.members.length
            : typeof (club as any).memberCount === "number"
            ? (club as any).memberCount
            : 0;
          const isOwner =
            userEmail &&
            (club.ownerId === userEmail || club.createdBy === userEmail);
          const isMemberList =
            userEmail &&
            Array.isArray(club.members) &&
            club.members.includes(userEmail);
          const isInCloud = cloudMembershipIds.includes(club.id);
          const isJoined = Boolean(isOwner || isMemberList || isInCloud);
          const activity: "high" | "medium" | "low" =
            memberCount > 500 ? "high" : memberCount > 200 ? "medium" : "low";

          return {
            id: club.id,
            name: club.name,
            description: club.description || "",
            coverImage: club.coverImage,
            memberCount,
            currentBook:
              typeof club.currentBook === "object"
                ? club.currentBook
                : undefined,
            isPublic:
              club.isPrivate !== undefined
                ? !club.isPrivate
                : Boolean(club.isPublic ?? true),
            category: club.category || "General",
            createdBy: club.ownerId || club.createdBy || "",
            createdAt: club.createdAt?.toString?.() || new Date().toISOString(),
            nextMeeting: club.nextMeeting,
            tags: Array.isArray(club.tags) ? club.tags : [],
            isJoined,
            activity,
            isDemo: false,
          } as BookClub;
        });

        setBookClubs(mapped);
      } else {
        setBookClubs([]);
      }

      // Fetch buddy reads from API (Firestore-backed)
      try {
        const brRes = await fetch("/api/buddy-reads?status=active&limit=30");
        if (brRes.ok) {
          const data = await brRes.json();
          const brs: any[] = data.buddyReads || [];
          const userEmail = session?.user?.email;
          const mappedBR: BuddyRead[] = brs.map((br: any) => {
            const isJoined = Boolean(
              userEmail &&
                Array.isArray(br.participants) &&
                br.participants.some((p: any) => p.id === userEmail)
            );
            const my = Array.isArray(br.participants)
              ? br.participants.find((p: any) => p.id === userEmail)
              : null;
            const progress = typeof my?.progress === "number" ? my.progress : 0;
            return {
              id: br.id,
              bookTitle: br.bookTitle,
              bookAuthor: br.bookAuthor,
              bookCover: br.bookCover,
              participants: (br.participants || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
              })),
              startDate: br.startDate?.toString?.() || new Date().toISOString(),
              targetEndDate:
                br.targetEndDate?.toString?.() || new Date().toISOString(),
              progress,
              isJoined,
              maxParticipants: br.maxParticipants || 6,
              description: br.description || "",
            } as BuddyRead;
          });
          setBuddyReads(mappedBR);
        } else {
          setBuddyReads([]);
        }
      } catch (e) {
        console.warn("Failed to fetch buddy reads:", e);
        setBuddyReads([]);
      }
    } catch (error) {
      console.error("Error loading book clubs data:", error);
      toast.error("Failed to load book clubs");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      const t = setTimeout(() => router.push("/auth/signin"), 150);
      return () => clearTimeout(t);
    }

    if (status === "authenticated") {
      loadData();
    }

    // Check if user has seen the tutorial before
    const tutorialSeen = localStorage.getItem("bookClubsTutorialSeen");
    if (!tutorialSeen) {
      setTimeout(() => {
        setShowTutorial(true);
      }, 1500); // Show tutorial after page loads
    } else {
      setHasSeenTutorial(true);
    }
  }, [session, status, router, loadData]);


  const handleJoinClub = async (clubId: string) => {
    try {
      const res = await fetch(`/api/book-clubs/${clubId}`, { method: "POST" });
      if (!res.ok) {
        const { error } = await res
          .json()
          .catch(() => ({ error: "Failed to join" }));
        throw new Error(error || "Failed to join club");
      }

      setBookClubs((clubs) =>
        clubs.map((club) =>
          club.id === clubId
            ? {
                ...club,
                isJoined: true,
                memberCount: (club.memberCount || 0) + 1,
              }
            : club
        )
      );
      toast.success("Joined book club!");
    } catch (e: any) {
      console.error("Join club failed:", e);
      toast.error(e?.message || "Failed to join book club");
    }
  };

  const handleJoinBuddyRead = (buddyReadId: string) => {
    (async () => {
      try {
        const res = await fetch(`/api/buddy-reads/${buddyReadId}`, {
          method: "POST",
        });
        if (!res.ok) {
          const { error } = await res
            .json()
            .catch(() => ({ error: "Failed to join" }));
          throw new Error(error || "Failed to join buddy read");
        }
        const me = {
          id: session?.user?.email || "current-user",
          name: session?.user?.name || "You",
          avatar: session?.user?.image || undefined,
        };
        setBuddyReads((reads) =>
          reads.map((read) =>
            read.id === buddyReadId
              ? {
                  ...read,
                  isJoined: true,
                  participants: [...read.participants, me],
                }
              : read
          )
        );
        toast.success("Joined buddy read!");
      } catch (e: any) {
        console.error("Join buddy read failed:", e);
        toast.error(e?.message || "Failed to join buddy read");
      }
    })();
  };

  const handleCreateClub = async (formData: ClubFormData) => {
    try {
      const response = await fetch("/api/book-clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          isPublic: formData.isPublic,
          tags: formData.tags,
          coverImage: formData.coverImage,
          currentBook: formData.currentBook,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create book club");
      }

      const newClub = await response.json();

      // Normalize to UI shape
      const userEmail = session?.user?.email || "";
      const localClub: BookClub = {
        id: newClub.id,
        name: newClub.name,
        description: newClub.description || "",
        coverImage: newClub.coverImage,
        memberCount: Array.isArray(newClub.members)
          ? newClub.members.length
          : 1,
        currentBook:
          typeof newClub.currentBook === "object"
            ? newClub.currentBook
            : undefined,
        isPublic:
          newClub.isPrivate !== undefined
            ? !newClub.isPrivate
            : Boolean(formData.isPublic),
        category: formData.category,
        createdBy: newClub.ownerId || userEmail,
        createdAt: new Date().toISOString(),
        nextMeeting: undefined,
        tags: Array.isArray(newClub.tags) ? newClub.tags : formData.tags,
        isJoined: true,
        activity: "low",
      };

      // Add to local state
      setBookClubs((clubs) => [localClub, ...clubs]);
      // Ensure membership exists in cloud for reload visibility
      try {
        await fetch(`/api/book-clubs/${newClub.id}`, { method: "POST" });
      } catch {}
      setShowCreateModal(false);
      toast.success("Book club created successfully!");
    } catch (error) {
      console.error("Error creating book club:", error);
      toast.error("Failed to create book club. Please try again.");
    }
  };

  const handleCreateBuddyRead = (formData: BuddyReadFormData) => {
    (async () => {
      try {
        const response = await fetch("/api/buddy-reads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookTitle: formData.bookTitle,
            bookAuthor: formData.bookAuthor,
            bookCover: formData.bookCover,
            description: formData.description,
            targetEndDate: formData.targetEndDate,
            maxParticipants: formData.maxParticipants,
            isPrivate: false,
            tags: [],
          }),
        });
        if (!response.ok) {
          const { error } = await response
            .json()
            .catch(() => ({ error: "Failed to create buddy read" }));
          throw new Error(error || "Failed to create buddy read");
        }
        const created = await response.json();
        const me = {
          id: session?.user?.email || "current-user",
          name: session?.user?.name || "You",
          avatar: session?.user?.image || undefined,
        };
        const newBuddyRead: BuddyRead = {
          id: created.id,
          bookTitle: created.bookTitle,
          bookAuthor: created.bookAuthor,
          bookCover: created.bookCover,
          description: created.description || formData.description,
          maxParticipants: created.maxParticipants || formData.maxParticipants,
          targetEndDate:
            created.targetEndDate?.toString?.() || formData.targetEndDate,
          startDate: new Date().toISOString(),
          progress: 0,
          isJoined: true,
          participants: [me],
        };
        setBuddyReads((reads) => [newBuddyRead, ...reads]);
        setShowCreateModal(false);
        toast.success("Buddy read started successfully!");
      } catch (error: any) {
        console.error("Error creating buddy read:", error);
        toast.error(error?.message || "Failed to create buddy read");
      }
    })();
  };

  const handleViewClub = (club: BookClub) => {
    setSelectedClub(club);
    setShowDiscussion(true);
  };

  const categories = [
    "all",
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Historical Fiction",
    "Literary Fiction",
  ];

  // Tutorial functions
  const tutorialSteps = [
    {
      title: "Welcome to Book Clubs!",
      description:
        "This is where you'll find reading communities to join discussions, share thoughts, and discover new books with fellow readers.",
      target: "clubs-tab",
      position: "bottom" as const,
    },
    {
      title: "Explore Book Clubs",
      description:
        "Below you'll see a sample book club. Each club shows the current book, reading progress, member count, and activity level. Try exploring!",
      target: "clubs-content",
      position: "top" as const,
    },
    {
      title: "Join Discussions",
      description:
        "Click 'View Discussion' on the demo club below to see how club conversations work. You can share thoughts, ask questions, and connect with other readers.",
      target: "clubs-content",
      position: "top" as const,
    },
    {
      title: "Try Buddy Reads",
      description:
        "Switch to Buddy Reads to see smaller, time-limited reading groups. Perfect for reading a specific book with a few close reading partners.",
      target: "buddy-reads-tab",
      position: "bottom" as const,
    },
    {
      title: "Search & Filter",
      description:
        "Use these tools to find clubs that match your interests. Filter by genre or search for specific topics, authors, or book titles.",
      target: "search-section",
      position: "bottom" as const,
    },
    {
      title: "Create Your Own",
      description:
        "Ready to start your own community? Click here to create a book club or start a buddy read around books you're excited about.",
      target: "create-button",
      position: "bottom" as const,
    },
    {
      title: "Track Your Communities",
      description:
        "Once you join clubs, visit 'My Clubs' to manage your memberships and see your reading progress across different communities.",
      target: "my-clubs-tab",
      position: "bottom" as const,
    },
    {
      title: "You're All Set! 🎉",
      description:
        "The sample content will now disappear, and you can start building your real reading community. Happy reading and discussing!",
      target: "clubs-tab",
      position: "bottom" as const,
    },
  ];

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      closeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(tutorialStep - 1);
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    localStorage.setItem("bookClubsTutorialSeen", "true");
    // Reload data to remove sample content
    loadData();
  };

  const restartTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const filteredClubs = bookClubs.filter((club) => {
    const matchesSearch =
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "all" || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const myClubs = bookClubs.filter((club) => club.isJoined);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Magical background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-40 dark:opacity-25"
            style={{
              backgroundImage: "url(/library/textures/background-texture.png)",
              backgroundSize: "512px 512px",
              backgroundRepeat: "repeat",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 via-secondary-50/40 to-accent-100/30 dark:from-primary-900/20 dark:via-secondary-800/30 dark:to-accent-900/20"></div>
        </div>

        <div className="relative text-center">
          <div className="relative mb-6">
            {/* Enhanced loading with magical assets */}
            <div className="w-32 h-32 relative mx-auto">
              {/* Main loading book */}
              <img
                src="/home/loading-book.png"
                alt="Loading..."
                className="w-full h-full object-contain animate-pulse"
              />
              {/* Loading portal background */}
              <div className="absolute inset-0 -z-10">
                <img
                  src="/home/loading-portal.png"
                  alt=""
                  className="w-full h-full object-contain opacity-40 animate-spin"
                  style={{ animationDuration: "4s" }}
                />
              </div>
              {/* Magical glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-300/20 to-secondary-300/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 font-serif text-lg">
            Gathering magical reading circles...
          </p>
          <div className="flex justify-center mt-2">
            <img
              src="/library/decorations/divider-4.png"
              alt=""
              className="h-4 opacity-30 animate-pulse"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* General Magical Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* General magical texture overlay */}
        <div
          className="absolute inset-0 opacity-20 dark:opacity-15"
          style={{
            backgroundImage: "url(/library/textures/background-texture.png)",
            backgroundSize: "512px 512px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-secondary-400 rounded-full opacity-80 animate-float shadow-lg"></div>
        <div
          className="absolute top-40 right-20 w-2 h-2 bg-primary-400 rounded-full opacity-70 animate-float shadow-lg"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 left-20 w-2.5 h-2.5 bg-accent-400 rounded-full opacity-75 animate-float shadow-lg"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-10 w-3 h-3 bg-secondary-300 rounded-full opacity-60 animate-float shadow-lg"
          style={{ animationDelay: "0.5s" }}
        ></div>

        {/* Light rays */}
        <div className="absolute top-0 left-1/4 w-px h-64 bg-gradient-to-b from-secondary-300/40 to-transparent transform rotate-12"></div>
        <div className="absolute top-0 right-1/3 w-px h-48 bg-gradient-to-b from-primary-300/35 to-transparent transform -rotate-6"></div>
      </div>

      <div className="relative z-10 w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Magical Header */}
        <div className="text-center mb-16 relative">
          {/* Hero-specific magical overlay as base */}
          <div className="absolute inset-0 -inset-x-16 -inset-y-12 bg-gradient-to-br from-primary-50/40 via-secondary-50/30 to-accent-50/40 dark:from-primary-900/30 dark:via-secondary-800/40 dark:to-accent-900/30 rounded-3xl"></div>

          {/* Hero Background Image - Applied specifically to hero section */}
          <div
            className="absolute inset-0 -inset-x-16 -inset-y-12 opacity-60 dark:opacity-40 rounded-3xl"
            style={{
              backgroundImage: "url(/bookclub/bc-hero.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              mixBlendMode: "multiply",
            }}
          />

          {/* Text readability overlay */}
          <div className="absolute inset-0 -inset-x-16 -inset-y-12 bg-white/20 dark:bg-black/20 rounded-3xl"></div>

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
              <div className="relative bg-gradient-to-br backdrop-blur-sm rounded-full border-1 border-secondary-300 shadow-xl overflow-hidden">
                <Image
                  src="/bookclub/hero.png"
                  alt="Book Club"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <SparklesIcon className="h-6 w-6 text-secondary-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="relative">
            <h1 className="text-6xl font-serif font-bold bg-gradient-to-r from-primary-600 via-secondary-400 to-accent-400 bg-clip-text text-transparent mb-6 relative">
              Magical Book Clubs
              {/* Decorative underline using divider */}
              <div
                className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-4 bg-contain bg-center bg-no-repeat opacity-60"
                style={{
                  backgroundImage: "url(/library/decorations/divider-1.png)",
                }}
              />
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed font-serif italic">
              &ldquo;Join enchanted reading circles where stories come alive and
              friendships are forged through the magic of shared tales. Every
              book is an adventure, every discussion a new discovery.&rdquo;
            </p>
          </div>

          {hasSeenTutorial && (
            <div className="mt-8">
              <button
                onClick={restartTutorial}
                className="flex items-center gap-2 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors border border-primary-200 dark:border-primary-700 shadow-lg backdrop-blur-sm"
              >
                <SparklesIcon className="h-4 w-4" />
                Tutorial Magic
              </button>
            </div>
          )}
        </div>
        {/* Magical Tab Navigation */}
        <div className="mb-12 relative">
          {/* Magical shelf background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 via-white/50 to-secondary-50/30 dark:from-gray-800/30 dark:via-gray-700/50 dark:to-gray-800/30 rounded-3xl transform -rotate-1"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-accent-50/20 via-transparent to-primary-50/20 dark:from-gray-700/20 dark:to-gray-800/20 rounded-3xl transform rotate-1"></div>

          <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border-2 border-primary-100 dark:border-primary-800 shadow-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 mr-3 text-primary-500" />
                Choose Your Reading Adventure
                <BookOpenIcon className="h-6 w-6 ml-3 text-primary-500 scale-x-[-1]" />
              </h3>
              <div className="w-32 h-1 bg-gradient-to-r from-secondary-400 to-primary-400 mx-auto rounded-full"></div>
            </div>

            <div className="flex gap-2 mb-6 justify-center">
              {[
                {
                  key: "clubs" as const,
                  label: "All Clubs",
                  icon: UserGroupIcon,
                  description: "Join vibrant reading communities",
                },
                {
                  key: "buddy-reads" as const,
                  label: "My Buddy Reads",
                  icon: HeartIcon,
                  description: "Your reading partnerships",
                },
                {
                  key: "my-clubs" as const,
                  label: "My Clubs",
                  icon: BookOpenIcon,
                  description: "Your reading circles",
                },
              ].map(({ key, label, icon: Icon, description }) => (
                <div key={key} className="relative group">
                  <button
                    id={`${key}-tab`}
                    onClick={() => setActiveTab(key)}
                    className={`relative flex flex-col items-center gap-2 px-6 py-4 rounded-xl transition-all duration-300 transform group-hover:scale-105 ${
                      activeTab === key
                        ? "bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-200/50 dark:shadow-primary-800/50 scale-105"
                        : "bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg"
                    } backdrop-blur-sm border border-white/20 dark:border-gray-700/20`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="font-serif font-medium text-sm">
                      {label}
                    </span>
                    <span
                      className={`text-xs ${
                        activeTab === key
                          ? "text-white/80"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {description}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {/* Search and Filter Section */}
            {activeTab === "clubs" && (
              <div id="search-section" className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <div className="relative flex-1 max-w-md">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search magical book clubs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-primary-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm shadow-lg font-serif"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-primary-200/50 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm shadow-lg font-serif"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Magical Realms" : category}
                      </option>
                    ))}
                  </select>
                  <button
                    id="create-button"
                    onClick={() => {
                      setCreateType("club");
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 font-serif font-medium"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Create Magical Club
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons for other tabs */}
            {activeTab === "buddy-reads" && (
              <div className="text-center">
                <button
                  id="create-button"
                  onClick={() => {
                    setCreateType("buddy-read");
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 font-serif font-medium"
                >
                  <HeartIcon className="h-5 w-5" />
                  Find Reading Partner
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Content */}
        {activeTab === "clubs" && (
          <div>
            {/* Book Clubs Section */}
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <UserGroupIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                  Book Clubs
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-primary-300 to-transparent"></div>
              </div>
              <div
                id="clubs-content"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredClubs.length > 0 ? (
                  filteredClubs.map((club) => (
                    <BookClubCard
                      key={club.id}
                      club={club}
                      onJoin={() => handleJoinClub(club.id)}
                      onView={() => handleViewClub(club)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Book Clubs Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Be the first to create a book club!
                    </p>
                    <button
                      onClick={() => {
                        setCreateType("club");
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create Club
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Buddy Reads Section */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <HeartIcon className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                  Buddy Reads
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-accent-300 to-transparent"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buddyReads.length > 0 ? (
                  buddyReads.map((buddyRead) => (
                    <BuddyReadCard
                      key={buddyRead.id}
                      buddyRead={buddyRead}
                      onJoin={() => handleJoinBuddyRead(buddyRead.id)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Buddy Reads Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start intimate reading partnerships!
                    </p>
                    <button
                      onClick={() => {
                        setCreateType("buddy-read");
                        setShowCreateModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors text-sm"
                    >
                      <HeartIcon className="h-4 w-4" />
                      Start Buddy Read
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}{" "}
        {activeTab === "buddy-reads" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buddyReads.filter((br) => br.isJoined).length > 0 ? (
              buddyReads
                .filter((br) => br.isJoined)
                .map((buddyRead) => (
                  <BuddyReadCard
                    key={buddyRead.id}
                    buddyRead={buddyRead}
                    onJoin={() => handleJoinBuddyRead(buddyRead.id)}
                  />
                ))
            ) : (
              <div className="col-span-full text-center py-12">
                <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Active Buddy Reads
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven&apos;t joined any buddy reads yet. Find reading partners
                  in the &quot;All Clubs&quot; section or start your own!
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setActiveTab("clubs")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <UserGroupIcon className="h-5 w-5" />
                    Browse All Clubs
                  </button>
                  <button
                    onClick={() => {
                      setCreateType("buddy-read");
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
                  >
                    <HeartIcon className="h-5 w-5" />
                    Start Buddy Read
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "my-clubs" && (
          <div>
            {myClubs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClubs.map((club) => (
                  <BookClubCard
                    key={club.id}
                    club={club}
                    onJoin={() => {}}
                    onView={() => handleViewClub(club)}
                    showManagement={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Clubs Joined Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Join some book clubs to start connecting with fellow readers!
                </p>
                <button
                  onClick={() => setActiveTab("clubs")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Browse Clubs
                </button>
              </div>
            )}
          </div>
        )}
        {/* Create Modal */}
        {showCreateModal && (
          <CreateModal
            type={createType}
            onClose={() => setShowCreateModal(false)}
            onCreateClub={handleCreateClub}
            onCreateBuddyRead={handleCreateBuddyRead}
          />
        )}
        {/* Club Discussion View */}
        {showDiscussion && selectedClub && (
          <ClubDiscussionView
            club={selectedClub}
            onClose={() => {
              setShowDiscussion(false);
              setSelectedClub(null);
            }}
          />
        )}
        {/* Tutorial Overlay */}
        {showTutorial && (
          <TutorialOverlay
            show={showTutorial}
            currentStep={tutorialStep}
            onNext={nextTutorialStep}
            onPrev={prevTutorialStep}
            onClose={closeTutorial}
            steps={tutorialSteps}
          />
        )}
      </div>
    </div>
  );
}

// Book Club Card Component
interface BookClubCardProps {
  club: BookClub;
  onJoin: () => void | Promise<void>;
  onView?: () => void;
  showManagement?: boolean;
}

function BookClubCard({
  club,
  onJoin,
  onView,
  showManagement = false,
}: BookClubCardProps) {
  const getActivityColor = (activity: string) => {
    switch (activity) {
      case "high":
        return "text-green-600 bg-green-100 dark:bg-green-900/30";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
      case "low":
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case "high":
        return <FireIcon className="h-3 w-3" />;
      case "medium":
        return <ClockIcon className="h-3 w-3" />;
      case "low":
        return <EyeIcon className="h-3 w-3" />;
      default:
        return <ClockIcon className="h-3 w-3" />;
    }
  };

  return (
    <div className="group relative animate-fade-in transform transition-all duration-300 hover:scale-105">
      {/* Floating effect shadow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-100/20 to-secondary-100/20 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl transform translate-y-2 group-hover:translate-y-1 transition-transform duration-300 blur-sm"></div>

      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-primary-100 dark:border-primary-800">
        {/* Magical corner elements */}
        <div
          className="absolute top-0 left-0 w-8 h-8 bg-contain bg-no-repeat opacity-20 group-hover:opacity-40 transition-opacity z-10"
          style={{
            backgroundImage: "url(/library/decorations/corner-1.png)",
          }}
        />
        <div
          className="absolute top-0 right-0 w-8 h-8 bg-contain bg-no-repeat opacity-20 group-hover:opacity-40 transition-opacity transform scale-x-[-1] z-10"
          style={{
            backgroundImage: "url(/library/decorations/corner-2.png)",
          }}
        />

        {/* Club Cover Image */}
        {club.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={club.coverImage}
              alt={club.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-serif font-bold text-xl drop-shadow-lg">
                {club.name}
              </h3>
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-lg bg-white/90 ${getActivityColor(
                  club.activity
                )} mt-2`}
              >
                {getActivityIcon(club.activity)}
                {club.activity}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6 pb-4">
          {!club.coverImage && (
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-serif font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {club.name}
              </h3>
              <div
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-lg ${getActivityColor(
                  club.activity
                )}`}
              >
                {getActivityIcon(club.activity)}
                {club.activity}
              </div>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 font-serif leading-relaxed">
            {club.description}
          </p>

          {/* Current Book */}
          {club.currentBook && (
            <div className="flex items-center gap-3 mb-4 p-4 bg-gradient-to-r from-primary-50/50 to-secondary-50/50 dark:from-primary-900/30 dark:to-secondary-900/30 rounded-lg border border-primary-200/30 dark:border-primary-700/30">
              <Image
                src={club.currentBook.cover}
                alt={club.currentBook.title}
                width={40}
                height={60}
                className="rounded shadow-md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-serif font-bold text-sm text-gray-900 dark:text-white truncate">
                  {club.currentBook.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate font-serif italic">
                  by {club.currentBook.author}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${club.currentBook.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-primary-600 dark:text-primary-400 whitespace-nowrap font-medium">
                    {club.currentBook.progress}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4 text-primary-500" />
              <span className="font-serif">
                {club.memberCount} magical members
              </span>
            </div>
            {club.nextMeeting && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4 text-secondary-500" />
                <span className="font-serif text-xs">
                  {new Date(club.nextMeeting).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {club.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gradient-to-r from-primary-100 to-secondary-100 dark:from-primary-900/50 dark:to-secondary-900/50 text-primary-700 dark:text-primary-300 text-xs rounded-full border border-primary-200/50 dark:border-primary-700/50 font-serif"
              >
                {tag}
              </span>
            ))}
            {club.tags.length > 3 && (
              <span className="px-2 py-1 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full border border-gray-200 dark:border-gray-600 font-serif">
                +{club.tags.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50/50 to-primary-50/30 dark:from-gray-900/50 dark:to-primary-900/30 border-t border-primary-200/50 dark:border-primary-700/50">
          {club.isJoined ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 text-sm font-serif font-medium">
                <CheckCircleIcon className="h-4 w-4" />
                Joined this Circle
              </div>
              <div className="flex gap-2">
                {onView && (
                  <button
                    onClick={onView}
                    className="text-primary-600 hover:text-primary-700 text-sm font-serif font-medium px-3 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    View Discussion
                  </button>
                )}
                {showManagement && (
                  <button className="text-gray-600 hover:text-gray-700 text-sm font-serif font-medium px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    Manage
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={onJoin}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white rounded-lg transition-all duration-300 text-sm font-serif font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Join This Circle
              </button>
              {onView && (
                <button
                  onClick={onView}
                  className="px-4 py-2 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 text-sm font-serif font-medium shadow-lg"
                >
                  Peek Inside
                </button>
              )}
            </div>
          )}
        </div>

        {/* Magical hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </div>
  );
}

// Buddy Read Card Component
interface BuddyReadCardProps {
  buddyRead: BuddyRead;
  onJoin: () => void;
}

function BuddyReadCard({ buddyRead, onJoin }: BuddyReadCardProps) {
  const daysLeft = Math.ceil(
    (new Date(buddyRead.targetEndDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const spotsLeft = buddyRead.maxParticipants - buddyRead.participants.length;

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/20 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
      {/* Book Header */}
      <div className="p-6 pb-4">
        <div className="flex gap-4 mb-4">
          <Image
            src={buddyRead.bookCover}
            alt={buddyRead.bookTitle}
            width={60}
            height={90}
            className="rounded shadow-md"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {buddyRead.bookTitle}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              by {buddyRead.bookAuthor}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{daysLeft > 0 ? `${daysLeft} days left` : "Ended"}</span>
              <span>•</span>
              <span>{spotsLeft} spots left</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {buddyRead.description}
        </p>

        {/* Participants */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Participants ({buddyRead.participants.length}/
            {buddyRead.maxParticipants})
          </p>
          <div className="flex -space-x-2">
            {buddyRead.participants.map((participant, index) => (
              <div
                key={participant.id}
                className="relative w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden"
                title={participant.name}
              >
                {participant.avatar ? (
                  <Image
                    src={participant.avatar}
                    alt={participant.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                    {participant.name.charAt(0)}
                  </div>
                )}
              </div>
            ))}
            {spotsLeft > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <PlusIcon className="h-4 w-4 text-gray-500" />
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {buddyRead.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${buddyRead.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        {buddyRead.isJoined ? (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircleIcon className="h-4 w-4" />
            Joined
          </div>
        ) : spotsLeft > 0 ? (
          <button
            onClick={onJoin}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Join Buddy Read
          </button>
        ) : (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium"
          >
            Full
          </button>
        )}
      </div>
    </div>
  );
}

// Create Modal Component
interface CreateModalProps {
  type: "club" | "buddy-read";
  onClose: () => void;
  onCreateClub: (data: ClubFormData) => void;
  onCreateBuddyRead: (data: BuddyReadFormData) => void;
}

function CreateModal({
  type,
  onClose,
  onCreateClub,
  onCreateBuddyRead,
}: CreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Science Fiction");
  const [isPublic, setIsPublic] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Buddy read specific
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [targetEndDate, setTargetEndDate] = useState("");

  const categories = [
    "Science Fiction",
    "Fantasy",
    "Mystery",
    "Romance",
    "Historical Fiction",
    "Literary Fiction",
  ];

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "club") {
      onCreateClub({
        name,
        description,
        category,
        isPublic,
        tags,
      });
    } else {
      onCreateBuddyRead({
        bookTitle,
        bookAuthor,
        bookCover: "/bookcovers/sciencefiction.png", // Default cover
        description,
        maxParticipants,
        targetEndDate,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {type === "club" ? "Create Book Club" : "Start Buddy Read"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "club" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Privacy
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="mr-2"
                    />
                    <GlobeAltIcon className="h-4 w-4 mr-1" />
                    Public
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="mr-2"
                    />
                    <LockClosedIcon className="h-4 w-4 mr-1" />
                    Private
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-900 dark:hover:text-primary-100"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="What makes this book special for a group read?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Participants *
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target End Date *
                </label>
                <input
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {type === "club" ? "Create Club" : "Start Reading"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Club Discussion View Component
interface ClubDiscussionViewProps {
  club: BookClub;
  onClose: () => void;
}

function ClubDiscussionView({ club, onClose }: ClubDiscussionViewProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Show different messages based on whether it's the tutorial club
    if (club.id === "tutorial-sample") {
      return [
        {
          id: "1",
          userId: "user1",
          userName: "BookHaven Guide",
          userAvatar: "/avatars/alex.jpg",
          content:
            "Welcome to this demo discussion! This is where club members share their thoughts about the current book. Feel free to join the conversation!",
          timestamp: "2025-08-25T10:30:00Z",
          isCurrentUser: false,
        },
        {
          id: "2",
          userId: "user2",
          userName: "Reading Buddy",
          userAvatar: "/avatars/sarah.jpg",
          content:
            "I'm loving this book so far! The character development is incredible. What's everyone else thinking about Evelyn's story?",
          timestamp: "2025-08-25T11:15:00Z",
          isCurrentUser: false,
        },
        {
          id: "3",
          userId: "user3",
          userName: "Book Explorer",
          userAvatar: "/avatars/emma.jpg",
          content:
            "The way the author reveals each husband's story is so clever! I can't put it down. Anyone else staying up too late reading? 📚",
          timestamp: "2025-08-25T12:00:00Z",
          isCurrentUser: false,
        },
      ];
    } else {
      // For all other clubs (including newly created ones), start with empty discussion
      // or just a welcome message from the club creator
      const welcomeMessage = club.currentBook
        ? `Welcome to ${club.name}! Let's discuss "${club.currentBook.title}" by ${club.currentBook.author}. Feel free to share your thoughts and questions here.`
        : `Welcome to ${club.name}! I'm excited to start our reading journey together. Feel free to share book recommendations, thoughts, and questions here.`;

      return [
        {
          id: "welcome",
          userId: "creator",
          userName: club.createdBy,
          content: welcomeMessage,
          timestamp: club.createdAt,
          isCurrentUser: club.createdBy === "You",
        },
      ];
    }
  });

  const [newMessage, setNewMessage] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      userId: "current",
      userName: "You",
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isCurrentUser: true,
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {club.currentBook && (
              <Image
                src={club.currentBook.cover}
                alt={club.currentBook.title}
                width={40}
                height={60}
                className="rounded shadow-sm"
              />
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {club.name}
              </h2>
              {club.currentBook && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Currently reading: {club.currentBook.title}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.isCurrentUser ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center flex-shrink-0">
                {message.userAvatar ? (
                  <Image
                    src={message.userAvatar}
                    alt={message.userName}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {message.userName.charAt(0)}
                  </span>
                )}
              </div>
              <div
                className={`flex-1 max-w-md ${
                  message.isCurrentUser ? "text-right" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {message.userName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.isCurrentUser
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                club.id === "tutorial-sample"
                  ? "Try typing a message to see how discussions work!"
                  : "Share your thoughts..."
              }
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Tutorial Overlay Component
interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

interface TutorialOverlayProps {
  show: boolean;
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  steps: TutorialStep[];
}

function TutorialOverlay({
  show,
  currentStep,
  onNext,
  onPrev,
  onClose,
  steps,
}: TutorialOverlayProps) {
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    if (show && steps[currentStep]) {
      const element = document.getElementById(steps[currentStep].target);
      setHighlightElement(element);
    }
  }, [show, currentStep, steps]);

  if (!show || !steps[currentStep]) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay with glass effect */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Tutorial card */}
      <div
        className="absolute pointer-events-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/30 dark:border-gray-700/30 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 z-60"
        style={{
          top: highlightElement
            ? highlightElement.getBoundingClientRect().bottom + 20
            : "50%",
          left: highlightElement
            ? Math.max(
                16,
                Math.min(
                  highlightElement.getBoundingClientRect().left,
                  window.innerWidth - 400
                )
              )
            : "50%",
          transform: highlightElement ? "none" : "translate(-50%, -50%)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {step.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-700 dark:text-gray-300 mb-8 leading-relaxed text-base">
          {step.description}
        </p>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={onPrev}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Skip Tutorial
            </button>
            <button
              onClick={currentStep === steps.length - 1 ? onClose : onNext}
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg font-medium"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Highlight ring around target element */}
      {highlightElement && (
        <div
          className="absolute pointer-events-none border-3 border-primary-500 rounded-xl z-50 shadow-lg"
          style={{
            top: highlightElement.getBoundingClientRect().top - 6,
            left: highlightElement.getBoundingClientRect().left - 6,
            width: highlightElement.getBoundingClientRect().width + 12,
            height: highlightElement.getBoundingClientRect().height + 12,
            boxShadow:
              "0 0 0 2px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)",
          }}
        />
      )}
    </div>
  );
}
