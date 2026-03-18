# Admin Setup Guide

This project uses:

- Firebase Authentication for admin sign-in
- Firestore for `adminUsers` and `adminAuditLogs`
- Vercel serverless functions under `/api/*`
- The admin panel at `/elitech/admin/`

## What Already Exists

The current codebase already includes:

- Google sign-in and email/password sign-in on the admin page
- `/api/admin/auth-sync` to authorize admins after Firebase login
- `/api/admin/users` to list and create admin users
- `/api/admin/logs` to read audit logs
- Firestore and Storage rules that use `request.auth.token.role`

## Local Environment

The local file [`.env.local`](/C:/Users/hango/Desktop/civil-web/.env.local) has already been created with your Firebase Web SDK values.

It still needs one server-side credential source before the backend can work:

1. `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`
2. `FIREBASE_SERVICE_ACCOUNT_JSON`
3. `GOOGLE_APPLICATION_CREDENTIALS` plus `FIREBASE_USE_APPLICATION_DEFAULT=true`

Tracked reference file: [`.env.example`](/C:/Users/hango/Desktop/civil-web/.env.example)

## Firebase Console Setup

### 1. Enable Authentication Providers

In Firebase Console, enable:

- Email/Password
- Google

Do not use passwordless email-link sign-in for this admin flow.

### 2. Authorized Domains

Add these domains in Firebase Authentication:

- `localhost`
- your Vercel production domain
- your Vercel preview domain if you use previews

### 3. Firestore Database

Create Firestore in production mode and deploy the rules from:

- [firestore.rules](/C:/Users/hango/Desktop/civil-web/firestore.rules)
- [storage.rules](/C:/Users/hango/Desktop/civil-web/storage.rules)

## Verify Backend Connectivity

Run:

```bash
npm run check:firebase
```

This checks:

- required `FIREBASE_WEB_*` values
- Firebase Admin SDK credential availability
- Firebase Auth Admin access
- Firestore access

If this command fails, the admin dashboard backend is not ready yet.

## Create The First Super Admin

After the Admin SDK credentials are configured, run:

```bash
npm run bootstrap:super-admin -- --email you@example.com --name "Your Name"
```

Optional password:

```bash
npm run bootstrap:super-admin -- --email you@example.com --password YourPassword123 --name "Your Name"
```

What the script does:

- creates the Firebase Auth user if it does not already exist
- writes `adminUsers/{uid}` in Firestore
- sets the custom claim `role`
- writes an audit log entry

If you do not pass a password and the user does not exist yet, the script generates a temporary password and prints it in the terminal.

Bootstrap script:

- [scripts/bootstrap-super-admin.js](/C:/Users/hango/Desktop/civil-web/scripts/bootstrap-super-admin.js)

## Admin Login Flow

1. Go to `/elitech/admin/`
2. Sign in with Google or email/password
3. The frontend calls `/api/admin/auth-sync`
4. The backend verifies the user exists in `adminUsers`
5. The backend sets the Firebase custom claim `role`
6. The dashboard opens

If the user is missing from `adminUsers`, login is rejected with `403`.

## Add More Admins From The Dashboard

After the first `super_admin` logs in:

1. Open the `Users & Admins` tab
2. Create additional admins
3. New admins can use the admin login page
4. If they were created without a known password, they can use `Forgot Password`

## Vercel Environment Variables

Set these in Vercel:

### Firebase Admin SDK

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Optional alternatives:

- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `FIREBASE_USE_APPLICATION_DEFAULT`

### Firebase Web SDK

- `FIREBASE_WEB_API_KEY`
- `FIREBASE_WEB_AUTH_DOMAIN`
- `FIREBASE_WEB_PROJECT_ID`
- `FIREBASE_WEB_STORAGE_BUCKET`
- `FIREBASE_WEB_MESSAGING_SENDER_ID`
- `FIREBASE_WEB_APP_ID`

## Key Files

- [api/cms/firebase.js](/C:/Users/hango/Desktop/civil-web/api/cms/firebase.js)
- [api/cms/firebase-web-config.js](/C:/Users/hango/Desktop/civil-web/api/cms/firebase-web-config.js)
- [api/admin/auth-sync.js](/C:/Users/hango/Desktop/civil-web/api/admin/auth-sync.js)
- [api/admin/users.js](/C:/Users/hango/Desktop/civil-web/api/admin/users.js)
- [api/admin/logs.js](/C:/Users/hango/Desktop/civil-web/api/admin/logs.js)
- [elitech/admin/firebase-email-auth.js](/C:/Users/hango/Desktop/civil-web/elitech/admin/firebase-email-auth.js)

## Common Failures

### "Firebase Web configuration is incomplete"

At least one `FIREBASE_WEB_*` variable is missing in Vercel or local env.

### "Firebase Admin SDK is not configured on the server"

The backend still does not have a usable service account source.

### "Access denied. Contact administrator."

The Firebase user signed in successfully but is not present in `adminUsers`.

### Dashboard loads but admin creation fails

The signed-in user is an `admin`, not a `super_admin`.
