# Backend API Setup

This project now includes a CMS backend endpoint:

- `GET /api/cms/content`: Read live CMS configuration.
- `PUT /api/cms/content`: Save CMS configuration with a Firebase ID token.
- `GET /api/cms/firebase-web-config`: Returns Firebase web config from server environment for admin auth.

## Storage Order

CMS content is read and written in this order:

1. Firebase Firestore (`cms/content` document)
2. Vercel KV (if configured)
3. Temporary server storage (`/tmp`)
4. Static fallback file (`/elitech/cms/content.json`) for reads

## Required Environment Variables

Set these in Vercel project settings:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (single-line value with escaped `\\n`)
- `FIREBASE_DATABASE_URL` (optional)

Optional persistent storage (recommended):

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If KV variables are missing, writes fall back to temporary server storage (`/tmp`) and will not survive cold starts or redeploys.

If Firebase variables are present, Firestore becomes the primary persistent backend.

This project is configured to work with Firestore only. Firebase Storage is not required for the current CMS and admin flow.

## Configure Firebase Admin Auth

1. Firebase Console -> Authentication -> Sign-in method.
2. Enable `Email/Password` provider.
3. Enable `Email link (passwordless sign-in)` if you want passwordless login.
4. Add your deployment domain to Authorized Domains (for example `civil-web.vercel.app`).
5. Ensure `/elitech/admin/` is reachable over HTTPS.

The admin page supports Firebase email-link login and Firebase email/password login. After sign-in, it sends the signed-in user's Firebase ID token directly to `PUT /api/cms/content`.
Firebase web config is now loaded at runtime from `/api/cms/firebase-web-config` so the repository does not contain live client configuration values.

See [SECURITY_ROTATION.md](SECURITY_ROTATION.md) for the credential rotation and recovery checklist.

## Admin Panel Flow

1. Open `/elitech/admin/`.
2. Sign in with email link (send link and complete from email) or with email/password.
4. Edit content and click **Save To Server**.

The website runtime reads from `/api/cms/content` first, then falls back to static `/elitech/cms/content.json`.

## Vercel Deployment

For `frontend and backend on Vercel`, keep [elitech/cms/backend.json](elitech/cms/backend.json) as:

`{ "apiBaseUrl": "" }`

That makes the site use the same-origin Vercel API routes:

- `/api/cms/content`
- `/api/cms/firebase-web-config`

Set the required Firebase and CMS variables in Vercel Project Settings -> Environment Variables. The server-side Vercel API routes read those variables directly.

## Hybrid Deployment

For `frontend on Vercel` and `backend on Firebase`, set [elitech/cms/backend.json](elitech/cms/backend.json) to the Firebase API base URL, for example:

`https://us-central1-your-firebase-project.cloudfunctions.net/api`

Also set `CMS_ALLOWED_ORIGINS` in Firebase Functions environment to include your Vercel domain.
