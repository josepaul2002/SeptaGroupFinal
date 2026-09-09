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
