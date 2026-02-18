# Septa Group Website - Product Requirements Document

## Problem Statement
Transform the Septa Group construction company website from a simple brochure site into a "Delivery Studio + Ecosystem" platform.

## Core Requirements

### P1 - Email Notifications (DONE)
- Resend-based emails for new lead notifications to admins and confirmation to users
- Retry logic, graceful failure, logging to MongoDB

### P1 - Admin Panel (DONE)
- Password-protected admin panel with JWT auth
- Full CRUD for Projects and Partners stored in MongoDB
- Draft/Published statuses with Preview mode
- Refactored into modular components (LeadsTab, ProjectsTab, PartnersTab, ProjectForm, PartnerForm, SettingsTab, TestimonialsTab)

### P2 - Immersive Project Media (DONE)
- Tabbed UI on ProjectCaseStudyPage: Story | Design | Delivery | Media | Partners
- Media tab with ImageGallery, VideoPlayer, Model3DViewer, PlanDrawings components
- Admin ProjectForm includes Media tab with upload support for images, video, 3D models
- Media tab only shows when project has media/gallery data

### P3 - Ecosystem & Solution Packs (DONE)
- Expanded partner categories (14 categories including Leasing & Real Estate)
- Solution Packs page with dynamic CMS content
- Admin management for Solution Packs

### P4 - Bilingual Support (DONE)
- English/Malayalam language support via LanguageContext
- UI toggle in navbar with localStorage persistence
- All pages updated: Navbar, Footer, HomePage, ProjectCaseStudyPage, EcosystemPage, SolutionPacksPage
- Backend schema supports {en, ml} bilingual objects

## Tech Stack
- **Frontend:** React, React Router, Tailwind CSS, Framer Motion, Lucide React
- **Backend:** FastAPI, MongoDB (motor async), Python
- **Auth:** JWT (python-jose, bcrypt)
- **Email:** Resend (MOCKED - placeholder key)
- **Storage:** S3-compatible service (MOCKED - local fallback)

## Architecture
```
/app/
├── backend/
│   ├── server.py             # Main API router
│   ├── models/schemas.py     # Pydantic models
│   ├── services/email_service.py
│   ├── services/storage_service.py
│   └── utils/auth.py
├── frontend/src/
│   ├── components/
│   │   ├── admin/            # Modular admin components
│   │   │   ├── LeadsTab.jsx
│   │   │   ├── ProjectsTab.jsx
│   │   │   ├── ProjectForm.jsx
│   │   │   ├── PartnersTab.jsx
│   │   │   ├── PartnerForm.jsx
│   │   │   ├── SettingsTab.jsx
│   │   │   └── TestimonialsTab.jsx
│   │   ├── ImageGallery.jsx
│   │   ├── VideoPlayer.jsx
│   │   ├── Model3DViewer.jsx
│   │   ├── PlanDrawings.jsx
│   │   └── LanguageToggle.jsx
│   ├── hooks/useApi.js
│   └── pages/
│       ├── AdminPage.jsx     # Refactored ~120 lines
│       ├── ProjectCaseStudyPage.jsx  # Tabbed UI
│       ├── SolutionPacksPage.jsx
│       └── EcosystemPage.jsx
```

## Key Credentials
- Admin: admin@septa.group / septa2024admin
- API: https://septa-cms-preview.preview.emergentagent.com

## What's Mocked
- **Resend Email**: Placeholder key, emails logged to DB not sent
- **Cloudflare R2**: Local fallback at /app/uploads

## Remaining Work (Backlog)
- Integrate production Resend & Cloudflare R2 credentials
- Admin audit log viewer
- Partner "Request Introduction" CTA
- Plan Drawings watermarking & access control
- Server-side pagination for large datasets

## Last Updated
February 2026 - Phase 1-4 Complete
