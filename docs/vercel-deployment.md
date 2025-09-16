# Vercel deployment guide

This project is a Next.js 14 App Router app with NextAuth and Firebase (Firestore). Vercel is the recommended host.

## 1) Prepare environment variables

Create these in Vercel Project Settings → Environment Variables (Scope: Production & Preview):

- NEXTAUTH_URL = https://<your-project>.vercel.app
- NEXTAUTH_SECRET = <64+ char random secret>
- GOOGLE_CLIENT_ID = <from Google Cloud>
- GOOGLE_CLIENT_SECRET = <from Google Cloud>
- GITHUB_ID = <from GitHub OAuth app>
- GITHUB_SECRET = <from GitHub OAuth app>
- NEXT_PUBLIC_FIREBASE_API_KEY = <from Firebase project settings>
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = <project-id>.firebaseapp.com
- NEXT_PUBLIC_FIREBASE_PROJECT_ID = <project-id>
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = <project-id>.appspot.com
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = <from Firebase>
- NEXT_PUBLIC_FIREBASE_APP_ID = <from Firebase>
 - NEXT_PUBLIC_NYT_API_KEY = <from NYT Books API> (or set `NYT`)

Use `.env.example` as a reference.

## 2) Configure OAuth callback URLs

- NextAuth uses the App Router endpoint at `/api/auth/[...nextauth]`.
- Add these Redirect URIs to providers:
  - Google: https://<your-project>.vercel.app/api/auth/callback/google
  - GitHub: https://<your-project>.vercel.app/api/auth/callback/github
  - Local dev (optional): http://localhost:3000/api/auth/callback/google and /github

## 3) Connect Firebase

- You’re using the client SDK for Firestore; no server admin creds are required.
- Ensure Firestore composite indexes are deployed (see `firestore.indexes.json`).

## 4) Deploy on Vercel

- Import the repository in Vercel.
- Framework preset: Next.js (auto-detected).
- Build command: `next build` (auto).
- Output dir: `.vercel/output` (auto) or default serverless (auto).
- Environment variables: add before first deploy.

## 5) Images and PWA

- `next.config.js` already whitelists external image domains used by the app.
- PWA is enabled for production via `next-pwa`. Vercel supports this as is.

## 6) Post-deploy checks

- Visit `/auth/signin` and confirm Google/GitHub sign-in.
- Test APIs: `/api/book-clubs`, `/api/buddy-reads` (should return data or empty arrays).
- Create a club and buddy read; refresh to confirm persistence.

## 7) Troubleshooting

- 401/redirect loop: Confirm `NEXTAUTH_URL` and provider callback URLs match the exact domain (no trailing slashes). Also set a strong `NEXTAUTH_SECRET`.
- Firestore query index error: Deploy indexes from `firestore.indexes.json` in Firebase console.
- Image 403/blank: Ensure the image host is listed under `images.remotePatterns` in `next.config.js`.
- Route not found: App Router API route paths must be `/app/api/.../route.ts` (already set in this repo).
