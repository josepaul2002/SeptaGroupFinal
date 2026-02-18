# Septa Group Website — PRD

## Project Overview
Production-ready marketing website for Septa Group, a Kerala-based construction company. Goal: win trust fast and convert visitors into leads (calls + WhatsApp + enquiry form).

**Live URL:** https://septa-projects.preview.emergentagent.com  
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

## Prioritized Backlog

### P0 (Critical - do before going live)
- Replace all placeholder content (see /content-checklist)
- Change admin password from septa2024 to strong password in backend/.env
- Add real phone number and WhatsApp number

### P1 (Important enhancements)
- Email notification integration (Resend/SendGrid) for lead submissions
- Real project photos (replace Unsplash placeholders)
- Logo file (SVG/PNG) to replace text logo

### P2 (Nice-to-have)
- Google Analytics integration
- Google Maps embed on Contact page
- Image gallery lightbox for project case studies
- Admin: add new project form (currently read/delete only)
- WhatsApp Business API integration
- Multi-language support (English + Malayalam)

---

_Last updated: Feb 2026_
