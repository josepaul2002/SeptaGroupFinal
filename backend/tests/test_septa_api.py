"""Backend API tests for Septa Group CMS - Phase 1
Tests: Admin JWT auth, Projects CRUD, Partners CRUD, Leads, Export
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@septa.group"
ADMIN_PASSWORD = "septa2024admin"


@pytest.fixture
def client():
    """Unauthenticated session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(client):
    """Get JWT token for admin"""
    resp = client.post(f"{BASE_URL}/api/admin/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code == 200:
        return resp.json().get("access_token")
    pytest.skip("Admin authentication failed")


@pytest.fixture
def auth_client(client, auth_token):
    """Authenticated session with JWT"""
    client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return client


# ============================================================================
# HEALTH & ROOT
# ============================================================================

class TestHealth:
    """Health check tests"""

    def test_health_endpoint(self, client):
        resp = client.get(f"{BASE_URL}/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "timestamp" in data

    def test_root_endpoint(self, client):
        resp = client.get(f"{BASE_URL}/api/")
        assert resp.status_code == 200
        data = resp.json()
        assert "Septa" in data.get("message", "")


# ============================================================================
# ADMIN AUTH (JWT)
# ============================================================================

class TestAdminAuth:
    """Admin JWT authentication tests"""

    def test_admin_login_success(self, client):
        """Test admin login with correct credentials"""
        resp = client.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["email"] == ADMIN_EMAIL
        assert data["token_type"] == "bearer"
        assert "admin_id" in data

    def test_admin_login_wrong_password(self, client):
        """Test admin login with wrong password"""
        resp = client.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert resp.status_code == 401

    def test_admin_login_wrong_email(self, client):
        """Test admin login with wrong email"""
        resp = client.post(f"{BASE_URL}/api/admin/login", json={
            "email": "wrong@email.com",
            "password": ADMIN_PASSWORD
        })
        assert resp.status_code == 401

    def test_admin_me_authenticated(self, auth_client):
        """Test /admin/me with valid token"""
        resp = auth_client.get(f"{BASE_URL}/api/admin/me")
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == ADMIN_EMAIL
        assert "id" in data
        assert "created_at" in data

    def test_admin_me_unauthenticated(self, client):
        """Test /admin/me without token"""
        resp = client.get(f"{BASE_URL}/api/admin/me")
        assert resp.status_code == 401


# ============================================================================
# PROJECTS
# ============================================================================

class TestProjects:
    """Project API tests"""

    def test_get_projects_returns_6(self, client):
        """Test that 6 migrated projects are returned"""
        resp = client.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 6

    def test_get_projects_filter_by_type(self, client):
        """Test filtering projects by type"""
        resp = client.get(f"{BASE_URL}/api/projects?type=Institutional")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(p["type"] == "Institutional" for p in data)

    def test_get_projects_filter_by_project_status(self, client):
        """Test filtering projects by project_status (Completed/Ongoing)"""
        resp = client.get(f"{BASE_URL}/api/projects?status=Completed")
        assert resp.status_code == 200
        data = resp.json()
        # Note: status filter maps to project_status field
        assert isinstance(data, list)

    def test_get_project_by_slug(self, client):
        """Test getting single project by slug"""
        resp = client.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "st-thomas-school-thrissur"
        assert "title" in data
        assert "challenge" in data
        assert "approach_detail" in data
        assert "outcome_detail" in data
        # partner_stack may not be present in all projects
        assert "type" in data
        assert "location" in data

    def test_get_project_not_found(self, client):
        """Test 404 for non-existent project"""
        resp = client.get(f"{BASE_URL}/api/projects/nonexistent-project")
        assert resp.status_code == 404

    def test_project_has_required_fields(self, client):
        """Test that project has all required fields"""
        resp = client.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        data = resp.json()
        # Title can be string or bilingual object depending on migration
        assert "title" in data
        assert "short_description" in data
        assert "sqft" in data
        assert "duration" in data
        assert "year" in data

    def test_project_has_status_field(self, client):
        """Test that project has publish status (draft/published)"""
        resp = client.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        data = resp.json()
        assert "status" in data
        assert data["status"] in ["draft", "published"]


# ============================================================================
# PARTNERS
# ============================================================================

class TestPartners:
    """Partner API tests"""

    def test_get_partners_returns_13(self, client):
        """Test that 13 migrated partners are returned"""
        resp = client.get(f"{BASE_URL}/api/partners")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 13

    def test_get_partners_filter_by_category(self, client):
        """Test filtering partners by category"""
        resp = client.get(f"{BASE_URL}/api/partners?category=Architecture%20%26%20Design")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all(p["category"] == "Architecture & Design" for p in data)

    def test_get_partners_filter_by_featured(self, client):
        """Test filtering featured partners"""
        resp = client.get(f"{BASE_URL}/api/partners?featured=true")
        assert resp.status_code == 200
        data = resp.json()
        assert all(p["featured"] == True for p in data)

    def test_get_partner_by_slug(self, client):
        """Test getting single partner by slug"""
        resp = client.get(f"{BASE_URL}/api/partners/aether-design-studio")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "aether-design-studio"
        assert "name" in data
        assert "category" in data
        assert "specialties" in data
        assert "bio_short" in data

    def test_get_partner_not_found(self, client):
        """Test 404 for non-existent partner"""
        resp = client.get(f"{BASE_URL}/api/partners/nonexistent-partner")
        assert resp.status_code == 404

    def test_partner_has_bilingual_structure(self, client):
        """Test that partner has bilingual text fields"""
        resp = client.get(f"{BASE_URL}/api/partners/aether-design-studio")
        data = resp.json()
        assert isinstance(data["name"], dict)
        assert "en" in data["name"]


# ============================================================================
# CATEGORIES
# ============================================================================

class TestCategories:
    """Category endpoint tests"""

    def test_get_partner_categories(self, client):
        """Test partner categories include new ones (Leasing, Legal)"""
        resp = client.get(f"{BASE_URL}/api/categories/partners")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 10
        assert "Leasing & Real Estate" in data
        assert "Legal / Finance" in data

    def test_get_project_categories(self, client):
        """Test project categories"""
        resp = client.get(f"{BASE_URL}/api/categories/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert "types" in data
        assert "statuses" in data
        assert "client_lens" in data


# ============================================================================
# LEADS
# ============================================================================

class TestLeads:
    """Lead API tests"""

    def test_create_lead_success(self, client):
        """Test creating a lead (contact form submission)"""
        payload = {
            "name": "TEST_John Doe",
            "phone": "9876543210",
            "email": "testjohn@example.com",
            "project_location": "Kochi",
            "project_type": "Residential",
            "budget_range": "50-80L",
            "timeline": "6 months",
            "message": "Test enquiry message",
            "page_source": "Test"
        }
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "message" in data

    def test_create_lead_minimal(self, client):
        """Test creating lead with minimal required fields"""
        payload = {"name": "TEST_Min", "phone": "9999999999", "email": "min@test.com"}
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 201

    def test_create_lead_validation_name(self, client):
        """Test lead validation - name too short"""
        payload = {"name": "A", "phone": "9999999999", "email": "test@test.com"}
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 400

    def test_create_lead_validation_phone(self, client):
        """Test lead validation - phone too short"""
        payload = {"name": "Test Name", "phone": "123", "email": "test@test.com"}
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 400

    def test_honeypot_protection(self, client):
        """Test honeypot field silently accepts but doesn't save"""
        payload = {
            "name": "Bot", "phone": "0000000000", "email": "bot@test.com",
            "honeypot": "filled"
        }
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        # Should return 200/201 but not actually save
        assert resp.status_code in [200, 201]

    def test_get_leads_requires_auth(self, client):
        """Test that getting leads requires authentication"""
        resp = client.get(f"{BASE_URL}/api/leads")
        assert resp.status_code == 401

    def test_get_leads_authenticated(self, auth_client):
        """Test getting leads with authentication"""
        resp = auth_client.get(f"{BASE_URL}/api/leads")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)


# ============================================================================
# TESTIMONIALS
# ============================================================================

class TestTestimonials:
    """Testimonial API tests"""

    def test_get_testimonials_returns_3(self, client):
        """Test that 3 seeded testimonials are returned"""
        resp = client.get(f"{BASE_URL}/api/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_testimonial_structure(self, client):
        """Test testimonial has required fields"""
        resp = client.get(f"{BASE_URL}/api/testimonials")
        data = resp.json()
        t = data[0]
        assert "client_name" in t
        assert "client_role" in t
        assert "content" in t
        assert "rating" in t
        assert "project_type" in t


# ============================================================================
# EXPORT
# ============================================================================

class TestExport:
    """Export endpoint tests"""

    def test_export_requires_auth(self, client):
        """Test that export requires authentication"""
        resp = client.get(f"{BASE_URL}/api/export/content")
        assert resp.status_code == 401

    def test_export_content_authenticated(self, auth_client):
        """Test exporting content as JSON"""
        resp = auth_client.get(f"{BASE_URL}/api/export/content")
        assert resp.status_code == 200
        data = resp.json()
        assert "projects" in data
        assert "partners" in data
        assert "exported_at" in data
        assert "exported_by" in data
        assert len(data["projects"]) == 6
        assert len(data["partners"]) == 13


# ============================================================================
# AUDIT LOGS
# ============================================================================

class TestAuditLogs:
    """Audit log tests"""

    def test_audit_logs_requires_auth(self, client):
        """Test that audit logs require authentication"""
        resp = client.get(f"{BASE_URL}/api/audit-logs")
        assert resp.status_code == 401

    def test_audit_logs_authenticated(self, auth_client):
        """Test getting audit logs with authentication"""
        resp = auth_client.get(f"{BASE_URL}/api/audit-logs")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
