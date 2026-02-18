# Septa Group Website - Product Requirements Document

## Project Overview
A premium construction company website for Septa Group, Kerala. The platform positions Septa as a "Delivery Studio + Ecosystem Integrator" rather than just a builder.

## Core Features

### Completed Features (Phase 1)

#### 1. Public Website
- **Home Page**: Hero section, trust metrics, featured projects, services, testimonials, ecosystem teaser, contact form
- **Projects Page**: Filterable gallery by type, status, partner, design tags
- **Project Case Study Pages**: Three-part narrative (Story, Design, Delivery) + Partner Stack display
- **Ecosystem Page**: Partner directory with 10 categories including filtering
- **Partner Profile Pages**: Full profile with related projects and "Request Introduction" CTA
- **Services Page**: Service offerings aligned with ecosystem model
- **Contact Page**: Lead capture form with validation

#### 2. Admin Panel (NEW - Phase 1)
- **JWT Authentication**: Secure login with bcrypt password hashing
- **Leads Management**: View, filter, update status, delete leads
- **Projects CRUD**: Create, edit, delete projects with draft/published status
- **Partners CRUD**: Create, edit, delete partners with all categories
- **Testimonials Management**: View and delete testimonials
- **Settings**: Change password, export content as JSON backup
- **Audit Logging**: Track all admin actions with timestamps

#### 3. Email Notifications (NEW - Phase 1)
- **Admin Notification**: Rich HTML email with all lead details and triage subject line
- **User Confirmation**: Professional thank you email with next steps
- **Graceful Failure**: Leads saved to DB even if email fails
- **Retry Logic**: 3 attempts with exponential backoff

#### 4. API Endpoints
```
GET  /api/projects              - List all published projects
GET  /api/projects/{slug}       - Get single project
POST /api/projects              - Create project (admin)
PUT  /api/projects/{slug}       - Update project (admin)
DELETE /api/projects/{slug}     - Delete project (admin)

GET  /api/partners              - List all published partners
GET  /api/partners/{slug}       - Get single partner
POST /api/partners              - Create partner (admin)
PUT  /api/partners/{slug}       - Update partner (admin)
DELETE /api/partners/{slug}     - Delete partner (admin)

GET  /api/testimonials          - List testimonials
POST /api/testimonials          - Create testimonial (admin)
DELETE /api/testimonials/{id}   - Delete testimonial (admin)

POST /api/leads                 - Submit lead (with email notifications)
GET  /api/leads                 - List leads (admin)
PATCH /api/leads/{id}           - Update lead status (admin)
DELETE /api/leads/{id}          - Delete lead (admin)

POST /api/admin/login           - Admin login
POST /api/admin/logout          - Admin logout
GET  /api/admin/me              - Get current admin info
POST /api/admin/change-password - Change admin password

GET  /api/export/content        - Export all content as JSON (admin)
GET  /api/audit-logs            - View audit logs (admin)
GET  /api/categories/partners   - List partner categories
GET  /api/categories/projects   - List project categories
```

### Partner Categories (10 total)
1. Architecture & Design
2. Interiors & Fit-out
3. Engineering (MEP/Structural/QS)
4. Landscape & Outdoor
5. Materials & Vendors
6. Smart Home / Technology
7. Branding, Signage & Wayfinding
8. Marketing & Digital
9. Leasing & Real Estate (NEW)
10. Legal / Finance (NEW)

### Data Models

#### Bilingual Support Structure
```javascript
{
  title: { en: "English text", ml: "മലയാളം text" },
  description: { en: "...", ml: "..." }
}
// Fallback: If ml is null, display en
```

#### Project Schema
- slug, title (bilingual), location, type, project_status
- sqft, duration, year, client_type, client_lens
- image, gallery[], short_description (bilingual)
- challenge, challenge_detail, approach_detail, outcome_detail (bilingual)
- partner_stack: [{ partner_id, role_label, contribution }]
- story: { paragraphs[], owner_quote }
- design: { intent, tags[] }
- delivery: { highlights[], septa_standards[] }
- media: { hero_video, gallery, plan_drawings, model_3d_url, plans_public }
- status: draft | published
- created_at, updated_at

#### Partner Schema
- slug, name (bilingual), category, relationship_type
- specialties[], districts[], bio_short, bio_long (bilingual)
- website, instagram, email, logo_url, cover_image
- featured, known_for[], septa_collaboration (bilingual)
- status: draft | published
- created_at, updated_at

## Technical Architecture

### Frontend
- React 18 with React Router
- Tailwind CSS with custom theme
- Framer Motion for animations
- Axios for API calls
- Custom hooks: useProjects, usePartners, useAdminAuth, etc.

### Backend
- FastAPI with async support
- MongoDB via Motor (async driver)
- JWT authentication with HTTPOnly cookies
- Bcrypt password hashing
- SlowAPI rate limiting
- Resend for email (placeholder key)
- S3-compatible storage ready (Cloudflare R2)

### Environment Variables
```
# Backend
MONGO_URL=mongodb://localhost:27017
DB_NAME=septa_db
SECRET_KEY=<secure-key>
RESEND_API_KEY=<resend-key>
FROM_EMAIL=noreply@septa.group
ADMIN_NOTIFY_EMAIL=leads@septa.group
BOOTSTRAP_ADMIN_EMAIL=admin@septa.group
BOOTSTRAP_ADMIN_PASSWORD=<password>
STORAGE_PROVIDER=R2
BUCKET_NAME=septa-media
R2_ACCESS_KEY=<key>
R2_SECRET_KEY=<secret>
R2_ENDPOINT_URL=<endpoint>
PUBLIC_CDN_BASE_URL=<cdn-url>
```

## Upcoming Features (Phase 2)

### P2: Immersive Project Media System
- Hero video with drone walkthrough
- Owner testimonial video (optional)
- Image gallery with lazy loading
- Plan drawings (permission-based with watermark)
- 3D model viewer (GLB/GLTF)
- Interactive 3D from drone capture

### P3: Solution Packs
- Pre-configured partner stacks for common project types
- Premium Home Pack, Retail Launch Pack, Institutional Excellence Pack

### P4: Bilingual Support (EN + Malayalam)
- Language toggle in navbar
- Content fields already support bilingual structure
- Malayalam font support needed

## Credentials
- Admin Panel: /admin
- Email: admin@septa.group
- Password: septa2024admin

## Testing
- Backend: 35 pytest tests covering all endpoints
- Test file: /app/backend/tests/test_septa_api.py
- Test reports: /app/test_reports/

## MOCKED Integrations
- **Resend Email**: Using placeholder API key (re_placeholder_key) - emails not sent
- **Cloudflare R2**: Using placeholder keys - file uploads will fail

## Last Updated
December 2025 - Phase 1 Complete (Admin Panel + Email Notifications)
