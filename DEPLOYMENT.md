# Deployment

## Deployment Model

This project is set up for:

- Vercel hosting for the frontend and `/api/*` serverless functions
- Firebase Authentication
- Firestore
- Firebase Storage

It is not using Firebase Functions as the active admin backend.

## Active API Routes

These Vercel functions are the live admin backend:

- [api/admin/auth-sync.js](/C:/Users/hango/Desktop/civil-web/api/admin/auth-sync.js)
- [api/admin/users.js](/C:/Users/hango/Desktop/civil-web/api/admin/users.js)
- [api/admin/logs.js](/C:/Users/hango/Desktop/civil-web/api/admin/logs.js)
- [api/cms/firebase-web-config.js](/C:/Users/hango/Desktop/civil-web/api/cms/firebase-web-config.js)

## Vercel Environment Variables

### Required Web SDK Variables

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_WEB_AUTH_DOMAIN`
- `FIREBASE_WEB_PROJECT_ID`
- `FIREBASE_WEB_STORAGE_BUCKET`
- `FIREBASE_WEB_MESSAGING_SENDER_ID`
- `FIREBASE_WEB_APP_ID`

### Required Admin SDK Variables

Primary option:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Supported alternatives:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `GOOGLE_APPLICATION_CREDENTIALS` with `FIREBASE_USE_APPLICATION_DEFAULT=true`

### Optional Variables

- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_DATABASE_URL`
- `CMS_ENABLE_EMAIL_ADMIN_FALLBACK`
- `CMS_ADMIN_EMAILS`
- `CMS_MAX_PAYLOAD_BYTES`

## First-Time Setup

1. Create the Firebase project.
2. Enable Firestore.
3. Enable Authentication providers:
   - Email/Password
   - Google
4. Add your Vercel domain to Firebase Authentication authorized domains.
5. Set the Vercel environment variables.
6. Deploy Firestore and Storage rules.
7. Create the first super admin with the bootstrap script.

## Bootstrap The First Super Admin

Run locally after the Admin SDK credentials are available:

```bash
npm run bootstrap:super-admin -- --email you@example.com --name "Your Name"
```

Then log in at:

```text
/elitech/admin/
```

## Local Verification

Run:

```bash
npm install
npm run check:firebase
```

This does not open a browser, but it verifies that the Firebase client config and Firebase Admin backend credentials are usable.

## Manual End-To-End Test

1. Open `/elitech/admin/`
2. Log in with the first super admin
3. Confirm the dashboard opens
4. Open `Users & Admins`
5. Create another admin
6. Open `Audit Logs`
7. Confirm login and user-creation events appear
8. Log out
9. Log in as the newly created admin

## Notes

- The admin dashboard depends on Firestore `adminUsers` as the source of truth.
- Firebase custom claims are refreshed by `/api/admin/auth-sync` after login.
- A successful Firebase sign-in alone is not enough for admin access.
