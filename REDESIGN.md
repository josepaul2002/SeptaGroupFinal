# Septa layout update + Website Studio — September 2026

This corrected update keeps Septa’s established visual style and adds editable page sections to Home, About and Services. The original black/ivory/grey palette, Space Grotesk and Inter typography, white buttons, two-tone wordmark and large footer wordmark are retained. The homepage uses an admin-selected image or published project media, rather than a new decorative illustration. The concise content structure, visual operating areas and admin controls remain. It includes a prebuilt frontend in the download, so you do not need to rebuild to see the redesign.

## View the design immediately

From this extracted folder:

```bash
node preview.cjs
```

Open http://localhost:4173. This is a visual preview with starter content. Editing, stored content, uploads and enquiry submission require the Python server below. No fake projects, names, metrics or operating districts are inserted.

## Update your working local installation

1. Keep your current working folder as a backup. Stop its server with Control-C.
2. Extract this download into its own folder. Copy your existing root `.env` into the new folder, or your existing `backend/.env` into the new `backend` folder. Keep the same `MONGO_URL` and `DB_NAME` to use your existing database.
3. If you use local uploads, copy your existing `backend/uploads` directory into the new `backend/uploads`, or keep the absolute `LOCAL_UPLOAD_DIR` pointing to the original files. Do not delete your original uploads.
4. Keep MongoDB running, then run from the new folder:

```bash
bash start-local.sh
```

5. Open http://localhost:8000 and http://localhost:8000/admin. Use your existing admin login.

The script creates a local Python environment and installs backend dependencies if needed. It uses the bundled frontend build explicitly, so an old `FRONTEND_BUILD_DIR` will not keep displaying the old website. No database content is reset or automatically published.

## Edit the website

Open **Admin → Website studio**. Choose Home, About, What We Do, Projects, Collaborators, Contact or Project Leaders.

- **Opening section:** small heading, title, introduction, background, image upload, image description, crop focal point, primary and secondary actions.
- **Page structure:** add, duplicate, hide, delete or reorder sections. Section types include text/image, capability cards, projects, locations, process, people, verified figures, questions, testimonials and calls to action.
- **Where we work:** edit the centre label, add actual operating areas and descriptions, and optionally match a location to published projects. The default artwork is an abstract coverage graphic, not a geographic map. Upload an approved map to replace it. If no locations are entered, it uses the operating districts in Site Settings.
- **Shared content:** capability sections can reuse What We Do cards; people, projects and testimonials read their published records. Empty record sections disappear. Select specific projects/people and set record limits.
- **Language:** switch the editor between English and Malayalam. Enable the visitor language selector in Site Settings when translations are ready. Global navigation labels are edited separately.
- **Preview:** inspect unsaved changes at desktop or mobile width. On listing and contact pages, the preview shows the editable opening and additional sections; the existing listing/form follows on the live page.
- **Save draft:** the last reviewed published version stays live. **Publish changes** requires the review checkbox and a publisher/owner account. Editing content clears its review checkbox.
- **Version history:** load an earlier saved record into the editor as a draft. Publish only when ready. **Unpublish custom content** returns that page to the starter layout.
- **Search & social:** edit title, description, sharing image and noindex setting. Blank fields derive from page content. Published content supplies both server HTML and client metadata. Noindex pages are excluded from the sitemap.

**Site Settings → Brand & Navigation** controls the name, logo URL, global action, menu labels, destinations, order and header/footer visibility. Contact details and enquiry dropdowns remain under Site Settings. Verified figures now belong to Website Studio sections.

Project and collaborator detail content remains in their existing editors. System messages and the privacy notice still live in code; this update does not turn every interface label into a CMS field.

## Existing content and routes

Legacy About/Services blocks are converted on read, without changing the stored record. The first save retains the previous complete record in version history. New drafts preserve the public snapshot. The old Solution Packs URL redirects to What We Do. Project filters now use verified contributor credits.

The export includes projects, partners, leaders, testimonials, page designs, page revisions and site settings. This content export is not a complete MongoDB or media backup.

## Verification

```bash
cd frontend
CI=true npm run build
cd ..
node scripts/verify-frontend.cjs
python3 -m unittest discover -s backend/tests -p test_page_design_unit.py -v
```

The frontend test executes the production bundle in JSDOM using controlled API fixtures: page rendering, coverage selection, filter links, admin editing, draft payload, preview handoff and malformed API fallbacks. It does not verify browser pixels or a real backend.

The isolated Python tests cover page validation, legacy conversion, draft snapshots, publication/unpublication and safe initial HTML. The complete FastAPI/MongoDB tests and visual browser checks must still be run in an environment with the required dependencies and a reachable server. Before live deployment, verify owner/editor permissions, image upload, a real publish/draft/reload cycle, and an enquiry using the running server.
