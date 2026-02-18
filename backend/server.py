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
    PartnerCreate, PartnerUpdate, PartnerResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    TestimonialCreate, TestimonialResponse,
    AdminLoginRequest, AdminLoginResponse, AdminPasswordChange, AdminUser,
    AuditLogEntry, ContentExport, PublishStatus,
    BilingualText, PartnerStackItem, StoryModule, DesignModule, DeliveryModule, ProjectMedia
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
@limiter.limit("10/minute")
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
async def get_leads(admin: dict = Depends(get_current_admin)):
    """Get all leads (admin only)"""
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return leads


@api_router.patch("/leads/{lead_id}")
async def update_lead_status(
    lead_id: str,
    update: LeadStatusUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update lead status"""
    result = await db.leads.update_one(
        {"id": lead_id},
        {"$set": {"status": update.status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    await log_audit(admin["admin_id"], admin["email"], "update", "lead", lead_id, {"status": update.status})
    return {"message": "Status updated"}


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
    
    partners = await db.partners.find(query, {"_id": 0}).to_list(1000)
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
    limit: int = Query(100, le=500),
    admin: dict = Depends(get_current_admin)
):
    """Get audit logs"""
    logs = await db.audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs


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


@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    # Set email logs collection for email service
    set_email_logs_collection(db.email_logs)
    
    await bootstrap_admin()
    await migrate_json_to_db()
    await seed_solution_packs()
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
