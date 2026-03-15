# Security Rotation Runbook

Use this after any accidental exposure of Firebase or Google Cloud credentials.

## Immediate actions

1. Rotate the Firebase service account key in Google Cloud IAM.
2. Rotate the Firebase web API key in Google Cloud Console.
3. Replace all affected Vercel environment variables.
4. Replace your local `.env` values.
5. Delete the old downloaded service-account JSON file after replacement.

## Rotate service account key

1. Open Google Cloud Console.
2. Go to `IAM & Admin` -> `Service Accounts`.
3. Open the Firebase admin service account used by this project.
4. Create a new JSON key.
5. Copy the new values into these variables:
   `FIREBASE_PROJECT_ID`
   `FIREBASE_CLIENT_EMAIL`
   `FIREBASE_PRIVATE_KEY`
6. Disable or delete the old compromised key.

## Rotate web API key

1. Open Google Cloud Console.
2. Go to `APIs & Services` -> `Credentials`.
3. Create a replacement browser key or regenerate the existing key if your workflow supports it.
4. Restrict the key by HTTP referrer.

Recommended referrers:

- `https://civil-web.vercel.app/*`
- `https://your-custom-domain/*`
- `http://localhost:*/*` for local testing only

5. Restrict API usage to Firebase-related APIs required by your app.
6. Replace these values:
   `FIREBASE_WEB_API_KEY`
   `FIREBASE_WEB_AUTH_DOMAIN`
   `FIREBASE_WEB_PROJECT_ID`
   `FIREBASE_WEB_STORAGE_BUCKET`
   `FIREBASE_WEB_MESSAGING_SENDER_ID`
   `FIREBASE_WEB_APP_ID`

## Replace Vercel environment variables

Set or update these in Vercel Project Settings -> Environment Variables:

- `CMS_ADMIN_TOKEN`
- `CMS_SESSION_SECRET`
- `CMS_ALLOWED_EMAILS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_DATABASE_URL` if used
- `FIREBASE_WEB_API_KEY`
- `FIREBASE_WEB_AUTH_DOMAIN`
- `FIREBASE_WEB_PROJECT_ID`
- `FIREBASE_WEB_STORAGE_BUCKET`
- `FIREBASE_WEB_MESSAGING_SENDER_ID`
- `FIREBASE_WEB_APP_ID`

For `FIREBASE_PRIVATE_KEY`, store it as a single line with escaped `\n` characters.

## Firebase console checks

1. Authentication -> Sign-in method:
   Enable `Email/Password` and `Email link (passwordless sign-in)`.
2. Authentication -> Settings -> Authorized domains:
   Add `civil-web.vercel.app` and your custom domain.
3. Firestore:
   Confirm the database exists and the project is correct.

## Local cleanup

1. Update local `.env` with the rotated values.
2. Remove the old downloaded service-account JSON file.
3. Clear any copied secrets from notes, chat logs, and screenshots where possible.

## Verification

1. Open `/elitech/admin/`.
2. Send an email sign-in link.
3. Complete the sign-in link flow.
4. Confirm dashboard access is granted.
5. Save a CMS change and confirm it persists.