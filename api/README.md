# Backend API Setup

This project now includes a CMS backend endpoint:

- `GET /api/cms/content`: Read live CMS configuration.
- `PUT /api/cms/content`: Save CMS configuration (requires active session or bearer token).
- `POST /api/cms/login`: Authenticate and create secure admin session cookie.
- `GET /api/cms/session`: Check if admin session is authenticated.
- `POST /api/cms/logout`: Clear admin session cookie.

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

## Admin Panel Flow

1. Open `/elitech/admin/`.
2. Paste the same token value from `CMS_ADMIN_TOKEN`.
3. Click **Login** to create secure session.
4. Edit content and click **Save To Server**.

The website runtime reads from `/api/cms/content` first, then falls back to static `/elitech/cms/content.json`.
