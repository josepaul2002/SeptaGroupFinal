# Septa Group Website — Product Requirements Document

## Problem Statement
Transform the Septa Group Kerala construction company website from a brochure site into a "Delivery Studio + Ecosystem" platform with full CMS, partner media, bilingual content, and admin-configurable settings.

## Architecture
```
/app/
├── backend/
│   ├── server.py                 # FastAPI: all endpoints
│   ├── models/schemas.py         # Pydantic: Partner, Project, Settings, PageContent, Lead
│   ├── services/email_service.py # Resend integration (MOCKED)
│   ├── services/storage_service.py # S3/local upload (MOCKED)
│   └── utils/auth.py             # JWT auth
├── frontend/src/
│   ├── components/
│   │   ├── admin/                # LeadsTab, ProjectsTab, ProjectForm, PartnersTab, PartnerForm, SettingsTab, TestimonialsTab
│   │   ├── ImageGallery.jsx, VideoPlayer.jsx, Model3DViewer.jsx, PlanDrawings.jsx
│   │   ├── LanguageToggle.jsx    # Respects content_language_mode from site_settings
│   │   ├── Navbar.jsx            # English-only labels
│   │   └── Footer.jsx            # Settings-driven contact info
│   ├── hooks/useApi.js           # useSiteSettings, usePageContent, usePartners, etc.
│   └── pages/
│       ├── AdminPage.jsx         # Sidebar layout, modular tabs
│       ├── AboutPage.jsx         # CMS-driven: metrics, timeline, proofs
│       ├── ServicesPage.jsx      # Expandable services + comparison block
│       ├── ContactPage.jsx       # Settings-driven form, honeypot, partner_ref
│       ├── EcosystemPage.jsx     # Partner grid with card_image, badges, search
│       ├── PartnerProfilePage.jsx # /ecosystem/[slug] detail page
│       ├── ProjectCaseStudyPage.jsx # Tabbed: Story|Design|Delivery|Media|Partners
│       └── SolutionPacksPage.jsx
```

## Implemented Features (all tested ✓)

### SCOPE A — Partners/Ecosystem
- ✓ Partner model: slug, name_en/ml, category, relationship_type, specialties, sort_order, is_featured, media (card_image, logo_image, hero_image, gallery_images), website/instagram/email/phone, bio_short/long
- ✓ Admin Partner form: 3 tabs (Basic Info | Content | Media), upload support, published-without-card-image warning
- ✓ Ecosystem page: 16:9 card images, relationship badges (color-coded), category filters, search, specialties tags
- ✓ Partner Detail page (/ecosystem/[slug]): hero, logo, bio, gallery carousel, sidebar (relationship, specialties, links), "Request an Introduction" CTA → Contact page with partner preselected
- ✓ Partner migration/backfill for existing data

### SCOPE B — Bilingual Content Strategy
- ✓ Nav/buttons stay English always
- ✓ Bilingual fields ({en, ml}) for content blocks across all pages
- ✓ Admin Settings: Content Language Mode (english_only / malayalam_primary / toggle)
- ✓ Fallback: if Malayalam empty → show English
- ✓ Language toggle only visible in "toggle" mode

### SCOPE C — About Page
- ✓ Hero with image panel
- ✓ Proof strip metrics (CMS: admin editable via /api/pages/about)
- ✓ Septa Standard 6-step timeline (CMS)
- ✓ Proof callouts with project links (CMS)
- ✓ Values section

### SCOPE D — Services Page
- ✓ Expandable service items: summary, Best For, Not For, Deliverables, Timeline, Related Project link
- ✓ Comparison block: Traditional Contractor vs Septa (CMS: /api/pages/services)
- ✓ CTA banner: "Not sure which service?" → Contact

### SCOPE E — Settings & Contact
- ✓ Admin > Settings > Contact Info: phone, email, address, WhatsApp, map link, districts, footer tagline
- ✓ Admin > Settings > Enquiry Form: project_types, budget_ranges, timeline_ranges, lead_notification_email
- ✓ Contact page pulls all settings from API (no more placeholders)
- ✓ Footer pulls contact data from API
- ✓ Leads: honeypot spam protection, 5/min rate limit
- ✓ Leads: partner_ref, service_ref, budget_range, timeline stored
- ✓ Lead CSV export in admin

## What's MOCKED
- **Resend Email**: placeholder key — emails logged to DB, not sent
- **Cloudflare R2**: placeholder keys — local fallback at /app/uploads

## Key Credentials
- Admin: admin@septa.group / septa2024admin
- Preview: https://septa-cms-preview.preview.emergentagent.com

## Remaining Backlog
- P0: Integrate real Resend + Cloudflare R2 keys
- P1: Admin page content editor UI for About/Services blocks
- P1: Partner profile page projects section (show projects where partner is in partner_stack)
- P2: Audit log viewer in admin
- P2: Plan Drawings watermarking + access control
- P3: Server-side pagination for large datasets

## Phase 5 — Visibility Controls (June 2026) — tested ✓
- **Nav visibility (soft-hide):** `site_settings.nav_visibility` map {about, services, projects, ecosystem, contact}. Admin > Settings > Navigation toggles each page on/off in desktop header + mobile burger. Home always shown. Hidden pages still reachable by direct URL. Default merged on GET /api/settings for legacy docs.
- **Per-project media visibility:** `project.media_visible` (default True). Admin > Project > Media tab toggle. When off, the public case study hides the Media tab + Design-tab gallery (story/details still show). Default merged on GET /api/projects & /api/projects/{slug}.
- **Graceful fallbacks:** projects with no hero image render a branded gradient banner (data-testid=case-study-no-hero-banner); projects with no listing image render a branded placeholder tile (data-testid=project-noimg-{slug}).

## Last Updated
June 2026 — Phase 5 (nav + media visibility controls) complete

## Phase 6 — Section toggles, bulk cleanup, bilingual editor (June 2026) — tested ✓
- Per-project SECTION/TAB visibility: `project.tab_visibility {story,design,delivery,partners}` (default all true). Admin > Project > Media tab "Page Sections" toggles. Public case study hides toggled-off tabs and auto-selects first visible tab. Default merged on GET.
- Bulk "Hide Photo-less Media": POST /api/admin/projects/hide-photoless sets media_visible=false on projects with zero photos/media. Button in admin Projects header.
- Page Content editor now has Malayalam (ml) inputs for title/subtitle/body (About/Services).
- FIX: Admin ProjectForm 422 on legacy projects resolved (coerce string→BilingualText via toBL()).

## Phase 7 — Monochrome Architectural Rebrand (June 2026) — tested ✓ (non-regressive)
- Full site-wide rebrand to strict monochrome per user brand spec + supplied SEPTA logo.
- Fonts: Space Grotesk (display/headings), Inter (body), IBM Plex Mono (technical labels). Wired in index.html + index.css + tailwind.config.js (font-sora now maps to Space Grotesk).
- Palette: global className remap to tokens — teal→structural grey #606060, gold→#8A8A8A, carbon/teal-fills→#050505, cream→#F6F6F3, slate→#8A8A8A. CSS variables added in index.css (:root). Tailwind color tokens updated. No colourful accents.
- Navbar: rebuilt dark (#050505) sticky bar with /septa-logo.png mark + "SEPTA GROUP" Space Grotesk wordmark, mono uppercase nav links, white "Get a Quote ↗" architectural CTA. data-testids: navbar-logo-link, navbar-nav-item-{key}, navbar-get-quote-button.
- Footer: logo mark + wordmark, giant faint SEPTA GROUP wordmark, mono (tech-label) metadata.
- WhatsApp float button + admin status/action badges neutralised to monochrome (removed bright green/coloured badges). Error states keep red.
- Logo saved at /app/frontend/public/septa-logo.png. Design blueprint at /app/design_guidelines.json.
- NOTE: rebrand was a global colour/font remap (fast, cohesive). Exact per-section black/off-white/white RHYTHM on each page (hero=black, intro=off-white, etc.) is a further refinement if desired.

## Last Updated (latest)
June 2026 — Phase 7 monochrome rebrand complete (site-wide incl. admin)

## Phase 8 — Homepage rhythm, transparent logo, contact details, admin link (June 2026) — tested ✓ (visual, desktop+mobile)
- Homepage rebuilt to the exact architectural section rhythm: HERO(black) → TRUST(off-white) → SELECTED PROJECTS(white) → SEPTA STANDARD/process(black) → SERVICES(off-white) → TESTIMONIALS(white) → ECOSYSTEM(off-white) → CTA(black) → FOOTER(#050505). Oversized Space Grotesk statement headings ("From idea / to infrastructure.", "Building starts before construction.", "One partner. / The entire project."), grayscale imagery (colour on hover), mono section numbers, 1px plan-grid dividers, architectural arrow buttons, dark-section enquiry form (.input-underline-dark added to index.css).
- Transparent logo: generated + alpha-processed grey mark at /app/frontend/public/septa-mark.png (used in Navbar + Footer; works on any background). Original at /septa-logo.png retained.
- Contact details wired to live settings: WhatsApp/phone = +91 94009 39936, contact_person = "Paul Jose", contact_person_role = "Managing Director" (added to SiteContactSettings schema + DEFAULT_SETTINGS + pushed to DB). Hero/CTA WhatsApp + call now pull from settings (no more hardcoded 919876543210).
- Admin Portal link added to Footer bottom (data-testid=footer-admin-link → /admin).
- All remaining colourful type-badge hexes neutralised to monochrome across all pages.

## PENDING — Live Email (needs user credentials)
- email_service.py is built and reads RESEND_API_KEY, FROM_EMAIL, ADMIN_NOTIFY_EMAIL from backend/.env. Currently placeholders. Awaiting Resend API key + verified sender domain + notify recipient to switch on.

## Phase 9 — Reverted to black-and-white design + gold accent (June 2026)
- Design reverted to the strict black-dominant version (dark navbar, black hero + process, black CTAs) per user preference after trying light-dominant.
- Original logo (/septa-logo.png) restored in navbar + footer (transparent /septa-mark.png no longer used).
- Removed grayscale filter from all photos — full-colour imagery now.
- Added GOLD accent (#C6A15B, tailwind `septa-gold`): active nav link, "GROUP" wordmark (nav + footer), homepage section eyebrows + process numbers, hero image accent bar.
- Contact: WhatsApp/phone +91 94009 39936, Paul Jose (Managing Director). Enquiry notifications set to paul@septa.one (backend ADMIN_NOTIFY_EMAIL). Footer has Admin Portal link.

## PENDING
- Google login for admin (Emergent Google Auth) — user chose it; playbook fetched. Allowlist: paul@septa.one, admin@septa.group. NOT yet built.
- Live email sending needs a Resend API key (user will add) + verified sender domain (paul@septa.one / septa.one).

## Last Updated (latest)
June 2026 — Phase 9: black-and-white design + gold accent; Google login pending
