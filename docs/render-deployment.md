# BookHaven Deployment Guide for Render

## Prerequisites

1. GitHub account with your code pushed
2. Render account (free tier available)
3. Google OAuth credentials configured for production domain

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Choose your BookHaven repository

### 3. Configure Service Settings

- **Name**: `bookhaven` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your deployment branch)
- **Runtime**: `Node`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm start`

### 4. Environment Variables

Add these environment variables in Render dashboard:

#### Required Variables:

- `NODE_ENV`: `production`
- `NEXTAUTH_URL`: `https://your-app-name.onrender.com`
- `NEXTAUTH_SECRET`: Generate a random string (Render can auto-generate)

#### Google OAuth:

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret

#### Firebase (Public variables):

- `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID

#### API Configuration:

- `NEXT_PUBLIC_OPEN_LIBRARY_API`: `https://openlibrary.org`

### 5. Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Add your Render domain to "Authorized redirect URIs":
   - `https://your-app-name.onrender.com/api/auth/callback/google`
5. Add your domain to "Authorized JavaScript origins":
   - `https://your-app-name.onrender.com`

### 6. Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to a public URL

### 7. Post-Deployment Checklist

- [ ] App loads successfully
- [ ] Google OAuth login works
- [ ] Firebase integration works
- [ ] API routes respond correctly
- [ ] PWA features work
- [ ] Images load properly

## Troubleshooting

### Common Issues:

1. **Build Fails**

   - Check build logs in Render dashboard
   - Ensure all dependencies are in package.json
   - Verify TypeScript types are correct

2. **OAuth Redirect Mismatch**

   - Verify Google OAuth redirect URLs
   - Check NEXTAUTH_URL environment variable

3. **Image Loading Issues**

   - Verify Next.js image domains configuration
   - Check if remote image sources are accessible

4. **Environment Variables**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify Firebase configuration

### Performance Tips:

- Use Render's paid plans for better performance
- Consider CDN for static assets
- Monitor build times and optimize if needed

## Custom Domain (Optional)

1. Purchase domain from provider
2. In Render dashboard, go to Settings → Custom Domains
3. Add your domain and configure DNS
4. Update Google OAuth and Firebase settings with new domain

## Monitoring

- Use Render's built-in logs and metrics
- Set up uptime monitoring
- Monitor performance and user feedback
