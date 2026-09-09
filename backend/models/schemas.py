"""
Enhanced Pydantic models for Septa Group CMS
Includes bilingual support, partner media, site settings, page content
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


# --- Enums ---

class PublishStatus(str, Enum):
    draft = "draft"
    published = "published"


class RelationshipType(str, Enum):
    group_company = "Group Company"
    core_partner = "Core Partner"
    project_partner = "Project Partner"
    preferred_vendor = "Preferred Vendor"


# --- Bilingual Content Helper ---

class BilingualText(BaseModel):
    en: str = ""
    ml: Optional[str] = None


# --- Media Models ---

class MediaItem(BaseModel):
    id: Optional[str] = None
    url: str
    thumbnail_url: Optional[str] = None
    poster_url: Optional[str] = None
    type: str = "image"
    caption: Optional[BilingualText] = None
    order: int = 0


class ProjectMedia(BaseModel):
    hero_video: Optional[MediaItem] = None
    hero_poster: Optional[str] = None
    owner_testimonial_video: Optional[MediaItem] = None
    gallery: List[MediaItem] = []
    plan_drawings: List[MediaItem] = []
    renders_3d: List[MediaItem] = []
    model_3d_url: Optional[str] = None
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
    partner_ref: Optional[str] = ""
    service_ref: Optional[str] = ""


class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


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


# --- Partner Model (upgraded) ---

class PartnerMedia(BaseModel):
    card_image: Optional[str] = None
    logo_image: Optional[str] = None
    hero_image: Optional[str] = None
    gallery_images: List[str] = []


class PartnerBase(BaseModel):
    slug: str
    name: BilingualText
    category: str
    specialties: List[str] = []
    districts: List[str] = []
    bio_short: BilingualText = BilingualText()
    bio_long: BilingualText = BilingualText()
    relationship_type: str = "Project Partner"
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    sort_order: int = 0
    is_featured: bool = False
    media: PartnerMedia = PartnerMedia()
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
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    sort_order: Optional[int] = None
    is_featured: Optional[bool] = None
    media: Optional[PartnerMedia] = None
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
    project_status: str
    sqft: str
    duration: str
    year: str
    client_type: str
    client_lens: str
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
    media_visible: bool = True


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
    media_visible: Optional[bool] = None
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
    action: str
    resource_type: str
    resource_id: str
    changes: Optional[Dict[str, Any]] = None
    timestamp: str


# --- Export Model ---

class ContentExport(BaseModel):
    projects: List[Dict[str, Any]]
    partners: List[Dict[str, Any]]
    exported_at: str
    exported_by: str


# --- Site Settings Model ---

class SiteContactSettings(BaseModel):
    phone_display: str = ""
    phone_link: str = ""
    whatsapp_number: str = ""
    whatsapp_link: str = ""
    email: str = ""
    office_address: str = ""
    office_address_short: str = ""
    map_link: str = ""
    operating_districts: List[str] = []


class EnquiryFormSettings(BaseModel):
    project_types: List[str] = []
    budget_ranges: List[str] = []
    timeline_ranges: List[str] = []
    lead_notification_email: str = ""


class NavVisibilitySettings(BaseModel):
    about: bool = True
    services: bool = True
    projects: bool = True
    ecosystem: bool = True
    contact: bool = True


class SiteSettings(BaseModel):
    contact: SiteContactSettings = SiteContactSettings()
    enquiry: EnquiryFormSettings = EnquiryFormSettings()
    nav_visibility: NavVisibilitySettings = NavVisibilitySettings()
    content_language_mode: str = "english_only"
    footer_tagline: str = "Built with Clarity. Delivered with Discipline."


# --- Page Content Model (CMS-driven About/Services) ---

class ContentBlock(BaseModel):
    id: Optional[str] = None
    block_type: str  # hero, metrics, timeline_step, team_member, proof_callout, comparison_row
    order: int = 0
    title: BilingualText = BilingualText()
    subtitle: BilingualText = BilingualText()
    body: BilingualText = BilingualText()
    image_url: Optional[str] = None
    icon: Optional[str] = None
    link_url: Optional[str] = None
    link_label: Optional[str] = None
    metadata: Dict[str, Any] = {}


class PageContent(BaseModel):
    page_id: str  # about, services
    blocks: List[ContentBlock] = []
    updated_at: Optional[str] = None
