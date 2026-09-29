# Septa homepage highlights, collaborator fixes and Render setup

## This release: 29 September 2026

- **Home:** Website Studio now includes a rolling highlights strip above Selected projects. In **Admin → Website studio → Home → Septa in numbers**, enter each verified figure as the item title (for example `25+`) and the short label as subtitle, then publish. It stays hidden until at least one complete highlight is entered. Reduce motion keeps the figures stationary, and the figures appear in search-readable HTML.
- **Collaborators:** Fixed a browser-only crash for existing profiles with linked projects: the page referenced an unimported text helper. Also accepts missing legacy media and malformed legacy lists. The listing now keeps category/search in its URL, and the profile's Ecosystem link returns to those filters.
- **Email:** New-site defaults point at `paul@septa.one` and name Paul Joseph. Existing database contact settings are preserved; update them in **Admin → Contact & settings → Contact Info** if they still point elsewhere. Configure outgoing email and owner identity directly in Render. Create any Workspace aliases before advertising them.
- **Hosting:** See `site/RENDER-START.md` for the exact Blueprint, domain, email, database, storage and OAuth sequence. GitHub must contain this new release before Render can deploy it.

## New: collaborator approval links

Admin → Partners now creates a seven-day, revocable review link for each unpublished collaborator. The recipient can inspect the profile and send an approval or request changes. The admin sees the response. Once a review has been requested, publishing requires approval of that exact saved draft; changing it invalidates the link. Review links are excluded from search and their tokens are stored only as hashes. A link holder's name and optional email are self-declared; verify the response directly before treating it as formal permission. See `COLLABORATOR-REVIEWS.md`.

Create links for external people only after deployment on a real HTTPS origin. Links created on `localhost` are accessible only on that Mac. The release ZIP does not include your local MongoDB content or uploaded media; migrate both before using the hosted site.

## Local profile and image recovery

A Mac access log showed collaborator profile and API responses returning HTTP 200 while their `/uploads/images/...` requests returned HTTP 404. The published profiles were reachable, but their stored image URLs pointed to files missing from the running installation. This updater now searches older Septa installations in Downloads and macOS Trash, merges missing files into the active upload folder, and never overwrites an existing file. It reports how many files it recovered. If no copies remain on the Mac, reupload the original images in admin; the website ZIP does not contain personal media.

The actual collaborator URL is `/ecosystem`, with profiles at `/ecosystem/<slug>`. A previous instruction incorrectly used `/collaborators`; that path now redirects to the correct page.

The updater also searches for an installed Septa site when an explicitly supplied folder no longer exists. Choose the folder you actually run, preferably the one containing your working `.env`. If the server is already running, stop it with Control-C before the update, then keep the new Terminal session open.

29 September 2026. Complete source, compiled frontend and updater included. Builds on the SEO foundation, Contact and phone-first releases without changing Septa's font family or colour palette.

## Install on your Mac

1. Stop the existing website server with Control-C in its Terminal.
2. Download `septa-home-highlights-deploy.zip` and double-click it to extract into Downloads.
3. Run:

```bash
bash ~/Downloads/septa-home-highlights-deploy/update-and-run.sh ~/Downloads/septa-polish-update/site
```

The command names the installed folder that previously held your working `.env`. If you moved the active installation, replace only the final folder path with the one containing its `.env` and `backend/uploads`. Passing the path avoids the numbered-folder prompt.

Keep Terminal running, open http://localhost:8000/admin, and refresh. In Website Studio, choose **Home** and edit **Septa in numbers**.

The updater backs up replaced source/build files first. It preserves local settings, existing uploaded files, the Python environment and MongoDB. Do not delete your existing website folder or MongoDB files. If no installed site is found, the included full website can be started, but your original data still depends on the correct local settings.

## Changes

| Area | Fix or addition |
|---|---|
| Homepage | Projects advance past video slides. Films open on demand. Swipe and compact previous/next/pause controls; automatic motion respects reduced-motion and site settings. |
| About | Editable introduction, story, milestones, sections, figures, images and film. Deleted story sections no longer reappear after saving. Editorial guidance replaces redundant hero-button fields. No company history or figures are invented. |
| Services | Approved service/location pages appear before the final contact CTA in the interactive layout. |
| Project listing | All filters persist in the URL. Mobile Show results & close action, result count and accessible selected states. Missing facts no longer leave stray separators or empty challenge labels. |
| Project details | Compact selector for films, drawings, visualisations and tours. Hiding media also hides its opening photograph. Repeated scope removed; empty client-type fields no longer match unrelated projects. |
| Profiles | Partner highlights and useful links precede long galleries on smaller screens. Stronger leadership heading hierarchy, regular-weight detail lists, and full-width content when no portrait exists. |
| Media | Native playback controls for uploaded videos; external players load on demand. Partner dialogs support Escape, focus containment and return focus. |
| Uploads | Wrong-ratio static images open a crop-or-pad preview with position controls. Original files unchanged. Upload progress and errors visible; re-select a failed file to retry. Tiny images, unsupported formats and wrong-ratio videos still need a suitable source. |
| Image delivery | Bounded, cached WebP variants for local uploads, with original-image fallback. Remote/cloud URLs remain untouched; production CDN transformations require separate configuration. |
| Interaction | Larger testimonial targets, motion-preference support and improved contrast for key secondary labels. |
| Loading | Brief public-request deduplication; no preview caching. Retry states distinguish connection failures from missing content. |
| Admin | Unsaved-work warnings in project/partner editors, Website studio, search pages, settings and maintenance, on supported close/tab actions and browser exit. |
| Collaborator media editor | Always-visible remove buttons for gallery, extra card images and videos, plus a clear action for primary media fields. These remove media from the profile draft; they do not permanently erase the underlying uploaded file. |
| Collaborator profiles | Previously published partners open from the listing, homepage, project credits and direct profile URLs even if their old records lack the newer review flag. Drafts and archived records stay hidden. New publications still require review. |
| Admin sign-in | Production requires Google Workspace OpenID Connect. Password and email-code sign-in, password changes and site password recovery are disabled in that mode. Admin email allowlist, Workspace domain and stable account identity are checked; existing local development keeps its password login. |
| Production hardening | HTTP security policy and secure cookies, nonpublic API documentation, reduced Google admin session lifetime, and Google Workspace account binding. Updated the vulnerable Python framework, JWT, environment and upload-parser packages. The current Python requirements audit and production npm audit report no known findings. |
| Search pages | Drafts retain the published snapshot. Authenticated preview, section headings, image/alt text, version history, load-as-draft, publisher-only unpublishing and stale-edit checks. |
| Maintenance | Owners/publishers can temporarily close one exact URL, customize its notice and reopen it. Other pages/admin remain available. Public requests return HTTP 503 with Retry-After; authenticated editor previews work. |
| Page overhead | Duplicate font loading and old third-party editor/telemetry bootstraps removed from production HTML. |

## Where to edit

- **Admin → Website studio → About:** edit and arrange the company story, preview, save a draft or publish.
- **Admin → Projects → Edit → Homepage:** choose featured projects, order and film use.
- **Admin → Page maintenance:** choose the exact URL, enable its toggle, edit the notice and save. Clear the toggle and save to reopen.
- **Admin → Search pages:** draft, preview, inspect history and publish reviewed service/location copy.

Closing `/projects` does not close all individual project pages. Maintenance is not privacy: previously public media and APIs can remain accessible. Use drafts and publication permissions for private content. Reopen pages promptly; prolonged unavailability can affect search visibility.

## Verification and limitations

- Backend tests cover permissions, exact-page maintenance, reopening, public HTML status/headers, authenticated previews, live snapshots, stale-edit rejection, About removal and safe local resizing.
- Frontend tests cover carousel progression/pause, on-demand video/native controls, keyboard focus, media selection and unsaved warnings, alongside prior SEO/contact/media tests.
- Production build and compiled-bundle checks exercise public routes, forms, admin editing, uploads, maintenance and preview behavior with controlled fixtures.
- These are source/API/DOM checks, not screenshots. The available browser could not open the local site. Actual iPhone layout, real uploads, production CDN behaviour and the Mac installation still need checking after installation. No real-user MongoDB content was changed.
- Existing multilingual editorial fields remain. Complete Malayalam interface translation and human review are still outstanding.
- Shared interaction styles are grouped in a scoped stylesheet; complete legacy-CSS consolidation remains separate cleanup. This is not a perfect accessibility, performance or SEO-score claim.
- The older Create React App build tools still report advisories. They run only in the build stage and are not copied into the production Python image. Replacing that build chain remains a release maintenance task.

## Quick acceptance check

1. On your phone, check Home image/film rotation, swipe and film opening/closing.
2. Filter projects, close the mobile controls, refresh and confirm filters persist.
3. Test project photos, film, drawings and tour where configured.
4. Check partner/leader long names, highlights and a leader without a portrait.
5. Upload a wrong-ratio image into a draft; review crop/padding before saving.
6. Place About in maintenance, check visitor and authenticated preview, then reopen.
7. Save a draft of a published search page; confirm public copy stays unchanged until publishing.

Earlier international Contact controls, testimonial links, collaborator logos, AI image prompts, SEO metadata and reviewed-publication requirements remain included. Rankings and AI citations cannot be guaranteed by code changes.

## Production authentication and hosting

For a public launch, configure the Google OAuth Web client and the exact callback URL documented in `site/DEPLOYMENT.md`. Set `APP_ENV=production`, `ADMIN_AUTH_MODE=google`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN`, the real HTTPS `SITE_URL`, and an allowlisted owner email in the host's secret settings. Enforce two-step verification for those Workspace accounts in Google Admin. The code cannot enable Google's organization policy or create OAuth credentials for you. The local Mac remains in development password mode until you explicitly configure those settings.

Host this Docker service on a paid Render web service with MongoDB Atlas and Cloudflare R2 for media, all in compatible nearby regions. Add the service's outbound address ranges to Atlas network access, enable database backups, and keep media outside Render's temporary local filesystem. See `site/DEPLOYMENT.md` before changing DNS. Existing local media must be migrated to R2 before launch; the ZIP does not contain files from your previous `backend/uploads`.
