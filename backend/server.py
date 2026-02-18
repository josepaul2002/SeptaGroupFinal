"""
Septa Group API Server
Full CMS with Admin Panel, Email Notifications, and Media Storage
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Query
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import json
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from models.schemas import (
    LeadCreate, LeadStatusUpdate, LeadResponse,
    PartnerCreate, PartnerUpdate, PartnerResponse, PartnerMedia,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    TestimonialCreate, TestimonialResponse,
    AdminLoginRequest, AdminLoginResponse, AdminPasswordChange, AdminUser,
    AuditLogEntry, ContentExport, PublishStatus,
    BilingualText, PartnerStackItem, StoryModule, DesignModule, DeliveryModule, ProjectMedia,
    SiteSettings, SiteContactSettings, EnquiryFormSettings,
    PageContent, ContentBlock
)
from services.email_service import send_admin_notification, send_user_confirmation, set_email_logs_collection
from services.storage_service import upload_file, delete_file, get_presigned_upload_url, validate_file, get_storage_status
from utils.auth import (
    verify_password, get_password_hash, create_access_token,
    set_auth_cookie, clear_auth_cookie, get_current_admin, get_optional_admin
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Rate limiting
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Septa Group API", version="2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Local uploads directory
UPLOADS_DIR = Path("/app/uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def make_bilingual(text: str) -> dict:
    """Convert string to bilingual format"""
    return {"en": text, "ml": None}


def get_text(bilingual: Any, lang: str = "en") -> str:
    """Get text from bilingual object with fallback"""
    if isinstance(bilingual, dict):
        return bilingual.get(lang) or bilingual.get("en", "")
    return str(bilingual) if bilingual else ""


async def log_audit(
    admin_id: str,
    admin_email: str,
    action: str,
    resource_type: str,
    resource_id: str,
    changes: Optional[Dict] = None
):
    """Log admin action for audit trail"""
    entry = {
        "id": str(uuid.uuid4()),
        "admin_id": admin_id,
        "admin_email": admin_email,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "changes": changes,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(entry)
    logger.info(f"Audit: {admin_email} {action} {resource_type}/{resource_id}")


# ============================================================================
# LEAD ENDPOINTS
# ============================================================================

@api_router.post("/leads", status_code=201)
@limiter.limit("5/minute")
async def create_lead(request: Request, lead: LeadCreate):
    """
    Create new lead with email notifications
    Always saves to DB even if email fails
    """
    # Honeypot check
    if lead.honeypot:
        logger.info("Honeypot triggered - bot detected")
        return {"message": "Thank you for your enquiry."}
    
    # Server-side validation
    if not lead.name or len(lead.name) < 2:
        raise HTTPException(status_code=400, detail="Name is required")
    if not lead.phone or len(lead.phone) < 8:
        raise HTTPException(status_code=400, detail="Valid phone number is required")
    
    # Prepare document
    doc = lead.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "new"
    doc["id"] = str(uuid.uuid4())
    doc["email_sent"] = False
    doc["admin_notified"] = False
    
    # ALWAYS save to DB first
    await db.leads.insert_one(doc)
    logger.info(f"Lead saved: {doc['id']}")
    
    # Send emails (non-blocking, failures don't affect response)
    try:
        # Admin notification
        admin_result = await send_admin_notification(doc)
        if admin_result.get("success"):
            await db.leads.update_one(
                {"id": doc["id"]},
                {"$set": {"admin_notified": True}}
            )
        
        # User confirmation
        if lead.email:
            user_result = await send_user_confirmation(lead.email, lead.name, lead_id=doc["id"])
            if user_result.get("success"):
                await db.leads.update_one(
                    {"id": doc["id"]},
                    {"$set": {"email_sent": True}}
                )
    except Exception as e:
        logger.error(f"Email send error (lead still saved): {str(e)}")
    
    return {"message": "Enquiry received. We will contact you within 24 hours.", "id": doc["id"]}


@api_router.get("/leads")
async def get_leads(
    skip: int = Query(0),
    limit: int = Query(50, le=200),
    status: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get leads with pagination and filtering (admin only)"""
    query = {}
    if status and status != "all":
        query["status"] = status
    total = await db.leads.count_documents(query)
    leads = await db.leads.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"leads": leads, "total": total, "skip": skip, "limit": limit}


@api_router.patch("/leads/{lead_id}")
async def update_lead_status(
    lead_id: str,
    update: LeadStatusUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update lead status"""
    update_data = {"status": update.status}
    if update.notes is not None:
        update_data["notes"] = update.notes
    
    result = await db.leads.update_one(
        {"id": lead_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await log_audit(admin["admin_id"], admin["email"], "update", "lead", lead_id, update_data)
    return {"message": "Status updated"}


@api_router.get("/leads/export-csv")
async def export_leads_csv(admin: dict = Depends(get_current_admin)):
    """Export leads as CSV"""
    import csv, io
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(5000)
    
    output = io.StringIO()
    fieldnames = ["name", "phone", "email", "project_type", "project_location", "budget_range", "timeline", "message", "status", "partner_ref", "created_at"]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for lead in leads:
        writer.writerow(lead)
    
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=septa-leads-{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv"}
    )


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, admin: dict = Depends(get_current_admin)):
    """Delete lead"""
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await log_audit(admin["admin_id"], admin["email"], "delete", "lead", lead_id)
    return {"message": "Lead deleted"}


# ============================================================================
# PROJECT ENDPOINTS
# ============================================================================

@api_router.get("/projects")
async def get_projects(
    type: Optional[str] = None,
    status: Optional[str] = None,
    published_only: bool = True,
    admin: Optional[dict] = Depends(get_optional_admin)
):
    """Get projects with optional filters"""
    query = {}
    if type:
        query["type"] = type
    if status:
        query["project_status"] = status
    
    # Only show published unless admin
    if published_only and not admin:
        query["status"] = "published"
    
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects


@api_router.get("/projects/{slug}")
async def get_project(
    slug: str,
    preview: Optional[str] = None,
    admin: Optional[dict] = Depends(get_optional_admin)
):
    """Get single project by slug"""
    query = {"slug": slug}
    
    # Preview mode: allow viewing draft with valid preview token
    is_preview = preview and admin
    
    # Only show published unless admin or valid preview
    if not admin and not is_preview:
        query["status"] = "published"
    
    project = await db.projects.find_one(query, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Add preview flag to response
    if is_preview and project.get("status") == "draft":
        project["_preview_mode"] = True
    
    return project


@api_router.post("/projects", status_code=201)
async def create_project(
    project: ProjectCreate,
    admin: dict = Depends(get_current_admin)
):
    """Create new project"""
    existing = await db.projects.find_one({"slug": project.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    doc = project.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    
    await db.projects.insert_one(doc)
    await log_audit(admin["admin_id"], admin["email"], "create", "project", doc["id"], {"slug": project.slug})
    
    return {"message": "Project created", "id": doc["id"], "slug": project.slug}


@api_router.put("/projects/{slug}")
async def update_project(
    slug: str,
    update: ProjectUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update project"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.projects.update_one({"slug": slug}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = await db.projects.find_one({"slug": slug}, {"_id": 0, "id": 1})
    await log_audit(admin["admin_id"], admin["email"], "update", "project", project["id"], update_data)
    
    return {"message": "Project updated"}


@api_router.delete("/projects/{slug}")
async def delete_project(slug: str, admin: dict = Depends(get_current_admin)):
    """Delete project"""
    project = await db.projects.find_one({"slug": slug}, {"_id": 0, "id": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.projects.delete_one({"slug": slug})
    await log_audit(admin["admin_id"], admin["email"], "delete", "project", project["id"])
    
    return {"message": "Project deleted"}


# ============================================================================
# PARTNER ENDPOINTS
# ============================================================================

@api_router.get("/partners")
async def get_partners(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    published_only: bool = True,
    admin: Optional[dict] = Depends(get_optional_admin)
):
    """Get partners with optional filters"""
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["featured"] = featured
    
    if published_only and not admin:
        query["status"] = "published"
    
    partners = await db.partners.find(query, {"_id": 0}).sort("sort_order", 1).to_list(1000)
    return partners


@api_router.get("/partners/{slug}")
async def get_partner(
    slug: str,
    preview: Optional[str] = None,
    admin: Optional[dict] = Depends(get_optional_admin)
):
    """Get single partner by slug"""
    query = {"slug": slug}
    
    # Preview mode: allow viewing draft with valid preview token
    is_preview = preview and admin
    
    if not admin and not is_preview:
        query["status"] = "published"
    
    partner = await db.partners.find_one(query, {"_id": 0})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    # Add preview flag to response
    if is_preview and partner.get("status") == "draft":
        partner["_preview_mode"] = True
    
    return partner


@api_router.post("/partners", status_code=201)
async def create_partner(
    partner: PartnerCreate,
    admin: dict = Depends(get_current_admin)
):
    """Create new partner"""
    existing = await db.partners.find_one({"slug": partner.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    doc = partner.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["updated_at"] = doc["created_at"]
    
    await db.partners.insert_one(doc)
    await log_audit(admin["admin_id"], admin["email"], "create", "partner", doc["id"], {"slug": partner.slug})
    
    return {"message": "Partner created", "id": doc["id"], "slug": partner.slug}


@api_router.put("/partners/{slug}")
async def update_partner(
    slug: str,
    update: PartnerUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update partner"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.partners.update_one({"slug": slug}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    partner = await db.partners.find_one({"slug": slug}, {"_id": 0, "id": 1})
    await log_audit(admin["admin_id"], admin["email"], "update", "partner", partner["id"], update_data)
    
    return {"message": "Partner updated"}


@api_router.delete("/partners/{slug}")
async def delete_partner(slug: str, admin: dict = Depends(get_current_admin)):
    """Delete partner"""
    partner = await db.partners.find_one({"slug": slug}, {"_id": 0, "id": 1})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    await db.partners.delete_one({"slug": slug})
    await log_audit(admin["admin_id"], admin["email"], "delete", "partner", partner["id"])
    
    return {"message": "Partner deleted"}


# ============================================================================
# TESTIMONIAL ENDPOINTS
# ============================================================================

@api_router.get("/testimonials")
async def get_testimonials():
    """Get all testimonials"""
    testimonials = await db.testimonials.find({}, {"_id": 0}).to_list(1000)
    return testimonials


@api_router.post("/testimonials", status_code=201)
async def create_testimonial(
    testimonial: TestimonialCreate,
    admin: dict = Depends(get_current_admin)
):
    """Create testimonial"""
    doc = testimonial.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.testimonials.insert_one(doc)
    await log_audit(admin["admin_id"], admin["email"], "create", "testimonial", doc["id"])
    
    return {"message": "Testimonial created", "id": doc["id"]}


@api_router.put("/testimonials/{testimonial_id}")
async def update_testimonial(
    testimonial_id: str,
    testimonial: TestimonialCreate,
    admin: dict = Depends(get_current_admin)
):
    """Update testimonial"""
    result = await db.testimonials.update_one(
        {"id": testimonial_id},
        {"$set": testimonial.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    await log_audit(admin["admin_id"], admin["email"], "update", "testimonial", testimonial_id)
    return {"message": "Testimonial updated"}


@api_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(
    testimonial_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Delete testimonial"""
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    await log_audit(admin["admin_id"], admin["email"], "delete", "testimonial", testimonial_id)
    return {"message": "Testimonial deleted"}


# ============================================================================
# ADMIN AUTH ENDPOINTS
# ============================================================================

@api_router.post("/admin/login")
@limiter.limit("5/minute")
async def admin_login(request: Request, response: Response, auth: AdminLoginRequest):
    """Admin login with JWT"""
    admin = await db.admins.find_one({"email": auth.email}, {"_id": 0})
    if not admin or not verify_password(auth.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create token
    token = create_access_token({"sub": admin["id"], "email": admin["email"]})
    
    # Set cookie
    set_auth_cookie(response, token)
    
    # Update last login
    await db.admins.update_one(
        {"id": admin["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    logger.info(f"Admin login: {admin['email']}")
    
    return AdminLoginResponse(
        access_token=token,
        admin_id=admin["id"],
        email=admin["email"]
    )


@api_router.post("/admin/logout")
async def admin_logout(response: Response, admin: dict = Depends(get_current_admin)):
    """Admin logout"""
    clear_auth_cookie(response)
    return {"message": "Logged out"}


@api_router.get("/admin/me")
async def get_current_admin_info(admin: dict = Depends(get_current_admin)):
    """Get current admin info"""
    admin_doc = await db.admins.find_one({"id": admin["admin_id"]}, {"_id": 0, "password_hash": 0})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="Admin not found")
    return admin_doc


@api_router.post("/admin/change-password")
async def change_admin_password(
    data: AdminPasswordChange,
    admin: dict = Depends(get_current_admin)
):
    """Change admin password"""
    admin_doc = await db.admins.find_one({"id": admin["admin_id"]})
    if not admin_doc:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    if not verify_password(data.current_password, admin_doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hash = get_password_hash(data.new_password)
    await db.admins.update_one(
        {"id": admin["admin_id"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    await log_audit(admin["admin_id"], admin["email"], "password_change", "admin", admin["admin_id"])
    
    return {"message": "Password changed successfully"}


# Legacy auth endpoint for backward compatibility
@api_router.post("/admin/auth")
@limiter.limit("5/minute")
async def admin_auth_legacy(request: Request, response: Response, auth: dict):
    """Legacy admin auth - redirects to new login"""
    password = auth.get("password", "")
    bootstrap_email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "admin@septa.group")
    
    # Try with bootstrap email
    return await admin_login(
        request, response,
        AdminLoginRequest(email=bootstrap_email, password=password)
    )


# ============================================================================
# MEDIA UPLOAD ENDPOINTS
# ============================================================================

@api_router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    admin: dict = Depends(get_current_admin)
):
    """Upload media file"""
    content = await file.read()
    
    # Validate
    is_valid, error = validate_file(file.filename, file.content_type, len(content))
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)
    
    # Upload
    result = await upload_file(content, file.filename, file.content_type)
    if not result:
        raise HTTPException(status_code=500, detail="Upload failed")
    
    await log_audit(admin["admin_id"], admin["email"], "upload", "media", result["key"])
    
    return result


@api_router.post("/upload/presigned")
async def get_upload_url(
    filename: str = Query(...),
    content_type: str = Query(...),
    admin: dict = Depends(get_current_admin)
):
    """Get presigned URL for direct upload"""
    result = await get_presigned_upload_url(filename, content_type)
    if not result:
        raise HTTPException(status_code=500, detail="Could not generate upload URL")
    return result


# ============================================================================
# EXPORT ENDPOINTS
# ============================================================================

@api_router.get("/export/content")
async def export_content(admin: dict = Depends(get_current_admin)):
    """Export all content as JSON for backup"""
    projects = await db.projects.find({}, {"_id": 0}).to_list(1000)
    partners = await db.partners.find({}, {"_id": 0}).to_list(1000)
    
    export_data = {
        "projects": projects,
        "partners": partners,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "exported_by": admin["email"]
    }
    
    await log_audit(admin["admin_id"], admin["email"], "export", "content", "all")
    
    return export_data


@api_router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(50, le=500),
    skip: int = Query(0),
    resource_type: Optional[str] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get audit logs with pagination and filtering"""
    query = {}
    if resource_type:
        query["resource_type"] = resource_type
    total = await db.audit_logs.count_documents(query)
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    return {"logs": logs, "total": total, "skip": skip, "limit": limit}


@api_router.get("/partners/{slug}/projects")
async def get_partner_projects(slug: str):
    """Get projects where this partner is in the partner_stack"""
    projects = await db.projects.find(
        {"partner_stack.partner_id": slug, "status": "published"},
        {"_id": 0, "slug": 1, "title": 1, "type": 1, "location": 1, "image": 1, "sqft": 1, "year": 1}
    ).to_list(50)
    return projects


@api_router.get("/partners-featured")
async def get_featured_partners():
    """Get featured partners for homepage spotlight"""
    featured = await db.partners.find(
        {"status": "published", "is_featured": True},
        {"_id": 0}
    ).sort("sort_order", 1).to_list(10)
    if len(featured) < 3:
        extras = await db.partners.find(
            {"status": "published", "slug": {"$nin": [p["slug"] for p in featured]}},
            {"_id": 0}
        ).sort("sort_order", 1).to_list(6 - len(featured))
        featured.extend(extras)
    return featured


# ============================================================================
# CATEGORIES ENDPOINT
# ============================================================================

@api_router.get("/categories/partners")
async def get_partner_categories():
    """Get all partner categories"""
    return [
        "Architecture & Design",
        "Structural Engineering",
        "MEP Engineering",
        "Quantity Surveying",
        "Interiors & Fit-out",
        "Landscape & Outdoor",
        "Lighting Design",
        "Materials & Vendors",
        "Smart Home / Security / Automation",
        "Branding, Signage & Wayfinding",
        "Marketing & Digital",
        "Leasing & Real Estate",
        "Photo / Video / 3D Documentation",
        "Legal / Compliance / Approvals"
    ]


@api_router.get("/categories/projects")
async def get_project_categories():
    """Get project type categories"""
    return {
        "types": ["Institutional", "Healthcare", "Commercial", "Residential", "Mixed-use"],
        "statuses": ["Completed", "Ongoing"],
        "client_lens": ["Residential", "Commercial", "Institutional", "Mixed-use"]
    }


# ============================================================================
# SOLUTION PACKS ENDPOINTS
# ============================================================================

@api_router.get("/solution-packs")
async def get_solution_packs():
    """Get all solution packs"""
    packs = await db.solution_packs.find({"status": "published"}, {"_id": 0}).to_list(100)
    return packs


@api_router.get("/solution-packs/{slug}")
async def get_solution_pack(slug: str):
    """Get single solution pack"""
    pack = await db.solution_packs.find_one({"slug": slug}, {"_id": 0})
    if not pack:
        raise HTTPException(status_code=404, detail="Solution pack not found")
    return pack


@api_router.post("/solution-packs", status_code=201)
async def create_solution_pack(pack: dict, admin: dict = Depends(get_current_admin)):
    """Create solution pack"""
    existing = await db.solution_packs.find_one({"slug": pack.get("slug")})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    
    pack["id"] = str(uuid.uuid4())
    pack["created_at"] = datetime.now(timezone.utc).isoformat()
    pack["updated_at"] = pack["created_at"]
    
    await db.solution_packs.insert_one(pack)
    await log_audit(admin["admin_id"], admin["email"], "create", "solution_pack", pack["id"])
    
    return {"message": "Solution pack created", "id": pack["id"]}


@api_router.put("/solution-packs/{slug}")
async def update_solution_pack(slug: str, updates: dict, admin: dict = Depends(get_current_admin)):
    """Update solution pack"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.solution_packs.update_one({"slug": slug}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Solution pack not found")
    
    pack = await db.solution_packs.find_one({"slug": slug}, {"_id": 0, "id": 1})
    await log_audit(admin["admin_id"], admin["email"], "update", "solution_pack", pack["id"])
    
    return {"message": "Solution pack updated"}


@api_router.delete("/solution-packs/{slug}")
async def delete_solution_pack(slug: str, admin: dict = Depends(get_current_admin)):
    """Delete solution pack"""
    pack = await db.solution_packs.find_one({"slug": slug}, {"_id": 0, "id": 1})
    if not pack:
        raise HTTPException(status_code=404, detail="Solution pack not found")
    
    await db.solution_packs.delete_one({"slug": slug})
    await log_audit(admin["admin_id"], admin["email"], "delete", "solution_pack", pack["id"])
    
    return {"message": "Solution pack deleted"}


# ============================================================================
# EMAIL LOGS ENDPOINT
# ============================================================================

@api_router.get("/email-logs")
async def get_email_logs(
    limit: int = Query(100, le=500),
    admin: dict = Depends(get_current_admin)
):
    """Get email send logs for debugging"""
    logs = await db.email_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs


# ============================================================================
# STORAGE STATUS ENDPOINT
# ============================================================================

@api_router.get("/storage/status")
async def get_storage_config(admin: dict = Depends(get_current_admin)):
    """Get storage configuration status"""
    return get_storage_status()


# ============================================================================
# SITE SETTINGS ENDPOINTS
# ============================================================================

DEFAULT_SETTINGS = {
    "id": "site_settings",
    "contact": {
        "phone_display": "+91 XXXXX XXXXX",
        "phone_link": "tel:+919876543210",
        "whatsapp_number": "919876543210",
        "whatsapp_link": "https://wa.me/919876543210",
        "email": "info@septagroup.in",
        "office_address": "Septa Group, Kerala, India",
        "office_address_short": "Kerala, India",
        "map_link": "",
        "operating_districts": ["Ernakulam", "Thrissur", "Kozhikode", "Trivandrum", "Kottayam"],
    },
    "enquiry": {
        "project_types": [
            "Institutional / Educational",
            "Healthcare / Wellness",
            "Commercial",
            "Residential Apartment",
            "Villa / Bungalow",
            "Mixed-use",
            "Project Management Consulting",
        ],
        "budget_ranges": [
            "Under ₹50 Lakhs",
            "₹50L – ₹1 Crore",
            "₹1Cr – ₹3 Crore",
            "₹3Cr – ₹10 Crore",
            "Above ₹10 Crore",
        ],
        "timeline_ranges": [
            "Within 3 months",
            "3–6 months",
            "6 months – 1 year",
            "1–2 years",
            "2+ years",
        ],
        "lead_notification_email": os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "admin@septa.group"),
    },
    "content_language_mode": "english_only",
    "footer_tagline": "Built with Clarity. Delivered with Discipline.",
}


@api_router.get("/settings")
async def get_site_settings():
    """Get public site settings (contact, enquiry options)"""
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        return DEFAULT_SETTINGS
    return settings


@api_router.put("/settings")
async def update_site_settings(
    updates: dict,
    admin: dict = Depends(get_current_admin)
):
    """Update site settings"""
    updates.pop("_id", None)
    updates.pop("id", None)
    updates["id"] = "site_settings"
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": updates},
        upsert=True
    )
    await log_audit(admin["admin_id"], admin["email"], "update", "site_settings", "site_settings")
    return {"message": "Settings updated"}


# ============================================================================
# PAGE CONTENT ENDPOINTS (CMS-driven About/Services)
# ============================================================================

@api_router.get("/pages/{page_id}")
async def get_page_content(page_id: str):
    """Get CMS content blocks for a page"""
    page = await db.page_content.find_one({"page_id": page_id}, {"_id": 0})
    if not page:
        return {"page_id": page_id, "blocks": []}
    return page


@api_router.put("/pages/{page_id}")
async def update_page_content(
    page_id: str,
    content: dict,
    admin: dict = Depends(get_current_admin)
):
    """Update page content blocks"""
    content.pop("_id", None)
    content["page_id"] = page_id
    content["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.page_content.update_one(
        {"page_id": page_id},
        {"$set": content},
        upsert=True
    )
    await log_audit(admin["admin_id"], admin["email"], "update", "page_content", page_id)
    return {"message": f"Page '{page_id}' updated"}


# ============================================================================
# ROOT & HEALTH
# ============================================================================

@api_router.get("/")
async def root():
    """API root"""
    return {"message": "Septa Group API v2.0", "status": "healthy"}


@api_router.get("/health")
async def health_check():
    """Health check"""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


# ============================================================================
# STARTUP: BOOTSTRAP ADMIN & SEED DATA
# ============================================================================

async def bootstrap_admin():
    """Create admin from env vars if none exists"""
    admin_count = await db.admins.count_documents({})
    if admin_count == 0:
        email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "admin@septa.group")
        password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "septa2024admin")
        
        admin = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": get_password_hash(password),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": None
        }
        await db.admins.insert_one(admin)
        logger.info(f"Bootstrap admin created: {email}")


async def migrate_json_to_db():
    """Migrate JSON content to MongoDB if DB is empty"""
    # Check if already migrated
    project_count = await db.projects.count_documents({})
    partner_count = await db.partners.count_documents({})
    
    if project_count > 0 and partner_count > 0:
        logger.info("Data already exists in DB - skipping migration")
        return
    
    frontend_content = ROOT_DIR.parent / "frontend" / "src" / "content"
    
    # Migrate projects
    if project_count == 0:
        projects_file = frontend_content / "projects.json"
        if projects_file.exists():
            with open(projects_file) as f:
                data = json.load(f)
            
            for p in data.get("projects", []):
                doc = {
                    "id": str(uuid.uuid4()),
                    "slug": p.get("slug"),
                    "title": make_bilingual(p.get("title", "")),
                    "location": p.get("location", ""),
                    "type": p.get("type", ""),
                    "project_status": p.get("status", "Completed"),
                    "sqft": p.get("sqft", ""),
                    "duration": p.get("duration", ""),
                    "year": p.get("year", ""),
                    "client_type": p.get("clientType", ""),
                    "client_lens": p.get("clientLens", ""),
                    "image": p.get("image", ""),
                    "gallery": p.get("gallery", []),
                    "short_description": make_bilingual(p.get("shortDescription", "")),
                    "challenge": make_bilingual(p.get("challenge", "")),
                    "challenge_detail": make_bilingual(p.get("challengeDetail", "")),
                    "approach_detail": make_bilingual(p.get("approachDetail", "")),
                    "outcome_detail": make_bilingual(p.get("outcomeDetail", "")),
                    "partner_stack": [
                        {
                            "partner_id": ps.get("partnerId"),
                            "role_label": ps.get("roleLabel"),
                            "contribution": make_bilingual(ps.get("contribution", ""))
                        }
                        for ps in p.get("partnerStack", [])
                    ],
                    "story": {
                        "paragraphs": [make_bilingual(para) for para in p.get("story", {}).get("storyParagraphs", [])],
                        "owner_quote": make_bilingual(p.get("story", {}).get("ownerQuote", ""))
                    } if p.get("story") else None,
                    "design": {
                        "intent": make_bilingual(p.get("design", {}).get("designIntent", "")),
                        "tags": p.get("design", {}).get("designTags", [])
                    } if p.get("design") else None,
                    "delivery": {
                        "highlights": [make_bilingual(h) for h in p.get("delivery", {}).get("deliveryHighlights", [])],
                        "septa_standards": p.get("delivery", {}).get("septaStandardApplied", [])
                    } if p.get("delivery") else None,
                    "media": None,
                    "status": "published",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.projects.insert_one(doc)
            
            logger.info(f"Migrated {len(data.get('projects', []))} projects from JSON")
    
    # Migrate partners
    if partner_count == 0:
        partners_file = frontend_content / "partners.json"
        if partners_file.exists():
            with open(partners_file) as f:
                data = json.load(f)
            
            for p in data.get("partners", []):
                doc = {
                    "id": str(uuid.uuid4()),
                    "slug": p.get("slug", p.get("id")),
                    "name": make_bilingual(p.get("name", "")),
                    "category": p.get("category", ""),
                    "specialties": p.get("specialties", []),
                    "districts": p.get("districts", []),
                    "bio_short": make_bilingual(p.get("bioShort", "")),
                    "bio_long": make_bilingual(p.get("bioLong", "")),
                    "relationship_type": p.get("relationshipType", "Project Partner"),
                    "website": p.get("website"),
                    "instagram": p.get("instagram"),
                    "email": p.get("email"),
                    "logo_url": p.get("logo"),
                    "cover_image": p.get("coverImage"),
                    "featured": p.get("featured", False),
                    "known_for": [make_bilingual(k) for k in p.get("knownFor", [])],
                    "septa_collaboration": make_bilingual(p.get("septaCollaboration", "")),
                    "status": "published",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
                await db.partners.insert_one(doc)
            
            logger.info(f"Migrated {len(data.get('partners', []))} partners from JSON")
    
    # Seed testimonials if empty
    testimonial_count = await db.testimonials.count_documents({})
    if testimonial_count == 0:
        testimonials = [
            {
                "id": str(uuid.uuid4()),
                "client_name": "P. Rajan",
                "client_role": "Principal, Educational Institution, Thrissur",
                "project_type": "Institutional",
                "content": make_bilingual("Septa's structured approach gave us confidence throughout the entire build. Weekly reports were clear and consistent."),
                "rating": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "client_name": "Dr. S. Nair",
                "client_role": "Managing Director, Healthcare Facility, Ernakulam",
                "project_type": "Healthcare",
                "content": make_bilingual("The M&E coordination was handled professionally at every stage. We passed the Health Department inspection on first submission."),
                "rating": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "client_name": "A. Menon",
                "client_role": "Developer, Residential Project, Kozhikode",
                "project_type": "Residential",
                "content": make_bilingual("Septa's finish quality and documentation discipline is a full level above the rest. Our apartment buyers had fewer handover complaints."),
                "rating": 5,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        for t in testimonials:
            await db.testimonials.insert_one(t)
        logger.info("Seeded testimonials")


async def seed_solution_packs():
    """Seed default solution packs if none exist"""
    pack_count = await db.solution_packs.count_documents({})
    if pack_count > 0:
        return
    
    packs = [
        {
            "id": str(uuid.uuid4()),
            "slug": "premium-home",
            "name": {"en": "Premium Home Pack", "ml": None},
            "tagline": {"en": "For clients building a home that is meant to last and feel entirely their own.", "ml": None},
            "description": {"en": "A coordinated team of specialists for luxury residential projects, from concept to handover.", "ml": None},
            "who_its_for": {"en": "Homeowners seeking a bespoke residence with premium finishes and integrated smart home systems.", "ml": None},
            "partner_categories": [
                "Architecture & Design",
                "Interiors & Fit-out",
                "Landscape & Outdoor",
                "Smart Home / Security / Automation",
                "Lighting Design"
            ],
            "typical_timeline": "18-24 months",
            "disclaimers": {"en": "Septa coordinates introductions and project delivery. Each partner is contracted independently. No guaranteed outcomes on design or timeline.", "ml": None},
            "featured": True,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "retail-launch",
            "name": {"en": "Retail Launch Pack", "ml": None},
            "tagline": {"en": "For developers launching a commercial address that needs to attract tenants before completion.", "ml": None},
            "description": {"en": "A coordinated team for commercial projects requiring leasing support, branding, and marketing.", "ml": None},
            "who_its_for": {"en": "Developers of shopping centres, office complexes, and mixed-use buildings.", "ml": None},
            "partner_categories": [
                "Architecture & Design",
                "MEP Engineering",
                "Interiors & Fit-out",
                "Branding, Signage & Wayfinding",
                "Marketing & Digital",
                "Leasing & Real Estate"
            ],
            "typical_timeline": "24-36 months",
            "disclaimers": {"en": "Septa provides introductions and coordination support. No guaranteed occupancy or revenue outcomes.", "ml": None},
            "featured": True,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "institutional-excellence",
            "name": {"en": "Institutional Excellence Pack", "ml": None},
            "tagline": {"en": "For institutional clients delivering a campus or civic building with operational continuity requirements.", "ml": None},
            "description": {"en": "A comprehensive team for schools, hospitals, and government buildings requiring phased delivery.", "ml": None},
            "who_its_for": {"en": "Educational institutions, healthcare facilities, and public sector organizations.", "ml": None},
            "partner_categories": [
                "Architecture & Design",
                "Structural Engineering",
                "MEP Engineering",
                "Quantity Surveying",
                "Legal / Compliance / Approvals"
            ],
            "typical_timeline": "24-48 months",
            "disclaimers": {"en": "Septa manages phased delivery coordination. Regulatory approvals and compliance are client responsibility with partner support.", "ml": None},
            "featured": True,
            "status": "published",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for pack in packs:
        await db.solution_packs.insert_one(pack)
    logger.info("Seeded solution packs")


async def migrate_partners_schema():
    """Migrate existing partners to new schema with media fields"""
    partners = await db.partners.find({}).to_list(1000)
    migrated = 0
    for p in partners:
        updates = {}
        # Add media object if missing
        if "media" not in p:
            updates["media"] = {
                "card_image": p.get("cover_image") or p.get("logo_url"),
                "logo_image": p.get("logo_url"),
                "hero_image": p.get("cover_image"),
                "gallery_images": []
            }
        # Migrate old field names
        if "website" in p and "website_url" not in p:
            updates["website_url"] = p.get("website")
        if "instagram" in p and "instagram_url" not in p:
            updates["instagram_url"] = p.get("instagram")
        if "email" in p and "contact_email" not in p and p.get("email") and "@" in str(p.get("email", "")):
            updates["contact_email"] = p.get("email")
        if "featured" in p and "is_featured" not in p:
            updates["is_featured"] = p.get("featured", False)
        if "sort_order" not in p:
            updates["sort_order"] = 0
        if "contact_phone" not in p:
            updates["contact_phone"] = None
        
        if updates:
            await db.partners.update_one({"_id": p["_id"]}, {"$set": updates})
            migrated += 1
    
    if migrated:
        logger.info(f"Migrated {migrated} partners to new schema")


async def seed_site_settings():
    """Seed default site settings if not present"""
    existing = await db.site_settings.find_one({"id": "site_settings"})
    if not existing:
        await db.site_settings.insert_one({**DEFAULT_SETTINGS, "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded default site settings")


async def seed_page_content():
    """Seed initial page content for About and Services if not present"""
    for page_id in ["about", "services"]:
        existing = await db.page_content.find_one({"page_id": page_id})
        if existing:
            continue
        
        if page_id == "about":
            blocks = [
                {"id": str(uuid.uuid4()), "block_type": "metrics", "order": 0, "title": {"en": "20+", "ml": None}, "subtitle": {"en": "Years of Construction Delivery", "ml": None}, "body": {"en": "", "ml": None}, "metadata": {"key": "years"}},
                {"id": str(uuid.uuid4()), "block_type": "metrics", "order": 1, "title": {"en": "5", "ml": None}, "subtitle": {"en": "Districts Served Across Kerala", "ml": None}, "body": {"en": "", "ml": None}, "metadata": {"key": "districts"}},
                {"id": str(uuid.uuid4()), "block_type": "metrics", "order": 2, "title": {"en": "150+", "ml": None}, "subtitle": {"en": "Projects Delivered", "ml": None}, "body": {"en": "", "ml": None}, "metadata": {"key": "projects"}},
                {"id": str(uuid.uuid4()), "block_type": "metrics", "order": 3, "title": {"en": "Weekly", "ml": None}, "subtitle": {"en": "Client Reporting Cadence", "ml": None}, "body": {"en": "", "ml": None}, "metadata": {"key": "reporting"}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 0, "title": {"en": "Scope Clarity", "ml": None}, "body": {"en": "Every project starts with detailed scope documentation — materials, specifications, timelines — before work begins.", "ml": None}, "icon": "clipboard-list", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 1, "title": {"en": "Weekly Reporting", "ml": None}, "body": {"en": "Clients receive weekly progress updates with photos, spend tracking, and next-week previews.", "ml": None}, "icon": "bar-chart-2", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 2, "title": {"en": "Quality Checkpoints", "ml": None}, "body": {"en": "Structured quality gates at foundation, structure, MEP rough-in, finishing, and handover.", "ml": None}, "icon": "check-circle", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 3, "title": {"en": "Change Control", "ml": None}, "body": {"en": "All scope changes are documented, priced, and approved before execution. No surprise costs.", "ml": None}, "icon": "file-text", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 4, "title": {"en": "Snag Handover", "ml": None}, "body": {"en": "Systematic snag list resolution with photo documentation before final handover.", "ml": None}, "icon": "search", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "timeline_step", "order": 5, "title": {"en": "Post-Handover Support", "ml": None}, "body": {"en": "12-month defect liability period with responsive support for any issues.", "ml": None}, "icon": "shield", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "team_member", "order": 0, "title": {"en": "Founding Team", "ml": None}, "body": {"en": "Two decades of construction delivery experience across institutional, healthcare, and commercial sectors in Kerala.", "ml": None}, "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "proof_callout", "order": 0, "title": {"en": "Phased delivery during active academic year", "ml": None}, "body": {"en": "St. Thomas School — new academic block built while 2,000+ students continued classes with zero disruption.", "ml": None}, "link_url": "/projects/st-thomas-school-thrissur", "link_label": "View project", "metadata": {}},
                {"id": str(uuid.uuid4()), "block_type": "proof_callout", "order": 1, "title": {"en": "Healthcare facility first-submission approval", "ml": None}, "body": {"en": "Lakeview Medical Centre passed the Health Department inspection on first submission.", "ml": None}, "link_url": "/projects/lakeview-medical-centre-ernakulam", "link_label": "View project", "metadata": {}},
            ]
        else:
            blocks = [
                {"id": str(uuid.uuid4()), "block_type": "comparison_row", "order": 0, "title": {"en": "Scope Documentation", "ml": None}, "body": {"en": "Detailed BOQ, specs, and material schedule before work starts", "ml": None}, "metadata": {"traditional": "Verbal agreements, scope changes on-site"}},
                {"id": str(uuid.uuid4()), "block_type": "comparison_row", "order": 1, "title": {"en": "Progress Reporting", "ml": None}, "body": {"en": "Weekly photo reports with spend tracking and forecasts", "ml": None}, "metadata": {"traditional": "Updates only when you visit the site"}},
                {"id": str(uuid.uuid4()), "block_type": "comparison_row", "order": 2, "title": {"en": "Quality Assurance", "ml": None}, "body": {"en": "Structured QA gates at each construction phase", "ml": None}, "metadata": {"traditional": "Quality depends on supervisor presence"}},
                {"id": str(uuid.uuid4()), "block_type": "comparison_row", "order": 3, "title": {"en": "Change Management", "ml": None}, "body": {"en": "Documented change orders with cost impact before execution", "ml": None}, "metadata": {"traditional": "Surprise bills and scope creep"}},
                {"id": str(uuid.uuid4()), "block_type": "comparison_row", "order": 4, "title": {"en": "Handover Process", "ml": None}, "body": {"en": "Systematic snag list, documentation package, warranty period", "ml": None}, "metadata": {"traditional": "Informal handover, unresolved issues"}},
            ]
        
        doc = {
            "page_id": page_id,
            "blocks": blocks,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.page_content.insert_one(doc)
        logger.info(f"Seeded page content: {page_id}")


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    set_email_logs_collection(db.email_logs)
    
    await bootstrap_admin()
    await migrate_json_to_db()
    await seed_solution_packs()
    await migrate_partners_schema()
    await seed_site_settings()
    await seed_page_content()
    logger.info("Septa API started successfully")


# ============================================================================
# APP SETUP
# ============================================================================

app.include_router(api_router)

# Mount static files for local uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    """Cleanup on shutdown"""
    client.close()
