# Septa Group deployment

For the latest release, start with [UPDATE-NOTES.md](UPDATE-NOTES.md). The downloadable bundle includes the frontend build. From the extracted folder, `bash start-local.sh` runs the complete site with your existing environment and MongoDB configuration.

Draft collaborator approval links and their responses are documented in [COLLABORATOR-REVIEWS.md](COLLABORATOR-REVIEWS.md). Create externally shared links only after the HTTPS production or staging origin is configured; localhost links are not reachable by collaborators.

The repository ships as one FastAPI image. The image builds the React bundle and FastAPI serves the API, approved HTML metadata, sitemap, uploads and the SPA from the same origin. This avoids a crawler receiving an empty client-only shell.

## Required production configuration

Copy `.env.example` into the platform’s secret manager. Do not commit a `.env` file.

| Variable | Required | Purpose |
|---|---:|---|
| `APP_ENV=production` | Yes | Enables production guards and secure cookies |
| `SITE_URL=https://your-confirmed-domain` | Yes | Canonical URLs, sitemap and CORS origin |
| `ALLOW_INDEXING=false` | Initially | Keep search engines out until content is approved; set `true` only after launch review |
| `CORS_ORIGINS=https://your-confirmed-domain` | Yes | Explicit trusted browser origins |
| `SECRET_KEY` | Yes | Unique random value, at least 32 characters |
| `MONGO_URL`, `DB_NAME` | Yes | Persistent MongoDB database |
| `BOOTSTRAP_ADMIN_EMAIL` | First boot | Exact Google Workspace address of the initial owner; no website password is used in production |
| `ADMIN_AUTH_MODE=google` | Yes | Disables the site's password, email code, recovery and password change login paths |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN` | Yes | Workspace OpenID Connect and allowed domain |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL` | Yes for enquiries | Durable lead notification and confirmation delivery |
| `STORAGE_PROVIDER=R2` or `S3` | Yes for media | Persistent media; configure credentials, endpoint and HTTPS CDN URL |
| `PUBLIC_CDN_BASE_URL` | Yes for media | Public URL for approved files |

The service fails early if production lacks a secret key, HTTPS site origin, explicit CORS origin or Google Workspace settings. Media upload fails when cloud storage is unavailable in production; it never silently writes to ephemeral disk.

## Recommended production layout

Deploy the existing `Dockerfile` as one paid Render web service in a region near your primary audience and database. Use MongoDB Atlas for the content and leads database, Cloudflare R2 with a custom media domain for approved uploads, and Resend for enquiry notifications. Set the exact `SITE_URL` as a Render custom domain and use the matching domain for the Google OAuth redirect. Keep every credential in Render environment settings, never in Git or the ZIP. Add only Render's outbound address ranges to the Atlas network access list, create a database user limited to Septa's database, and configure Atlas backups. Before cutover, export the current local MongoDB records and copy the existing approved `backend/uploads` objects to R2 while preserving the media URLs or rewriting those references. Verify a restore of the backups and a full login, upload, enquiry and profile flow on staging.

Render's local filesystem is temporary across deploys. A persistent disk is an alternative for a single instance, but R2 is the safer fit for this site's media uploads and future scaling. Never deploy local MongoDB or LOCAL storage to an ordinary ephemeral web service.

Create a Google Cloud OAuth **Web application** client with an authorized redirect URI exactly `https://your-confirmed-domain/api/admin/google/callback`. Set its client ID and secret only in your hosting provider's secret manager. Use the actual Workspace domain for `GOOGLE_WORKSPACE_DOMAIN`; the domain alone never grants access. Before switching an existing database to Google mode, use the working local admin account to add your real Workspace email as an enabled **owner** in **Admin accounts**. `BOOTSTRAP_ADMIN_EMAIL` creates an owner only when the database has no admins; it cannot relabel an existing `you@example.com` record. Other staff must also be added explicitly by an owner. Google sign-in binds each account to its stable Google subject on first use, and disabling an admin account revokes its session. Enforce two-step verification or passkeys for the admin users in the Google Workspace Admin console before publishing. Test one owner sign-in before changing DNS, then disable old non-Workspace admin accounts.

## Run locally

```bash
cp .env.example .env
# Set MONGO_URL and a local owner password
cd frontend && npm ci --legacy-peer-deps && npm run build
cd ../backend && python -m uvicorn server:app --reload --port 8000
```

Run the commands from the repository root. On macOS, use `python3` if `python` is not installed.

The local server uses a generated development signing key if `SECRET_KEY` is omitted. It does not seed demo content unless `SEED_DEMO_DATA=true` is explicitly set.

## Release sequence

1. Deploy with `ALLOW_INDEXING=false` and confirm `/health` returns `200`.
2. Sign in at `/admin`, open **Launch readiness**, and resolve storage, email, frontend build and content review items.
3. Enter real contact details in Site Settings. Add project leaders, partners, projects, credits, images and testimonials. New publications require review. Legacy collaborators already marked published remain accessible; review their factual details and media permissions in admin.
4. Submit a real staging enquiry. Confirm it is visible in Leads, notification state becomes `sent`, and the follow-up owner/date can be saved. Failed notifications remain retryable.
5. Check `/robots.txt`, `/sitemap.xml`, page source for canonical/description/schema, mobile navigation, keyboard focus and a project preview.
6. Set `ALLOW_INDEXING=true` only after the domain, content permissions, media credits and enquiry delivery have been approved.

The initial database is deliberately empty of public proof. The old JSON/demo fixtures are available only through an explicit development migration flag and are marked unreviewed, so they cannot appear on a production site.
