# Septa Group Website — PRD

## Project Overview
Production-ready marketing website for Septa Group, a Kerala-based construction company. Goal: win trust fast and convert visitors into leads (calls + WhatsApp + enquiry form).

**Live URL:** https://construct-hub-210.preview.emergentagent.com  
**Admin Panel:** /admin (password: septa2024)  
**Content Checklist:** /content-checklist  

---

## Architecture

### Stack
- **Frontend:** React 19, Tailwind CSS, framer-motion, lucide-react, react-router-dom
- **Backend:** FastAPI (Python), MongoDB via Motor
- **Database:** MongoDB (septa_db)
- **Fonts:** Sora (headings) + Inter (body) via Google Fonts

### Brand Colors
| Name | Hex | Usage |
|------|-----|-------|
| Carbon Black | #1F2328 | Primary text, logo |
| Soft Linen | #F3F0E8 | Page background |
| Stormy Teal | #0F5E5B | Buttons, accents, CTAs |
| Golden Bronze | #C6A15B | Micro-accents, dividers |
| Pale Slate | #A7ADB5 | Secondary text, borders |

### File Structure
```
/app/frontend/src/
├── App.js (router)
├── hooks/useScrollReveal.js
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx
│   └── WhatsAppButton.jsx
└── pages/
    ├── HomePage.jsx
    ├── AboutPage.jsx
    ├── ServicesPage.jsx
    ├── ProjectsPage.jsx
    ├── ProjectCaseStudyPage.jsx
    ├── ContactPage.jsx
    ├── AdminPage.jsx
    └── ContentChecklist.jsx
```

---

## Pages Implemented

### A) Home (conversion-focused)
- Hero: "Built with Clarity." + CTA (Request Quote, View Projects, WhatsApp)
- Trust proof bar: 4 metrics
- Featured Projects grid: 6 cards from API
- How Septa Works: 4-step process
- Services snapshot: 5 tiles
- Testimonials: loaded from API
- CTA section + quick enquiry form (4 fields)

### B) About
- Company story (legacy + modern studio positioning)
- Values (3 cards)
- Why Different (3 proof-based differentiators with evidence)
- Team section (role placeholders, no fake names)

### C) Services
- 5 expandable service categories with What's Included / Not Included / Timeline Variables
- Per-service CTA (Request Quote)

### D) Projects (filterable)
- Filter by type (Institutional/Healthcare/Commercial/Residential/Mixed-use)
- Filter by status (Completed/Ongoing)
- 6 realistic Kerala placeholder projects

### E) Project Case Study (dynamic /projects/:slug)
- Overview, challenge, approach, outcome
- Gallery (3 images per project)
- Septa Standard checklist
- CTA: "Build Something Similar"

### F) Contact
- Full form (8 fields: name, phone, email, location, project type, budget, timeline, message)
- Phone + WhatsApp direct links
- FAQ accordion (5 questions)
- Honeypot spam protection

### G) Admin (/admin, password: septa2024)
- Login gate with localStorage persistence
- Dashboard: stats (leads, projects, testimonials counts)
- Leads tab: view, change status (new/contacted/closed), delete
- Projects tab: view, delete
- Testimonials tab: view, delete

### H) Content Checklist (/content-checklist)
- 7 categories, 37 items listing all placeholder content to replace

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/leads | Submit enquiry (honeypot protected) |
| GET | /api/leads | Get all leads (admin) |
| PATCH | /api/leads/{id} | Update lead status |
| DELETE | /api/leads/{id} | Delete lead |
| GET | /api/projects | Get all projects (filter: type, status) |
| GET | /api/projects/{slug} | Get single project |
| POST | /api/projects | Create project (admin) |
| PUT | /api/projects/{slug} | Update project (admin) |
| DELETE | /api/projects/{slug} | Delete project (admin) |
| GET | /api/testimonials | Get all testimonials |
| POST | /api/testimonials | Create testimonial |
| PUT | /api/testimonials/{id} | Update testimonial |
| DELETE | /api/testimonials/{id} | Delete testimonial |
| POST | /api/admin/auth | Admin authentication |

---

## Seed Data (auto-seeded on first start)

### Projects (6)
1. St. Thomas School of Excellence — Thrissur (Institutional, Completed)
2. Lakeview Medical Centre — Ernakulam (Healthcare, Completed)
3. Prestige Business Square — Kochi (Commercial, Completed)
4. Malabar Residency — Kozhikode (Residential, Completed)
5. Green Hills Villa Complex — Trivandrum (Residential, Ongoing)
6. Harmony Business Centre — Kottayam (Mixed-use, Ongoing)

### Testimonials (3)
- P. Rajan (Thrissur school)
- Dr. S. Nair (Ernakulam healthcare)
- A. Menon (Kozhikode residential)

---

## SEO Setup
- Per-page document.title
- OpenGraph meta tags (index.html)
- /robots.txt
- /sitemap.xml (12 URLs)

---

## Placeholder Content (needs replacement)
See /content-checklist page for full list. Key items:
- Phone number: +91 XXXXX XXXXX
- Email: info@septagroup.in
- Office address: [Office Address]
- Team photos and names
- Real project photos and names
- WhatsApp number: 919876543210 in WhatsAppButton.jsx

---

## Test Results (iteration_1)
- Backend: 100% (13/13 tests passed)
- Frontend: 95% (all pages load, forms work, admin works)
- All core flows verified working

---

## Ecosystem Upgrade (Feb 2026)

### New Architecture
- Moved project + partner data to **static JSON files** in `src/content/` for easy editing without code changes
- `src/content/partners.json` — 13 partner profiles with full bios, specialties, districts, relationship types
- `src/content/projects.json` — 6 projects with extended schema (partnerStack, clientLens, story/design/delivery modules)

### New Pages
- `/ecosystem` — Partner directory with category tabs, search, district filter, partner cards, solution packs
- `/ecosystem/:slug` — Partner profile pages with bio, known-for, collaboration note, related projects, intro CTA

### Upgraded Pages
- **ProjectsPage** — Now imports from JSON; added Partner filter + Design Tag filter; shows architect name on cards
- **ProjectCaseStudyPage** — Complete rewrite: Partner Stack module (dark bar with role/partner/contribution rows), 3 sections (The Story, The Design, The Delivery), clientLens-aware copy, Related Projects
- **ServicesPage** — Rewritten with 6 ecosystem-aligned offerings (Design–Build, Bespoke Residences, Institutional, Commercial, PMC, Partnership Execution)
- **HomePage** — Added Ecosystem teaser section with featured partner preview cards

### Partner Directory (13 partners)
- Architecture & Design: Aether Design Studio (Core), Axis Architects Collective (Core), Forma Studio (Project Partner)
- Interiors: Woven Interiors (Core), Studio Pith (Project Partner)
- Engineering: Meridian Structural (Core), Nexus MEP (Core), ProQS (Preferred Vendor)
- Landscape: Greenseed Landscape Studio (Core)
- Materials: Kerala Stone Collective (Preferred Vendor)
- Technology: Hypha Systems (Group Company)
- Branding/Signage: Signal Brand Studio (Project Partner)
- Marketing: Narrative Digital (Project Partner)

### Content Editing (no code required)
- Update `src/content/partners.json` to add/edit/remove partners
- Update `src/content/projects.json` to add/edit/remove projects with full partner stacks

### Test Results (iteration_2)
- Frontend: 100% (26/26 tests passed)
- All ecosystem features verified working

---

## P0 Backlog (next)
- Replace placeholder content — see /content-checklist
- Change admin password in backend/.env
- Add real WhatsApp number in WhatsAppButton.jsx

## P1 Backlog
- Email notification for lead submissions (Resend)
- Real project photos (replace Unsplash)
- Logo SVG file
- Admin: Add new project form (currently read/delete only)
- Partner logo upload support

## P2 Backlog
- Google Analytics
- Google Maps on Contact page
- Gallery lightbox for project photos
- Multi-language (English + Malayalam)

