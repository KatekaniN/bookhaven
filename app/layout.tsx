import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Navigation } from "../components/layout/Navigation";
import { AuthGuard } from "../components/auth/AuthGuard";
import OnboardingDataSync from "../components/auth/OnboardingDataSync";
import { SessionDebug } from "../components/debug/SessionDebug";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "BookHaven - Your Reading Companion",
  description:
    "A modern Goodreads alternative for discovering, tracking, and sharing your reading journey",
  manifest: "/manifest.json",
  keywords: ["books", "reading", "reviews", "book club", "social reading"],
  authors: [{ name: "BookHaven Team" }],
  creator: "BookHaven",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bookhaven.app",
    title: "BookHaven - Your Reading Companion",
    description:
      "A modern Goodreads alternative for discovering, tracking, and sharing your reading journey",
    siteName: "BookHaven",
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
    title: "BookHaven - Your Reading Companion",
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
          <OnboardingDataSync />
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
          <SessionDebug />
        </Providers>
      </body>
    </html>
  );
}
