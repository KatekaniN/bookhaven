# Quick Deployment: Vercel (recommended)

For a streamlined Next.js deployment, use Vercel. See the detailed guide: `docs/vercel-deployment.md`.

Basic steps:

1. Push your code to GitHub.
2. Import the repo in Vercel and select the `features` (or `main`) branch.
3. Add environment variables from `.env.example` (both Production and Preview).
4. Set OAuth callbacks to `https://<project>.vercel.app/api/auth/callback/{provider}`.
5. Deploy. Test `/auth/signin`, `/api/book-clubs`, `/api/buddy-reads`.

If you prefer Render, follow the steps below.

# Quick Deployment Steps for Render

## ✅ Pre-Deployment Checklist

1. **Code is ready**: All features tested locally
2. **Environment variables**: Create a list of all required variables
3. **Google OAuth**: Have client ID and secret ready
4. **Firebase**: Have all Firebase config values ready

## 🚀 Deployment Process

### Step 1: Initial Deployment

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. New → Web Service
3. Connect GitHub repo: `bookhaven`
4. Configure:
   - **Name**: `bookhaven` (or your choice)
   - **Branch**: `features` (or `main`)
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### Step 2: Set Environment Variables

```
NODE_ENV=production
NEXTAUTH_URL=https://placeholder.onrender.com
NEXTAUTH_SECRET=[auto-generate in Render]
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
NEXT_PUBLIC_FIREBASE_API_KEY=[your-firebase-api-key]
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=[your-firebase-auth-domain]
NEXT_PUBLIC_FIREBASE_PROJECT_ID=[your-firebase-project-id]
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=[your-firebase-storage-bucket]
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=[your-firebase-messaging-sender-id]
NEXT_PUBLIC_FIREBASE_APP_ID=[your-firebase-app-id]
NEXT_PUBLIC_OPEN_LIBRARY_API=https://openlibrary.org
```

### Step 3: Deploy First Time

- Click "Create Web Service"
- Wait for deployment (may fail due to OAuth)
- **COPY YOUR RENDER URL** (e.g., `https://bookhaven-abc123.onrender.com`)

### Step 4: Update with Real URL

1. **Update Render Environment Variable**:

   - Go to Environment tab
   - Change `NEXTAUTH_URL` to your actual Render URL
   - Save (triggers redeploy)

2. **Update Google OAuth**:
   - Go to Google Cloud Console
   - APIs & Services → Credentials
   - Edit OAuth 2.0 Client ID
   - Add redirect URI: `https://your-render-url.onrender.com/api/auth/callback/google`
   - Add origin: `https://your-render-url.onrender.com`

### Step 5: Test Everything

- [ ] App loads
- [ ] Sign in with Google works
- [ ] Onboarding flow works
- [ ] Book search works
- [ ] All features functional

## 🔧 If Something Goes Wrong

1. **Check Render Logs**: Dashboard → Logs tab
2. **Check Build Logs**: Look for TypeScript errors
3. **Check Runtime Logs**: Look for API errors
4. **Verify Environment Variables**: Make sure all are set correctly

## 📝 Important Notes

- **URL Format**: Render URLs are usually `https://app-name-random.onrender.com`
- **Redeploy**: Any environment variable change triggers redeploy
- **Free Tier**: May take 30+ seconds to start if inactive
- **Branch**: Make sure you're deploying the right branch

## 🎯 Your URLs to Update

After deployment, update these:

- [ ] `NEXTAUTH_URL` in Render
- [ ] Google OAuth redirect URI
- [ ] Google OAuth origin
- [ ] Any hardcoded URLs in your code (if any)
