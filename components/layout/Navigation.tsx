"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "../../hooks/useTheme";
import { useProfileImage } from "../../hooks/useProfileImage";
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { shouldShowImage, imageError, isLoading } = useProfileImage(
    session?.user?.image
  );

  // Debug logging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Navigation session data:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasImage: !!session?.user?.image,
        imageUrl: session?.user?.image,
        userName: session?.user?.name,
        userEmail: session?.user?.email,
        shouldShowImage,
        imageError,
        isLoading,
      });
    }
  }, [session, shouldShowImage, imageError, isLoading]);

  // Don't show navigation on auth pages or onboarding
  const hideNavigation =
    pathname?.startsWith("/auth") || pathname === "/onboarding";

  if (hideNavigation) {
    return null;
  }

  const navigation = [
    { name: "Explore", href: "/explore", icon: SparklesIcon },
    { name: "My Books", href: "/my-books", icon: HeartIcon },
    { name: "Reading Dashboard", href: "/stats", icon: ChartBarIcon },
    { name: "Book Clubs", href: "/book-clubs", icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="BookHaven" width={60} height={60} />
              <span className="text-xl font-bold text-gradient">
                Book Haven
              </span>
            </Link>
          </div>

          {/* Desktop and Tablet Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Tablet Navigation (icons only) */}
          <div className="hidden md:flex lg:hidden items-center space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={item.name}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            ))}
          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Auth */}
            {session ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="relative h-8 w-8 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
                    {session.user?.image && shouldShowImage ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="32px"
                        onError={(e) => {
                          console.error(
                            "Profile image failed to load:",
                            session.user?.image
                          );
                        }}
                        onLoad={() => {
                          console.log(
                            "Profile image loaded successfully:",
                            session.user?.image
                          );
                        }}
                      />
                    ) : session.user?.image && isLoading ? (
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-full h-full rounded-full" />
                    ) : (
                      <UserIcon className="h-5 w-5 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {session.user?.name || session.user?.email || "User"}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="btn btn-outline text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="btn btn-primary text-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Right side - Tablet */}
          <div className="hidden md:flex lg:hidden items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Auth */}
            {session ? (
              <div className="flex items-center space-x-2">
                <Link
                  href="/profile"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Profile"
                >
                  <div className="relative h-6 w-6 rounded-full overflow-hidden bg-primary-600 flex items-center justify-center">
                    {session.user?.image && shouldShowImage ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    ) : session.user?.image && isLoading ? (
                      <div className="animate-pulse bg-gray-300 dark:bg-gray-600 w-full h-full rounded-full" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-white" />
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Sign Out"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="p-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                title="Sign In"
              >
                <UserIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Right side - Mobile */}
          <div className="flex md:hidden items-center space-x-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "dark" ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
