# Deployment Model: Vercel

This project uses **Vercel** as the primary deployment platform for serverless functions and static hosting.

## Architecture Overview

- **Frontend Hosting:** Vercel (static files + redirects)
- **API Functions:** Vercel Serverless Functions (cold-start optimized)
- **Data Layer:** Firebase Firestore (authentication & content storage)
- **Admin Panel:** Firebase Web SDK + Vercel API endpoints

## API Endpoints

All API functions are deployed to Vercel and routed through `/api/**`:

### CMS Content
- `GET /api/cms/content` - Fetch CMS configuration
- `PUT /api/cms/content` - Update CMS configuration
- `GET /api/cms/firebase-web-config` - Fetch Firebase Web configuration

### Admin Authentication & Management
- `POST /api/admin/auth-sync` - Authorize admin user after Firebase login
- `GET /api/admin/users` - List all admin users (token + role required)
- `POST /api/admin/users` - Create new admin user (super_admin only)
- `GET /api/admin/logs` - Fetch audit logs with pagination & filtering

## Admin Authorization

Admin access is controlled via pre-authorized users in Firestore:

**Collection:** `adminUsers`
**Documents:** One per authorized admin user (keyed by Firebase UID)
**Fields:**
- `email` (string) - Admin email address (normalized: lowercase, trimmed)
- `role` (string) - Either `"admin"` or `"super_admin"`
- `createdAt` (timestamp) - Account creation timestamp
- `lastLogin` (timestamp) - Last successful login timestamp

**Custom Claims:** After successful `/api/admin/auth-sync` call, Firebase ID token includes:
- `role` (string) - `"admin"` or `"super_admin"`
- `authorizedAt` (string) - ISO timestamp of authorization

No `isAdmin` boolean claim is used; authorization is role-based via the `role` claim.

## Environment Variables

Set these in your Vercel project settings:

### Firebase Admin SDK (Backend)
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (single-line with escaped `\\n`)

### Firebase Web Config (Client)
- `FIREBASE_WEB_API_KEY` - Firebase web API key
- `FIREBASE_WEB_AUTH_DOMAIN` - Firebase auth domain
- `FIREBASE_WEB_PROJECT_ID` - Firebase project ID (can match backend)
- `FIREBASE_WEB_STORAGE_BUCKET` - Firebase storage bucket
- `FIREBASE_WEB_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `FIREBASE_WEB_APP_ID` - Firebase web app ID

### CMS (Optional)
- `VERCEL_KV_REST_API_URL` - Vercel KV Redis URL (optional, for persistent caching)
- `VERCEL_KV_REST_API_TOKEN` - Vercel KV token (optional)
- `CMS_ENABLE_EMAIL_ADMIN_FALLBACK` - Set to `"true"` to allow email-based CMS admin access
- `CMS_ADMIN_EMAILS` - Comma-separated list of admin emails (if fallback enabled)

## Deployment Process

### First Deployment
```bash
# Install dependencies
npm install --save-dev vercel

# Deploy to Vercel
vercel deploy

# Set up environment variables in Vercel Console
# https://vercel.com/dashboard -> Settings -> Environment Variables
```

### Subsequent Deployments
```bash
# Push to git and Vercel auto-deploys
git push origin main
```

### Local Development
```bash
# Test locally
vercel env pull  # Download environment variables
npm run dev      # Use @vercel/node for local emulation
```

## Firebase Configuration

Firebase is used as the database and authentication provider, NOT for hosting or functions.

### Setup Steps
1. Create Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (production mode)
3. Enable Firebase Authentication (Email/Password + Google OAuth)
4. Create service account for backend (Project Settings → Service Accounts)
5. Create web app and get Firebase Web Configuration
6. Add "civil-web.vercel.app" to Authentication → Authorized Domains

## Admin Panel Setup

### Initial Admin User Creation
1. Create first admin user directly in Firestore:
   ```
   Collection: adminUsers
   Document ID: (Firebase UID of first admin)
   Fields:
   {
     "email": "admin@example.com",
     "role": "super_admin",
     "createdAt": (server timestamp),
     "lastLogin": null
   }
   ```

2. Admin can then use Firebase login (email + password or Google) at `/elitech/admin/`
3. After login, `/api/admin/auth-sync` verifies authorization and sets custom claims
4. Super admins can create additional admin users via the Users & Admins tab

### Role-Based Access Control

**Admin Role:**
- View all users and audit logs
- Cannot create new admin users

**Super Admin Role:**
- View all users and audit logs
- Create new admin users with any role
- Full administrative access

## Troubleshooting

### "Firebase configuration is incomplete" error
- Verify all 6 `FIREBASE_WEB_*` environment variables are set in Vercel
- Run `vercel env pull` to verify locally
- Check Vercel Deployments tab for environment variable values

### Admin panel shows "Access denied"
- Verify user exists in `adminUsers` Firestore collection
- Check user's `role` field is either `"admin"` or `"super_admin"`
- Verify Firebase auth is properly configured
- Check browser console for detailed auth-sync error messages

### Audit logs not appearing
- Verify `/api/admin/logs` is accessible (test in browser with auth header)
- Check Firestore `adminAuditLogs` collection exists and has entries
- Verify user has `admin` or `super_admin` role

## Notes

- This project intentionally does NOT use Firebase Hosting or Cloud Functions
- All serverless functions are deployed to Vercel
- Firebase is used only for Firestore database and authentication
- Vercel provides better cold-start performance and developer experience for this codebase
