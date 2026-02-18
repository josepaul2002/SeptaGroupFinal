"""
Enhanced Pydantic models for Septa Group CMS
Includes bilingual support structure and media system fields
"""
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


# --- Enums ---

class PublishStatus(str, Enum):
    draft = "draft"
    published = "published"


class PartnerCategory(str, Enum):
    architecture_design = "Architecture & Design"
    interiors_fitout = "Interiors & Fit-out"
    engineering = "Engineering (MEP/Structural/QS)"
    landscape_outdoor = "Landscape & Outdoor"
    materials_vendors = "Materials & Vendors"
    smart_home_tech = "Smart Home / Technology"
    branding_signage = "Branding, Signage & Wayfinding"
    marketing_digital = "Marketing & Digital"
    leasing_realestate = "Leasing & Real Estate"
    legal_finance = "Legal / Finance"


class RelationshipType(str, Enum):
    group_company = "Group Company"
    core_partner = "Core Partner"
    project_partner = "Project Partner"
    preferred_vendor = "Preferred Vendor"


# --- Bilingual Content Helper ---

class BilingualText(BaseModel):
    en: str = ""
    ml: Optional[str] = None  # Malayalam - fallback to English if None


# --- Media Models (P2 ready) ---

class MediaItem(BaseModel):
    id: Optional[str] = None
    url: str
    thumbnail_url: Optional[str] = None
    poster_url: Optional[str] = None
    type: str = "image"  # image, video, pdf, model_3d
    caption: Optional[BilingualText] = None
    order: int = 0


class ProjectMedia(BaseModel):
    hero_video: Optional[MediaItem] = None
    hero_poster: Optional[str] = None
    owner_testimonial_video: Optional[MediaItem] = None
    gallery: List[MediaItem] = []
    plan_drawings: List[MediaItem] = []
    renders_3d: List[MediaItem] = []
    model_3d_url: Optional[str] = None  # GLB/GLTF URL
    plans_public: bool = False


# --- Partner Stack ---

class PartnerStackItem(BaseModel):
    partner_id: str
    role_label: str
    contribution: Optional[BilingualText] = None


# --- Story/Design/Delivery Modules ---

class StoryModule(BaseModel):
    paragraphs: List[BilingualText] = []
    owner_quote: Optional[BilingualText] = None


class DesignModule(BaseModel):
    intent: Optional[BilingualText] = None
    tags: List[str] = []


class DeliveryModule(BaseModel):
    highlights: List[BilingualText] = []
    septa_standards: List[str] = []


# --- Lead Model ---

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: str = ""
    project_location: Optional[str] = ""
    project_type: Optional[str] = ""
    budget_range: Optional[str] = ""
    timeline: Optional[str] = ""
    message: Optional[str] = ""
    honeypot: Optional[str] = ""
    page_source: Optional[str] = ""


class LeadStatusUpdate(BaseModel):
    status: str


class LeadResponse(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    project_location: str
    project_type: str
    budget_range: str
    timeline: str
    message: str
    status: str
    created_at: str
    email_sent: bool = False
    admin_notified: bool = False


# --- Partner Model ---

class PartnerBase(BaseModel):
    slug: str
    name: BilingualText
    category: str
    specialties: List[str] = []
    districts: List[str] = []
    bio_short: BilingualText
    bio_long: BilingualText
    relationship_type: str = "Project Partner"
    website: Optional[str] = None
    instagram: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image: Optional[str] = None
    featured: bool = False
    known_for: List[BilingualText] = []
    septa_collaboration: Optional[BilingualText] = None


class PartnerCreate(PartnerBase):
    status: PublishStatus = PublishStatus.draft


class PartnerUpdate(BaseModel):
    name: Optional[BilingualText] = None
    category: Optional[str] = None
    specialties: Optional[List[str]] = None
    districts: Optional[List[str]] = None
    bio_short: Optional[BilingualText] = None
    bio_long: Optional[BilingualText] = None
    relationship_type: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image: Optional[str] = None
    featured: Optional[bool] = None
    known_for: Optional[List[BilingualText]] = None
    septa_collaboration: Optional[BilingualText] = None
    status: Optional[PublishStatus] = None


class PartnerResponse(PartnerBase):
    id: str
    status: PublishStatus
    created_at: str
    updated_at: Optional[str] = None


# --- Project Model ---

class ProjectBase(BaseModel):
    slug: str
    title: BilingualText
    location: str
    type: str
    project_status: str  # Completed, Ongoing
    sqft: str
    duration: str
    year: str
    client_type: str
    client_lens: str  # Residential, Commercial, Institutional
    image: str
    gallery: List[str] = []
    short_description: BilingualText
    challenge: BilingualText
    challenge_detail: BilingualText
    approach_detail: BilingualText
    outcome_detail: BilingualText
    partner_stack: List[PartnerStackItem] = []
    story: Optional[StoryModule] = None
    design: Optional[DesignModule] = None
    delivery: Optional[DeliveryModule] = None
    media: Optional[ProjectMedia] = None


class ProjectCreate(ProjectBase):
    status: PublishStatus = PublishStatus.draft


class ProjectUpdate(BaseModel):
    title: Optional[BilingualText] = None
    location: Optional[str] = None
    type: Optional[str] = None
    project_status: Optional[str] = None
    sqft: Optional[str] = None
    duration: Optional[str] = None
    year: Optional[str] = None
    client_type: Optional[str] = None
    client_lens: Optional[str] = None
    image: Optional[str] = None
    gallery: Optional[List[str]] = None
    short_description: Optional[BilingualText] = None
    challenge: Optional[BilingualText] = None
    challenge_detail: Optional[BilingualText] = None
    approach_detail: Optional[BilingualText] = None
    outcome_detail: Optional[BilingualText] = None
    partner_stack: Optional[List[PartnerStackItem]] = None
    story: Optional[StoryModule] = None
    design: Optional[DesignModule] = None
    delivery: Optional[DeliveryModule] = None
    media: Optional[ProjectMedia] = None
    status: Optional[PublishStatus] = None


class ProjectResponse(ProjectBase):
    id: str
    status: PublishStatus
    created_at: str
    updated_at: Optional[str] = None


# --- Testimonial Model ---

class TestimonialBase(BaseModel):
    client_name: str
    client_role: str
    project_type: str
    content: BilingualText
    rating: int = 5


class TestimonialCreate(TestimonialBase):
    pass


class TestimonialResponse(TestimonialBase):
    id: str
    created_at: str


# --- Admin Auth Models ---

class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: str
    email: str


class AdminPasswordChange(BaseModel):
    current_password: str
    new_password: str


class AdminUser(BaseModel):
    id: str
    email: str
    created_at: str
    last_login: Optional[str] = None


# --- Audit Log Model ---

class AuditLogEntry(BaseModel):
    id: str
    admin_id: str
    admin_email: str
    action: str  # create, update, delete
    resource_type: str  # project, partner, lead
    resource_id: str
    changes: Optional[Dict[str, Any]] = None
    timestamp: str


# --- Export Model ---

class ContentExport(BaseModel):
    projects: List[Dict[str, Any]]
    partners: List[Dict[str, Any]]
    exported_at: str
    exported_by: str
