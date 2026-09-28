# Septa — media and mobile cleanup

This is a complete runnable site with its compiled frontend, plus an updater for your existing installation. The visual style, colours and typography are retained.

## Install into the site you already run

1. Stop the running Septa server in its Terminal with Control-C.
2. Extract `septa-polish-update.zip` into Downloads.
3. Run:

```bash
bash ~/Downloads/septa-polish-update/update-and-run.sh
```

The updater looks for your existing Septa folder in Downloads. If there is more than one, select the folder you normally run. It backs up replaced source files, preserves `.env`, uploaded media, virtual environments and MongoDB, then starts the site. Keep the Terminal open. Visit http://localhost:8000/admin and refresh with Command-Shift-R.

The admin header should say **Media & mobile update · 29 September 2026**. This confirms you are running the rebuilt interface.

If you have no existing installation, the full site is inside `site`. Run `bash ~/Downloads/septa-polish-update/site/launch-local.sh`. Before doing this, recover your old `.env` and `backend/uploads` if available. MongoDB holds content and accounts; the old uploads folder holds local photos and videos. A new folder cannot recreate deleted media.

## What changed

- Prominent aspect ratio badges and complete, self-contained AI prompts on image fields, including Website Studio, testimonials, social previews and brand logos.
- New image files are checked in the browser and decoded/checked again by the upload API. Newly changed image URLs are dimension-checked in the admin before saving. Broken URLs produce a field-specific error.
- Portraits: 4:5; client portraits and logos: 1:1; covers, hero images, galleries, video posters and drawing images: 16:9; social previews: 1.91:1. Exact ratios allow only pixel rounding. Field guides show recommended export dimensions. PDFs retain their original sheet shape; pad drawing images without cropping technical content.
- Logo prompts demand real transparency. New logo file uploads reject fully opaque backgrounds. Website-generated white tiles are removed from profile headers, and the logo aligns with the portrait/name. An existing white rectangle inside an image must be removed from that asset and re-uploaded.
- Partner **Highlights** has its own admin tab. Up to four short, individually visible facts save correctly; a missing backend update field was dropping them previously. Re-enter and save any facts that were previously lost.
- The Rooted in Kerala / coverage section is removed from defaults, saved page output and available section choices. Old stored records are not destructively deleted.
- Mobile admin project rows have separate identity and action areas; admin navigation scrolls horizontally. Project credits use spaced role/name blocks. The mobile Call/WhatsApp bar is replaced by a compact contact button that contracts while scrolling down; tapping opens both options.
- Homepage projects have previous/next controls, touch swiping, crossfades and pause controls. Manual navigation pauses automatic advance; reduced-motion preferences are respected. Video slides wait for interaction rather than advancing while playing.

## Set your homepage projects

Go to **Admin → Projects → Edit → Homepage**. Check **Include in the homepage carousel**, set the display order, and optionally use the project film. Save the project. Only reviewed, published projects appear; up to six are shown. Their existing covers/videos are reused, and each caption links to the correct project.

Explicit project selections take priority. Without them, Website Studio custom slides are used; otherwise published project covers provide the fallback carousel. If there is only one eligible slide, navigation controls are hidden.

## Verification and limits

Production frontend build, frontend interaction/unit tests, backend contract/unit tests and production-bundle integration checks are included in this release's verification. The remote preview browser could not open the workspace, so mobile visual verification on a real device remains to be done after installation. No changes have been applied to your Mac or hosted site remotely.

Existing unchanged photos are retained, even if their ratios do not meet the new rules. New/replaced files and changed URLs must meet the requirements. External image URLs are checked by the browser; upload files directly for server-side byte validation and reliable hosting. The new image validator requires Pillow, installed automatically by the launcher when missing.
