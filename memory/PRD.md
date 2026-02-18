# Septa Group Website - Product Requirements Document

## Project Overview
A premium construction company website for Septa Group, Kerala. The platform positions Septa as a "Delivery Studio + Ecosystem Integrator" rather than just a builder.

## Completed Features

### Phase 1 (Complete)
- ✅ **Admin Panel**: JWT auth, CRUD for Projects/Partners/Testimonials, Draft/Published status, Preview mode
- ✅ **Email Notifications**: Resend integration with retry logic, email logging to DB (MOCKED - placeholder key)
- ✅ **Media Storage**: S3-compatible with local fallback (MOCKED - R2 placeholder keys)
- ✅ **Data Migration**: JSON to MongoDB migration for all content

### Phase 2 (Complete - Media Components)
- ✅ **ImageGallery**: Grid with lightbox viewer, lazy loading
- ✅ **VideoPlayer**: Custom controls, fullscreen support
- ✅ **Model3DViewer**: GLB/GLTF support with mobile warning
- ✅ **PlanDrawings**: Watermarked, permission-based access
- ⏳ **Integration**: Components ready, not yet integrated into project pages

### Phase 3 (Complete - Solution Packs)
- ✅ **Solution Packs Page**: `/solution-packs` route
- ✅ **3 Default Packs**: Premium Home, Retail Launch, Institutional Excellence
- ✅ **CMS-Managed**: Admin can CRUD solution packs
- ✅ **Disclaimer System**: Clear "introductions + coordination" messaging

### Phase 4 (Complete - Bilingual)
- ✅ **Language Toggle**: In navbar (desktop and mobile)
- ✅ **LanguageProvider**: React context with localStorage persistence
- ✅ **UI Translations**: Navigation, forms, sections in EN/ML
- ⏳ **Content Translation**: Structure ready, Malayalam content not yet added

## Partner Categories (14 total)
1. Architecture & Design
2. Structural Engineering
3. MEP Engineering
4. Quantity Surveying
5. Interiors & Fit-out
6. Landscape & Outdoor
7. Lighting Design
8. Materials & Vendors
9. Smart Home / Security / Automation
10. Branding, Signage & Wayfinding
11. Marketing & Digital
12. Leasing & Real Estate
13. Photo / Video / 3D Documentation
14. Legal / Compliance / Approvals

## API Endpoints

### Public
```
GET  /api/projects
GET  /api/projects/{slug}
GET  /api/partners
GET  /api/partners/{slug}
GET  /api/testimonials
GET  /api/solution-packs
GET  /api/solution-packs/{slug}
GET  /api/categories/partners
GET  /api/categories/projects
POST /api/leads
```

### Admin (JWT Required)
```
POST   /api/admin/login
POST   /api/admin/logout
GET    /api/admin/me
POST   /api/admin/change-password
GET    /api/leads
PATCH  /api/leads/{id}
DELETE /api/leads/{id}
POST   /api/projects
PUT    /api/projects/{slug}
DELETE /api/projects/{slug}
POST   /api/partners
PUT    /api/partners/{slug}
DELETE /api/partners/{slug}
POST   /api/solution-packs
PUT    /api/solution-packs/{slug}
DELETE /api/solution-packs/{slug}
POST   /api/upload
GET    /api/export/content
GET    /api/audit-logs
GET    /api/email-logs
GET    /api/storage/status
```

## Technical Stack
- **Frontend**: React 18, React Router, Tailwind CSS, Framer Motion, Axios
- **Backend**: FastAPI, Motor (async MongoDB), JWT, bcrypt, Resend, boto3
- **Database**: MongoDB
- **Storage**: Cloudflare R2 (with local fallback at /app/uploads)

## Environment Variables Required
```bash
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=septa_db
SECRET_KEY=<secure-key>
RESEND_API_KEY=<resend-key>  # Currently placeholder
FROM_EMAIL=noreply@septa.group
ADMIN_NOTIFY_EMAIL=jose@septa.group,info@septa.group
BOOTSTRAP_ADMIN_EMAIL=admin@septa.group
BOOTSTRAP_ADMIN_PASSWORD=<password>
STORAGE_PROVIDER=R2  # Falls back to LOCAL if keys missing
BUCKET_NAME=septa-media
R2_ACCESS_KEY=<key>  # Currently placeholder
R2_SECRET_KEY=<secret>  # Currently placeholder
R2_ENDPOINT_URL=<endpoint>
PUBLIC_CDN_BASE_URL=<cdn-url>
```

## Testing Status
- Backend: 100% pass rate (all endpoints tested)
- Frontend: All pages load correctly
- Test reports: `/app/test_reports/iteration_4.json`

## MOCKED Integrations
- **Resend Email**: Placeholder key - emails logged to DB but not sent
- **Cloudflare R2**: Placeholder keys - local fallback at /app/uploads

## Admin Credentials
- URL: `/admin`
- Email: `admin@septa.group`
- Password: `septa2024admin`

## Remaining Work

### To Enable Full Functionality
1. **Resend**: Add real API key + verify domain
2. **R2 Storage**: Add Cloudflare R2 credentials

### Future Enhancements
- Integrate media components into project detail pages
- Add Malayalam content translations
- Build tabbed UI for project pages (Story | Design | Delivery | Media | Partners)
- Add more solution packs via admin

## Last Updated
December 2025 - Phase 1-4 Complete
