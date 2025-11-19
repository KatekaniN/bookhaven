import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// Email provider and adapter intentionally disabled for now

const isProd = process.env.NODE_ENV === "production";

const providers: any[] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
];

// Email passwordless temporarily disabled; no adapter configured
const adapterConfig = {};

export const authOptions = {
  // Ensure a stable secret; required for JWT sessions to be verifiable across routes
  secret: process.env.NEXTAUTH_SECRET,
  // Trust Vercel/host headers for callback URLs and cookie domains
  trustHost: true as const,
  providers,
  ...adapterConfig,
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    verifyRequest: "/auth/verify-request",
  },
  session: {
    strategy: "jwt" as const,
  },
  // Use NextAuth default cookies to avoid misconfiguration in production
  callbacks: {
    async jwt({ token, user, account, profile }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image || profile?.picture || profile?.avatar_url;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        // Ensure user object exists
        // @ts-ignore
        session.user = session.user || ({} as any);
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.email = token.email;
        // @ts-ignore
        session.user.name = token.name;
        // @ts-ignore
        session.user.image = token.picture;
        // @ts-ignore
        session.accessToken = token.accessToken;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }: any) {
      // Basic sanity checks
      const userEmail = user?.email || email?.email || profile?.email;
      if (!userEmail) {
        console.warn("signIn denied: missing email", {
          provider: account?.provider,
        });
        return false;
      }

      // Optional allowlist or domain restriction via env
      const allowedEmails = (process.env.ALLOWED_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || "")
        .trim()
        .toLowerCase();

      const emailLower = String(userEmail).toLowerCase();
      if (allowedEmails.length > 0 && !allowedEmails.includes(emailLower)) {
        console.warn("signIn denied: not in allowlist", emailLower);
        return false;
      }
      if (allowedDomain && !emailLower.endsWith(`@${allowedDomain}`)) {
        console.warn("signIn denied: domain mismatch", emailLower);
        return false;
      }

      // If we got here, allow login
      return true;
    },
    async redirect({ url, baseUrl }: any) {
      // Don't force redirect to onboarding - let the app handle routing logic
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl; // Just redirect to home, let the app decide routing
    },
  },
  debug: process.env.NODE_ENV === "development",
};
// Only export authOptions; the route handler binds it in app/api/auth/[...nextauth]/route.ts
