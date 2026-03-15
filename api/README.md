# Backend API Setup

This project now includes a CMS backend endpoint:

- `GET /api/cms/content`: Read live CMS configuration.
- `PUT /api/cms/content`: Save CMS configuration (requires bearer token).

## Required Environment Variables

Set these in Vercel project settings:

- `CMS_ADMIN_TOKEN`: Secret token used by the admin panel for saving.

Optional persistent storage (recommended):

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If KV variables are missing, writes fall back to temporary server storage (`/tmp`) and will not survive cold starts or redeploys.

## Admin Panel Flow

1. Open `/elitech/admin/`.
2. Paste the same token value from `CMS_ADMIN_TOKEN`.
3. Click **Save Token In Browser**.
4. Edit content and click **Save To Server**.

The website runtime reads from `/api/cms/content` first, then falls back to static `/elitech/cms/content.json`.
