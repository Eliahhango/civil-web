# Backend API Setup

This project now includes a CMS backend endpoint:

- `GET /api/cms/content`: Read live CMS configuration.
- `PUT /api/cms/content`: Save CMS configuration (requires active session or bearer token).
- `POST /api/cms/login`: Authenticate and create secure admin session cookie.
- `GET /api/cms/session`: Check if admin session is authenticated.
- `POST /api/cms/logout`: Clear admin session cookie.
- `POST /api/cms/firebase-login`: Verify Firebase ID token and create admin session cookie.
- `GET /api/cms/firebase-web-config`: Returns Firebase web config from server environment for admin auth.

## Storage Order

CMS content is read and written in this order:

1. Firebase Firestore (`cms/content` document)
2. Vercel KV (if configured)
3. Temporary server storage (`/tmp`)
4. Static fallback file (`/elitech/cms/content.json`) for reads

## Required Environment Variables

Set these in Vercel project settings:

- `CMS_ADMIN_TOKEN`: Secret token used by the admin panel for saving.
- `CMS_SESSION_SECRET` (optional, recommended): Secret used to sign session cookies.
- `CMS_ALLOWED_EMAILS`: Comma-separated admin email allowlist for Firebase Email Link login.
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (single-line value with escaped `\\n`)
- `FIREBASE_STORAGE_BUCKET` (optional)
- `FIREBASE_DATABASE_URL` (optional)

Optional persistent storage (recommended):

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If KV variables are missing, writes fall back to temporary server storage (`/tmp`) and will not survive cold starts or redeploys.

If Firebase variables are present, Firestore becomes the primary persistent backend.

## Configure Firebase Email Link Auth

1. Firebase Console -> Authentication -> Sign-in method.
2. Enable `Email/Password` provider.
3. Enable `Email link (passwordless sign-in)`.
4. Add your deployment domain to Authorized Domains (for example `civil-web.vercel.app`).
5. Ensure `/elitech/admin/` is reachable over HTTPS.

The admin page includes passwordless email-link login and exchanges the Firebase ID token with `/api/cms/firebase-login` to create the secure CMS session.
Firebase web config is now loaded at runtime from `/api/cms/firebase-web-config` so the repository does not contain live client configuration values.

See [SECURITY_ROTATION.md](SECURITY_ROTATION.md) for the credential rotation and recovery checklist.

## Admin Panel Flow

1. Open `/elitech/admin/`.
2. Paste the same token value from `CMS_ADMIN_TOKEN`.
3. Click **Login** to create secure session.
4. Edit content and click **Save To Server**.

The website runtime reads from `/api/cms/content` first, then falls back to static `/elitech/cms/content.json`.

## Hybrid Deployment

For `frontend on Vercel` and `backend on Firebase`, set [elitech/cms/backend.json](elitech/cms/backend.json) to the Firebase API base URL, for example:

`https://us-central1-your-firebase-project.cloudfunctions.net/api`

Also set `CMS_ALLOWED_ORIGINS` in Firebase Functions environment to include your Vercel domain.
