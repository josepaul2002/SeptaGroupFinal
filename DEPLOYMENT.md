# Septa Group deployment

For the September redesign and existing-installation upgrade steps, start with [REDESIGN.md](REDESIGN.md). The downloadable redesign bundle includes the frontend build. From the extracted folder, `node preview.cjs` starts a visual preview; `bash start-local.sh` runs the complete site with your existing environment and MongoDB configuration.

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
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` | First boot | Creates the initial owner; password must be at least 12 characters |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL` | Yes for enquiries | Durable lead notification and confirmation delivery |
| `STORAGE_PROVIDER=R2` or `S3` | Yes for media | Persistent media; configure credentials, endpoint and HTTPS CDN URL |
| `PUBLIC_CDN_BASE_URL` | Yes for media | Public URL for approved files |

The service will fail early if production has no secret key, an unsafe site URL, a wildcard CORS origin or no bootstrap password. Media upload intentionally fails when cloud storage is unavailable in production; it never silently writes to ephemeral disk.

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
3. Enter real contact details in Site Settings. Add project leaders, partners, projects, credits, images and testimonials. Each record must be marked reviewed before it can be published.
4. Submit a real staging enquiry. Confirm it is visible in Leads, notification state becomes `sent`, and the follow-up owner/date can be saved. Failed notifications remain retryable.
5. Check `/robots.txt`, `/sitemap.xml`, page source for canonical/description/schema, mobile navigation, keyboard focus and a project preview.
6. Set `ALLOW_INDEXING=true` only after the domain, content permissions, media credits and enquiry delivery have been approved.

The initial database is deliberately empty of public proof. The old JSON/demo fixtures are available only through an explicit development migration flag and are marked unreviewed, so they cannot appear on a production site.
