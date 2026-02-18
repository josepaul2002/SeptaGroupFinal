from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Models ---

class LeadCreate(BaseModel):
    name: str
    phone: str
    email: str
    project_location: Optional[str] = ""
    project_type: Optional[str] = ""
    budget_range: Optional[str] = ""
    timeline: Optional[str] = ""
    message: Optional[str] = ""
    honeypot: Optional[str] = ""


class Project(BaseModel):
    slug: str
    title: str
    location: str
    type: str
    status: str
    sqft: str
    duration: str
    year: str
    client_type: str
    image: str
    gallery: List[str] = []
    short_description: str
    challenge: str
    challenge_detail: str
    approach_detail: str
    outcome_detail: str
    septa_standards: List[str] = []


class Testimonial(BaseModel):
    client_name: str
    client_role: str
    project_type: str
    content: str
    rating: int = 5


class AdminAuth(BaseModel):
    password: str


class LeadStatusUpdate(BaseModel):
    status: str


# --- Lead endpoints ---

@api_router.post("/leads", status_code=201)
async def create_lead(lead: LeadCreate):
    if lead.honeypot:
        return {"message": "Thank you for your enquiry."}
    doc = lead.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "new"
    doc["id"] = str(uuid.uuid4())
    await db.leads.insert_one(doc)
    return {"message": "Enquiry received. We will contact you within 24 hours.", "id": doc["id"]}


@api_router.get("/leads")
async def get_leads():
    leads = await db.leads.find({}, {"_id": 0}).to_list(1000)
    return leads


@api_router.patch("/leads/{lead_id}")
async def update_lead_status(lead_id: str, update: LeadStatusUpdate):
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": update.status}})
    return {"message": "Status updated"}


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str):
    await db.leads.delete_one({"id": lead_id})
    return {"message": "Lead deleted"}


# --- Project endpoints ---

@api_router.get("/projects")
async def get_projects(type: Optional[str] = None, status: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    if status:
        query["status"] = status
    projects = await db.projects.find(query, {"_id": 0}).to_list(1000)
    return projects


@api_router.get("/projects/{slug}")
async def get_project(slug: str):
    project = await db.projects.find_one({"slug": slug}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@api_router.post("/projects", status_code=201)
async def create_project(project: Project):
    existing = await db.projects.find_one({"slug": project.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = project.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.projects.insert_one(doc)
    return {"message": "Project created", "id": doc["id"]}


@api_router.put("/projects/{slug}")
async def update_project(slug: str, project: Project):
    result = await db.projects.update_one({"slug": slug}, {"$set": project.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project updated"}


@api_router.delete("/projects/{slug}")
async def delete_project(slug: str):
    await db.projects.delete_one({"slug": slug})
    return {"message": "Project deleted"}


# --- Testimonial endpoints ---

@api_router.get("/testimonials")
async def get_testimonials():
    testimonials = await db.testimonials.find({}, {"_id": 0}).to_list(1000)
    return testimonials


@api_router.post("/testimonials", status_code=201)
async def create_testimonial(testimonial: Testimonial):
    doc = testimonial.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.testimonials.insert_one(doc)
    return {"message": "Testimonial created", "id": doc["id"]}


@api_router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, testimonial: Testimonial):
    await db.testimonials.update_one({"id": testimonial_id}, {"$set": testimonial.model_dump()})
    return {"message": "Testimonial updated"}


@api_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str):
    await db.testimonials.delete_one({"id": testimonial_id})
    return {"message": "Testimonial deleted"}


# --- Admin auth ---

@api_router.post("/admin/auth")
async def admin_auth(auth: AdminAuth):
    admin_password = os.environ.get("ADMIN_PASSWORD", "septa2024")
    if auth.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    return {"authenticated": True, "message": "Welcome to Septa Admin"}


# --- Root ---

@api_router.get("/")
async def root():
    return {"message": "Septa Group API v1.0"}


# --- Seed data ---

def _seed_projects():
    return [
        {
            "id": str(uuid.uuid4()),
            "slug": "st-thomas-school-thrissur",
            "title": "St. Thomas School of Excellence",
            "location": "Thrissur, Kerala",
            "type": "Institutional",
            "status": "Completed",
            "sqft": "42,000",
            "duration": "18 months",
            "year": "2023",
            "client_type": "Educational Institution",
            "image": "https://images.unsplash.com/photo-1562774053-701939374585?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1562774053-701939374585?w=900&q=80",
                "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=900&q=80",
                "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=900&q=80"
            ],
            "short_description": "A four-storey academic campus with integrated library, science labs, and multipurpose hall — delivered across three phased builds during an active academic year.",
            "challenge": "Phased delivery during active academic year with 1,200 enrolled students",
            "challenge_detail": "Construction had to proceed in strict phases to avoid disrupting ongoing academic sessions. Site access, noise controls, and dust management required daily coordination with school administration.",
            "approach_detail": "We mapped a three-phase schedule aligned to school holidays and weekend windows. Structural work was sequenced to completed wings first, while fit-out of the new block proceeded in parallel. A dedicated site foreman managed daily handoff between academic staff and construction teams.",
            "outcome_detail": "Campus delivered on schedule with zero disruption to the academic calendar. RCC quality audited externally at each floor level. The client cited Septa's communication protocols as the differentiating factor in the final tender decision.",
            "septa_standards": ["Phased site access plan", "Weekly principal briefings", "Noise compliance schedule", "Third-party RCC audit", "Snag-to-handover protocol"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "lakeview-medical-centre-ernakulam",
            "title": "Lakeview Medical Centre",
            "location": "Ernakulam, Kerala",
            "type": "Healthcare",
            "status": "Completed",
            "sqft": "28,500",
            "duration": "14 months",
            "year": "2022",
            "client_type": "Private Healthcare Provider",
            "image": "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=900&q=80",
                "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=900&q=80"
            ],
            "short_description": "A multi-speciality outpatient and diagnostic centre built to stringent hygiene, waterproofing, and M&E coordination standards.",
            "challenge": "Healthcare-grade finishes with tight M&E trade coordination",
            "challenge_detail": "Healthcare environments demand a higher-than-standard grade of waterproofing, wall finish precision, and HVAC integration. Six trade contractors required coordinated scheduling to avoid costly rework.",
            "approach_detail": "Dedicated M&E coordination drawings were prepared before site commencement. Waterproofing and flooring subcontractors were briefed on healthcare standards. Weekly three-way coordination meetings were held with the client's medical equipment vendor.",
            "outcome_detail": "Facility passed Kerala Health Department inspection on first submission. HVAC commissioning completed two weeks ahead of handover, allowing full systems testing before fit-out completion.",
            "septa_standards": ["M&E coordination pre-drawings", "Waterproofing checkpoint at slab level", "Healthcare finish schedule", "Pre-handover systems commissioning", "Defects liability protocol"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "prestige-business-square-kochi",
            "title": "Prestige Business Square",
            "location": "Kochi, Kerala",
            "type": "Commercial",
            "status": "Completed",
            "sqft": "55,000",
            "duration": "22 months",
            "year": "2023",
            "client_type": "Commercial Developer",
            "image": "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=900&q=80",
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80"
            ],
            "short_description": "Six-storey mixed commercial office building with basement parking and retail podium — delivered in a high water-table zone without incident.",
            "challenge": "Basement waterproofing failure risk in a high water-table zone",
            "challenge_detail": "The Kochi site presented a perched water table that made traditional basement construction high-risk. The developer had experienced waterproofing failures on an adjacent project built by another contractor.",
            "approach_detail": "A tanked waterproofing system with secondary drainage layer was specified. Septa's procurement team sourced a CPWD-approved waterproofing contractor. Inspection protocols were set at formwork, pour, and curing stages with photographic records maintained per floor.",
            "outcome_detail": "Zero waterproofing failures post-completion. Basement passed structural integrity test at 3 months post-occupancy. Project delivered 8 days ahead of contractual completion date.",
            "septa_standards": ["Tanked waterproofing protocol", "Water-table monitoring log", "Subcontractor performance review", "Milestone-aligned stage payments", "Post-occupancy inspection at 90 days"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "malabar-residency-kozhikode",
            "title": "Malabar Residency",
            "location": "Kozhikode, Kerala",
            "type": "Residential",
            "status": "Completed",
            "sqft": "34,200",
            "duration": "20 months",
            "year": "2022",
            "client_type": "Private Developer",
            "image": "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
                "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=900&q=80"
            ],
            "short_description": "Twelve premium apartments across five floors with club amenities and landscaped podium — consistent finish quality across all units.",
            "challenge": "Delivering consistent finish quality across 12 independently-owned units",
            "challenge_detail": "With twelve apartments and individual buyer expectations, finish consistency became the primary execution challenge. Tile-laying, plaster quality, and joinery had to be uniform across all units.",
            "approach_detail": "A finish inspection matrix was created per unit type. A dedicated snagging team conducted two rounds of internal QC before external client walkthroughs. Unit-specific punch lists were tracked weekly in shared reports with the developer.",
            "outcome_detail": "Final snag list for all 12 units closed within 3 weeks of handover. Client NPS score of 94% based on post-handover survey. Multiple buyers referred subsequent projects through direct recommendation.",
            "septa_standards": ["Unit-level finish matrix", "Two-round internal snag protocol", "Buyer walkthrough checklist", "Developer punch list tracker", "60-day post-handover support"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "green-hills-villa-trivandrum",
            "title": "Green Hills Villa Complex",
            "location": "Trivandrum, Kerala",
            "type": "Residential",
            "status": "Ongoing",
            "sqft": "18,000",
            "duration": "16 months",
            "year": "2024",
            "client_type": "Boutique Developer",
            "image": "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=80"
            ],
            "short_description": "Six bespoke villas with natural laterite cladding, private pools, and passive energy design on hillside terrain.",
            "challenge": "Natural stone precision detailing on challenging hillside terrain",
            "challenge_detail": "Hillside terrain posed foundation challenges, and the use of natural laterite and granite required specialist masonry teams with prior villa-grade experience.",
            "approach_detail": "Geotechnical assessment was commissioned before tender. Laterite sourced from Kannur was quality-graded on arrival at site. A specialist masonry team was engaged on a dedicated package with direct QC oversight by Septa's senior site engineer.",
            "outcome_detail": "Currently on track. First two villas reached weathertight stage at Week 28. Client reports highest confidence in communication and reporting quality compared to previous construction experience.",
            "septa_standards": ["Geotechnical pre-assessment", "Material quality grading on arrival", "Specialist masonry QC package", "Weekly video site report", "Client decision log"],
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "slug": "harmony-business-centre-kottayam",
            "title": "Harmony Business Centre",
            "location": "Kottayam, Kerala",
            "type": "Mixed-use",
            "status": "Ongoing",
            "sqft": "68,000",
            "duration": "28 months",
            "year": "2024",
            "client_type": "Investment Developer",
            "image": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
            "gallery": [
                "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80"
            ],
            "short_description": "Eight-storey mixed-use development with retail ground floor, co-working levels, and serviced offices — coordinating shell-and-core delivery with concurrent tenant fit-outs.",
            "challenge": "Shell-and-core floor handover coordinated with concurrent tenant fit-outs",
            "challenge_detail": "The developer committed floors to tenants before building completion. Coordinating shell-and-core handover floor-by-floor while base construction continued above was a complex programme management challenge.",
            "approach_detail": "A floor-level completion schedule was developed in coordination with the developer's leasing timeline. Temporary hoarding and lift management protocols were established. Progress was tracked via a shared project dashboard updated weekly.",
            "outcome_detail": "Currently at structure completion for floors 1–5. Ground floor retail shell handed over to first tenant ahead of schedule. Programme confidence rated high by developer's PM team.",
            "septa_standards": ["Floor-by-floor handover schedule", "Tenant coordination protocol", "Shared progress dashboard", "Temporary works safety plan", "Monthly cost report"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]


def _seed_testimonials():
    return [
        {
            "id": str(uuid.uuid4()),
            "client_name": "P. Rajan",
            "client_role": "Principal, Educational Institution, Thrissur",
            "project_type": "Institutional",
            "content": "Septa's structured approach gave us confidence throughout the entire build. Weekly reports were clear and consistent. We never had to chase them for updates. The phased delivery methodology they proposed was something no other contractor even mentioned.",
            "rating": 5,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "Dr. S. Nair",
            "client_role": "Managing Director, Healthcare Facility, Ernakulam",
            "project_type": "Healthcare",
            "content": "The M&E coordination was handled professionally at every stage. We passed the Health Department inspection on first submission — that speaks directly to build quality. Septa clearly understood what healthcare-grade construction demands.",
            "rating": 5,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "client_name": "A. Menon",
            "client_role": "Developer, Residential Project, Kozhikode",
            "project_type": "Residential",
            "content": "We have built three projects with different contractors. Septa's finish quality and documentation discipline is a full level above the rest. Our apartment buyers had fewer handover complaints than any previous project we have delivered.",
            "rating": 5,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]


@app.on_event("startup")
async def startup_event():
    count = await db.projects.count_documents({})
    if count == 0:
        logger.info("Seeding database with initial data...")
        for p in _seed_projects():
            await db.projects.insert_one(p)
        for t in _seed_testimonials():
            await db.testimonials.insert_one(t)
        logger.info("Database seeded successfully.")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
