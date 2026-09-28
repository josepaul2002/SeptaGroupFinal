"""
Enhanced Pydantic models for Septa Group CMS
Includes bilingual support, partner media, site settings, page content
"""
from pydantic import BaseModel, Field, model_validator, field_validator, ConfigDict
from typing import List, Optional, Dict, Any, Literal
from enum import Enum


# --- Enums ---

class PublishStatus(str, Enum):
    draft = "draft"
    review = "review"
    published = "published"
    archived = "archived"


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
    model_config = ConfigDict(extra="allow")
    url: str
    caption: Optional[BilingualText] = None
    alt: str = ""
    credit: str = ""
    kind: Literal["photograph", "render", "concept", "plan", "video"] = "photograph"
    approved: bool = False
    order: int = 0

    @model_validator(mode="before")
    @classmethod
    def legacy(cls, value):
        return {"url": value} if isinstance(value, str) else value


class ProjectMedia(BaseModel):
    hero_video: Optional[str] = None
    hero_poster: Optional[str] = None
    owner_testimonial_video: Optional[str] = None
    images: List[MediaItem] = Field(default_factory=list)
    plans: List[MediaItem] = Field(default_factory=list)
    renders_3d: List[MediaItem] = Field(default_factory=list)
    model_3d: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    virtual_tour_label: str = ''
    tour_public: bool = False
    plans_public: bool = False

    @field_validator('virtual_tour_url')
    @classmethod
    def valid_tour(cls, value):
        if value and not value.startswith('https://'):
            raise ValueError('Virtual tours must use a public HTTPS link.')
        return value

    @model_validator(mode="before")
    @classmethod
    def normalise_legacy(cls, value):
        value = dict(value or {})
        for old, new in [("gallery", "images"), ("plan_drawings", "plans"), ("model_3d_url", "model_3d")]:
            if old in value and new not in value:
                value[new] = value[old]
        for field in ["hero_video", "owner_testimonial_video", "model_3d"]:
            if isinstance(value.get(field), dict):
                value[field] = value[field].get("url")
        return value


class SEOSettings(BaseModel):
    title: str = Field(default="", max_length=180)
    description: str = Field(default="", max_length=400)
    image: str = ""
    noindex: bool = False


class ProjectCredit(BaseModel):
    entity_type: Literal["partner", "leader"]
    entity_slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    role: str = Field(min_length=2, max_length=120)
    contribution: BilingualText = Field(default_factory=BilingualText)
    display_as: Literal["profile", "company"] = "profile"
    affiliation_url: str = ""
    affiliation_at_time: str = ""
    verified: bool = False


class HighlightFact(BaseModel):
    value: str = Field(max_length=16)
    label: str = Field(max_length=48)
    visible: bool = True


class LeaderCreate(BaseModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: BilingualText = Field(default_factory=BilingualText)
    title: BilingualText = Field(default_factory=BilingualText)
    bio: BilingualText = Field(default_factory=BilingualText)
    photo: str = ""
    hierarchy_rank: int = Field(default=100, ge=0, le=999)
    highlights: List[HighlightFact] = Field(default_factory=list, max_length=4)
    expertise: List[str] = Field(default_factory=list)
    qualifications: List[str] = Field(default_factory=list)
    status: PublishStatus = PublishStatus.draft
    publication_reviewed: bool = False
    seo: SEOSettings = Field(default_factory=SEOSettings)


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


class ProjectTabVisibility(BaseModel):
    story: bool = True
    design: bool = True
    delivery: bool = True
    partners: bool = True


# --- Lead Model ---

class LeadCreate(BaseModel):
    answers: dict[str, str] = Field(default_factory=dict, max_length=30)

    @field_validator('answers')
    @classmethod
    def answer_limits(cls, values):
        if any(len(k)>80 or len(v)>2000 for k,v in values.items()):
            raise ValueError('Enquiry answers must be no longer than 2000 characters.')
        return values

    preferred_contact: Literal["phone", "email", "whatsapp"] = "phone"
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=32)
    email: str = Field(default="", max_length=254)
    project_location: Optional[str] = ""
    project_type: Optional[str] = ""
    budget_range: Optional[str] = ""
    timeline: Optional[str] = ""
    message: Optional[str] = Field(default="", max_length=5000)
    honeypot: Optional[str] = ""
    page_source: Optional[str] = ""
    partner_ref: Optional[str] = ""
    service_ref: Optional[str] = ""
    leader_ref: str = Field(default="", max_length=160)
    project_ref: str = Field(default="", max_length=160)
    enquiry_type: Literal["project", "introduction", "collaboration"] = "project"
    submission_id: Optional[str] = Field(default=None, pattern=r"^[a-zA-Z0-9-]{16,80}$")
    landing_page: str = Field(default="", max_length=500)
    submission_page: str = Field(default="", max_length=500)
    referral_source: str = Field(default="", max_length=250)
    utm_source: str = Field(default="", max_length=150)
    utm_medium: str = Field(default="", max_length=150)
    utm_campaign: str = Field(default="", max_length=150)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value):
        if not value:
            return ""
        from email_validator import validate_email
        return validate_email(value, check_deliverability=False).normalized



class LeadStatusUpdate(BaseModel):
    status: Literal["new", "contacted", "qualified", "closed", "archived"] = "new"
    notes: Optional[str] = Field(default=None, max_length=10000)
    owner: Optional[str] = Field(default=None, max_length=120)
    next_action: Optional[str] = Field(default=None, max_length=500)
    follow_up_at: Optional[str] = Field(default=None, max_length=40)


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
    videos: List[str] = Field(default_factory=list)
    video_posters: List[str] = Field(default_factory=list)
    portrait_image: Optional[str] = None
    card_image: Optional[str] = None
    card_images: List[str] = Field(default_factory=list, max_length=6)
    logo_image: Optional[str] = None
    show_logo: bool = False
    hero_image: Optional[str] = None
    gallery_images: List[str] = []


class PartnerBase(BaseModel):
    profile_type: Literal["person", "company"] = "company"
    professional_role: BilingualText = Field(default_factory=BilingualText)
    firm: str = ""
    publication_reviewed: bool = False
    seo: SEOSettings = Field(default_factory=SEOSettings)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: BilingualText
    category: str
    specialties: List[str] = []
    highlights: List[HighlightFact] = Field(default_factory=list, max_length=4)
    districts: List[str] = []
    bio_short: BilingualText = BilingualText()
    bio_long: BilingualText = BilingualText()
    relationship_type: str = "Project Partner"
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
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
    profile_type: Optional[Literal["person", "company"]] = None
    professional_role: Optional[BilingualText] = None
    firm: Optional[str] = None
    publication_reviewed: Optional[bool] = None
    seo: Optional[SEOSettings] = None
    name: Optional[BilingualText] = None
    category: Optional[str] = None
    specialties: Optional[List[str]] = None
    districts: Optional[List[str]] = None
    bio_short: Optional[BilingualText] = None
    bio_long: Optional[BilingualText] = None
    relationship_type: Optional[str] = None
    website_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
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
    publication_reviewed: bool = False
    scope: BilingualText = Field(default_factory=BilingualText)
    credits: List[ProjectCredit] = Field(default_factory=list)
    seo: SEOSettings = Field(default_factory=SEOSettings)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
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
    challenge_detail: BilingualText = Field(default_factory=BilingualText)
    approach_detail: BilingualText = Field(default_factory=BilingualText)
    outcome_detail: BilingualText = Field(default_factory=BilingualText)
    partner_stack: List[PartnerStackItem] = []
    story: Optional[StoryModule] = None
    design: Optional[DesignModule] = None
    delivery: Optional[DeliveryModule] = None
    media: Optional[ProjectMedia] = None
    media_visible: bool = True
    tab_visibility: ProjectTabVisibility = ProjectTabVisibility()


class ProjectCreate(ProjectBase):
    status: PublishStatus = PublishStatus.draft


class ProjectUpdate(BaseModel):
    publication_reviewed: Optional[bool] = None
    scope: Optional[BilingualText] = None
    credits: Optional[List[ProjectCredit]] = None
    seo: Optional[SEOSettings] = None
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
    tab_visibility: Optional[ProjectTabVisibility] = None
    status: Optional[PublishStatus] = None


class ProjectResponse(ProjectBase):
    id: str
    status: PublishStatus
    created_at: str
    updated_at: Optional[str] = None


# --- Testimonial Model ---

class TestimonialBase(BaseModel):
    profile_image: str = ""
    cover_image: str = ""
    completed_project: bool = False
    status: PublishStatus = PublishStatus.draft
    publication_reviewed: bool = False
    project_ref: str = ""
    client_name: str
    client_role: str
    project_type: str = ""
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
    role: str = "owner"


class AdminPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=12, max_length=72)


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
    facebook_url: str = ""
    instagram_url: str = ""
    phone_display: str = ""
    phone_link: str = ""
    whatsapp_number: str = ""
    whatsapp_link: str = ""
    email: str = ""
    office_address: str = ""
    office_address_short: str = ""
    map_link: str = ""
    contact_person: str = ""
    contact_person_role: str = ""
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
