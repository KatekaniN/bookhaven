import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navigation } from "../components/layout/Navigation";
import { AuthGuard } from "../components/auth/AuthGuard";
import OnboardingDataSync from "../components/auth/OnboardingDataSync";
import DataMigration from "../components/utils/DataMigration";
import { SessionDebug } from "../components/debug/SessionDebug";
import { OnboardingDebug } from "../components/debug/OnboardingDebug";
import { CustomCursor } from "../components/ui/CustomCursor";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Book Haven - Your Reading Companion",
  description:
    "A modern Goodreads alternative for discovering, tracking, and sharing your reading journey",
  manifest: "/manifest.json",
  keywords: ["books", "reading", "reviews", "book club", "social reading"],
  authors: [{ name: "BookHaven Team" }],
  creator: "Book Haven",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/favicon.ico", sizes: "16x16", type: "image/x-icon" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookhaven.app",
    title: "Book Haven - Your Reading Companion",
    description:
      "A modern Goodreads alternative for discovering, tracking, and sharing your reading journey",
    siteName: "Book Haven",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Haven - Your Reading Companion",
    description:
      "A modern Goodreads alternative for discovering, tracking, and sharing your reading journey",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#B7A3CA" },
    { media: "(prefers-color-scheme: dark)", color: "#9d7bb4" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#B7A3CA" />
      </head>
      <body
        className={`${inter.className} bg-white dark:bg-gray-900 text-gray-900 dark:text-white`}
      >
        <Providers>
          <CustomCursor />
          <OnboardingDataSync />
          <DataMigration />
          <AuthGuard>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--toast-bg)",
                  color: "var(--toast-color)",
                },
              }}
            />
          </AuthGuard>
          <OnboardingDebug />
          {/* <SessionDebug /> */}
        </Providers>
      </body>
    </html>
  );
}
