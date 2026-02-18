"""
Septa Group API Tests - Phase 2 Features
Tests for: Solution Packs, Email Logs, Storage Status, Language Support, Partner Categories
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Basic health and API availability tests"""
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Septa Group API" in data["message"]
        print("✓ Root endpoint working")


class TestSolutionPacks:
    """Solution Packs feature tests"""
    
    def test_get_solution_packs(self):
        """Test GET /api/solution-packs returns all packs"""
        response = requests.get(f"{BASE_URL}/api/solution-packs")
        assert response.status_code == 200
        packs = response.json()
        assert isinstance(packs, list)
        assert len(packs) >= 3, f"Expected at least 3 packs, got {len(packs)}"
        print(f"✓ Found {len(packs)} solution packs")
    
    def test_solution_pack_structure(self):
        """Test solution pack has required fields"""
        response = requests.get(f"{BASE_URL}/api/solution-packs")
        assert response.status_code == 200
        packs = response.json()
        
        required_fields = ['slug', 'name', 'tagline', 'partner_categories', 'typical_timeline']
        for pack in packs:
            for field in required_fields:
                assert field in pack, f"Missing field: {field} in pack {pack.get('slug', 'unknown')}"
        print("✓ All packs have required fields")
    
    def test_premium_home_pack(self):
        """Test Premium Home Pack exists and has correct data"""
        response = requests.get(f"{BASE_URL}/api/solution-packs/premium-home")
        assert response.status_code == 200
        pack = response.json()
        assert pack["slug"] == "premium-home"
        assert "Premium Home" in pack["name"]["en"]
        assert "Architecture & Design" in pack["partner_categories"]
        print("✓ Premium Home Pack verified")
    
    def test_retail_launch_pack(self):
        """Test Retail Launch Pack exists"""
        response = requests.get(f"{BASE_URL}/api/solution-packs/retail-launch")
        assert response.status_code == 200
        pack = response.json()
        assert pack["slug"] == "retail-launch"
        assert "Leasing & Real Estate" in pack["partner_categories"]
        print("✓ Retail Launch Pack verified")
    
    def test_institutional_excellence_pack(self):
        """Test Institutional Excellence Pack exists"""
        response = requests.get(f"{BASE_URL}/api/solution-packs/institutional-excellence")
        assert response.status_code == 200
        pack = response.json()
        assert pack["slug"] == "institutional-excellence"
        assert "Legal / Compliance / Approvals" in pack["partner_categories"]
        print("✓ Institutional Excellence Pack verified")
    
    def test_nonexistent_pack_returns_404(self):
        """Test that nonexistent pack returns 404"""
        response = requests.get(f"{BASE_URL}/api/solution-packs/nonexistent-pack")
        assert response.status_code == 404
        print("✓ Nonexistent pack returns 404")


class TestPartnerCategories:
    """Partner categories tests - verifying 14 expanded categories"""
    
    def test_get_partner_categories(self):
        """Test GET /api/categories/partners returns all 14 categories"""
        response = requests.get(f"{BASE_URL}/api/categories/partners")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) == 14, f"Expected 14 categories, got {len(categories)}"
        print(f"✓ Found {len(categories)} partner categories")
    
    def test_new_categories_present(self):
        """Test that new expanded categories are present"""
        response = requests.get(f"{BASE_URL}/api/categories/partners")
        assert response.status_code == 200
        categories = response.json()
        
        new_categories = [
            "Leasing & Real Estate",
            "Photo / Video / 3D Documentation",
            "Legal / Compliance / Approvals",
            "Branding, Signage & Wayfinding"
        ]
        
        for cat in new_categories:
            assert cat in categories, f"Missing new category: {cat}"
            print(f"✓ Found category: {cat}")
    
    def test_all_expected_categories(self):
        """Test all 14 expected categories are present"""
        response = requests.get(f"{BASE_URL}/api/categories/partners")
        assert response.status_code == 200
        categories = response.json()
        
        expected = [
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
        
        for cat in expected:
            assert cat in categories, f"Missing category: {cat}"
        print("✓ All 14 categories verified")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "septa2024admin"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed - skipping admin tests")
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "septa2024admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == "admin@septa.group"
        print("✓ Admin login successful")
    
    def test_email_logs_endpoint(self, auth_token):
        """Test GET /api/email-logs returns data (admin only)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/email-logs", headers=headers)
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
        print(f"✓ Email logs endpoint working, found {len(logs)} logs")
    
    def test_email_logs_requires_auth(self):
        """Test email logs endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/email-logs")
        assert response.status_code == 401
        print("✓ Email logs correctly requires authentication")
    
    def test_storage_status_endpoint(self, auth_token):
        """Test GET /api/storage/status returns config (admin only)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/storage/status", headers=headers)
        assert response.status_code == 200
        status = response.json()
        assert "provider" in status
        assert "cloud_configured" in status
        assert "local_path" in status
        # Since we're using placeholder keys, should be LOCAL
        assert status["provider"] == "LOCAL"
        assert status["cloud_configured"] == False
        print(f"✓ Storage status: provider={status['provider']}, cloud_configured={status['cloud_configured']}")
    
    def test_storage_status_requires_auth(self):
        """Test storage status endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/storage/status")
        assert response.status_code == 401
        print("✓ Storage status correctly requires authentication")


class TestLeadCreation:
    """Lead creation and contact form tests"""
    
    def test_create_lead(self):
        """Test creating a lead via contact form"""
        lead_data = {
            "name": "TEST_Phase2_User",
            "phone": "9876543210",
            "email": "test_phase2@example.com",
            "project_type": "Residential",
            "project_location": "Kochi",
            "message": "Test lead from Phase 2 testing"
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert "message" in data
        print(f"✓ Lead created with ID: {data['id']}")
    
    def test_lead_validation_name_required(self):
        """Test lead validation - name required"""
        lead_data = {
            "name": "",
            "phone": "9876543210"
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 400
        print("✓ Lead validation: name required")
    
    def test_lead_validation_phone_required(self):
        """Test lead validation - phone required"""
        lead_data = {
            "name": "Test User",
            "phone": ""
        }
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 400
        print("✓ Lead validation: phone required")


class TestPartnersAPI:
    """Partners API tests"""
    
    def test_get_partners(self):
        """Test GET /api/partners returns partners"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        partners = response.json()
        assert isinstance(partners, list)
        assert len(partners) > 0
        print(f"✓ Found {len(partners)} partners")
    
    def test_partner_has_bilingual_fields(self):
        """Test partners have bilingual name field"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        partners = response.json()
        
        for partner in partners[:3]:  # Check first 3
            assert "name" in partner
            if isinstance(partner["name"], dict):
                assert "en" in partner["name"]
                print(f"✓ Partner {partner['slug']} has bilingual name")


class TestProjectsAPI:
    """Projects API tests"""
    
    def test_get_projects(self):
        """Test GET /api/projects returns projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        projects = response.json()
        assert isinstance(projects, list)
        print(f"✓ Found {len(projects)} projects")
    
    def test_project_categories(self):
        """Test GET /api/categories/projects returns categories"""
        response = requests.get(f"{BASE_URL}/api/categories/projects")
        assert response.status_code == 200
        data = response.json()
        assert "types" in data
        assert "statuses" in data
        print("✓ Project categories endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
