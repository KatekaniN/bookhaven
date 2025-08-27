"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
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

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    loadData();

    // Check if user has seen the tutorial before
    const tutorialSeen = localStorage.getItem("bookClubsTutorialSeen");
    if (!tutorialSeen) {
      setTimeout(() => {
        setShowTutorial(true);
      }, 1500); // Show tutorial after page loads
    } else {
      setHasSeenTutorial(true);
    }
  }, [session, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user has seen tutorial - if not, show sample data
      const tutorialSeen = localStorage.getItem("bookClubsTutorialSeen");

      if (!tutorialSeen) {
        // Show sample data during tutorial
        setBookClubs([
          {
            id: "tutorial-sample",
            name: "BookHaven Demo Club",
            description:
              "This is a sample book club to demonstrate how discussions work. Try clicking 'View Discussion' to see how club conversations look!",
            memberCount: 12,
            currentBook: {
              title: "The Seven Husbands of Evelyn Hugo",
              author: "Taylor Jenkins Reid",
              cover: "/bookcovers/romanticcomedy.png",
              progress: 65,
            },
            isPublic: true,
            category: "Contemporary Fiction",
            createdBy: "BookHaven Team",
            createdAt: "2025-08-01",
            nextMeeting: "2025-09-01T19:00:00Z",
            tags: ["contemporary", "demo", "tutorial"],
            isJoined: false,
            activity: "high",
          },
        ]);

        setBuddyReads([
          {
            id: "tutorial-buddy",
            bookTitle: "Klara and the Sun",
            bookAuthor: "Kazuo Ishiguro",
            bookCover: "/bookcovers/sciencefiction.png",
            participants: [
              { id: "1", name: "Alex", avatar: "/avatars/alex.jpg" },
              { id: "2", name: "Sarah", avatar: "/avatars/sarah.jpg" },
            ],
            startDate: "2025-08-20",
            targetEndDate: "2025-09-20",
            progress: 25,
            isJoined: false,
            maxParticipants: 4,
            description:
              "A sample buddy read to show how small group reading works. Perfect for trying out the feature!",
          },
        ]);
      } else {
        // After tutorial, start with empty state
        setBookClubs([]);
        setBuddyReads([]);
      }
    } catch (error) {
      console.error("Error loading book clubs data:", error);
      toast.error("Failed to load book clubs");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = (clubId: string) => {
    setBookClubs((clubs) =>
      clubs.map((club) =>
        club.id === clubId
          ? { ...club, isJoined: true, memberCount: club.memberCount + 1 }
          : club
      )
    );
    toast.success("Joined book club!");
  };

  const handleJoinBuddyRead = (buddyReadId: string) => {
    setBuddyReads((reads) =>
      reads.map((read) =>
        read.id === buddyReadId ? { ...read, isJoined: true } : read
      )
    );
    toast.success("Joined buddy read!");
  };

  const handleCreateClub = (formData: ClubFormData) => {
    const newClub: BookClub = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      category: formData.category,
      isPublic: formData.isPublic,
      tags: formData.tags,
      coverImage: formData.coverImage,
      currentBook: formData.currentBook
        ? { ...formData.currentBook, progress: 0 }
        : undefined,
      memberCount: 1,
      createdBy: session?.user?.name || "You",
      createdAt: new Date().toISOString(),
      isJoined: true,
      activity: "low" as const,
    };

    setBookClubs((clubs) => [newClub, ...clubs]);
    setShowCreateModal(false);
    toast.success("Book club created successfully!");
  };

  const handleCreateBuddyRead = (formData: BuddyReadFormData) => {
    const newBuddyRead: BuddyRead = {
      id: Date.now().toString(),
      bookTitle: formData.bookTitle,
      bookAuthor: formData.bookAuthor,
      bookCover: formData.bookCover,
      description: formData.description,
      maxParticipants: formData.maxParticipants,
      targetEndDate: formData.targetEndDate,
      startDate: new Date().toISOString(),
      progress: 0,
      isJoined: true,
      participants: [
        {
          id: "current-user",
          name: session?.user?.name || "You",
          avatar: session?.user?.image || undefined,
        },
      ],
    };

    setBuddyReads((reads) => [newBuddyRead, ...reads]);
    setShowCreateModal(false);
    toast.success("Buddy read started successfully!");
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
      title: "Welcome to Book Clubs! 📚",
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading book clubs...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary-600" />
                Book Clubs
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Connect with fellow readers, join discussions, and discover your
                next favorite book
              </p>
            </div>
            {hasSeenTutorial && (
              <button
                onClick={restartTutorial}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                <SparklesIcon className="h-4 w-4" />
                Tutorial
              </button>
            )}
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex gap-2 mb-6">
            {[
              {
                key: "clubs" as const,
                label: "All Clubs",
                icon: UserGroupIcon,
              },
              {
                key: "buddy-reads" as const,
                label: "Buddy Reads",
                icon: HeartIcon,
              },
              {
                key: "my-clubs" as const,
                label: "My Clubs",
                icon: BookOpenIcon,
              },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={`${key}-tab`}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === key
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80"
                } backdrop-blur-sm border border-white/20 dark:border-gray-700/20`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Search and Filter */}
            {activeTab === "clubs" && (
              <div
                id="search-section"
                className="flex flex-col sm:flex-row gap-4 flex-1"
              >
                <div className="relative flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 border border-white/20 dark:border-gray-700/20 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Create Button - Only show when there are items to display, or when search/filter is active */}
            {((activeTab === "clubs" &&
              (filteredClubs.length > 0 ||
                searchQuery ||
                selectedCategory !== "all")) ||
              (activeTab === "buddy-reads" && buddyReads.length > 0) ||
              (activeTab === "my-clubs" && myClubs.length > 0)) && (
              <button
                id="create-button"
                onClick={() => {
                  setCreateType(
                    activeTab === "buddy-reads" ? "buddy-read" : "club"
                  );
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors whitespace-nowrap"
              >
                <PlusIcon className="h-4 w-4" />
                {activeTab === "buddy-reads"
                  ? "Start Buddy Read"
                  : "Create Club"}
              </button>
            )}
          </div>
        </div>
        {/* Content */}
        {activeTab === "clubs" && (
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
              <div className="col-span-full text-center py-12">
                <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Book Clubs Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Be the first to create a book club and start building your
                  reading community!
                </p>
                <button
                  onClick={() => {
                    setCreateType("club");
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  Create First Club
                </button>
              </div>
            )}
          </div>
        )}{" "}
        {activeTab === "buddy-reads" && (
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
              <div className="col-span-full text-center py-12">
                <HeartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Buddy Reads Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start a buddy read to share the reading experience with a
                  small group of friends!
                </p>
                <button
                  onClick={() => {
                    setCreateType("buddy-read");
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <HeartIcon className="h-5 w-5" />
                  Start First Buddy Read
                </button>
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
  onJoin: () => void;
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
    <div
      className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden ${
        club.id === "tutorial-sample"
          ? "border-primary-300 dark:border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800"
          : "border-white/20 dark:border-gray-700/20"
      }`}
    >
      {/* Tutorial Badge */}
      {club.id === "tutorial-sample" && (
        <div className="bg-primary-100 dark:bg-primary-900/30 px-4 py-2 flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
            Demo Club - Try the features!
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
            {club.name}
          </h3>
          <div
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(
              club.activity
            )}`}
          >
            {getActivityIcon(club.activity)}
            {club.activity}
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {club.description}
        </p>

        {/* Current Book */}
        {club.currentBook && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
            <Image
              src={club.currentBook.cover}
              alt={club.currentBook.title}
              width={40}
              height={60}
              className="rounded shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {club.currentBook.title}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                by {club.currentBook.author}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full"
                    style={{ width: `${club.currentBook.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {club.currentBook.progress}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4" />
            <span>{club.memberCount} members</span>
          </div>
          {club.nextMeeting && (
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(club.nextMeeting).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {club.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {club.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
              +{club.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
        {club.isJoined ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircleIcon className="h-4 w-4" />
              Joined
            </div>
            <div className="flex gap-2">
              {onView && (
                <button
                  onClick={onView}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View Discussion
                </button>
              )}
              {showManagement && (
                <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                  Manage
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onJoin}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Join Club
            </button>
            {onView && (
              <button
                onClick={onView}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                View
              </button>
            )}
          </div>
        )}
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
