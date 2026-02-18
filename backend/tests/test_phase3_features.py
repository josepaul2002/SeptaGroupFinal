"""
Septa Group CMS - Phase 3 Testing
Features: Admin refactoring, bilingual support, tabbed project UI, media fields
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://septa-cms-preview.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@septa.group"
ADMIN_PASSWORD = "septa2024admin"


class TestBasicAPIs:
    """Basic API endpoint tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        print("API health check passed")
    
    def test_get_projects(self):
        """Test projects list endpoint"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Projects API returned {len(data)} projects")
    
    def test_get_partners(self):
        """Test partners list endpoint"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"Partners API returned {len(data)} partners")


class TestProjectCaseStudyData:
    """Test project case study data structure (new tabbed UI)"""
    
    def test_project_by_slug(self):
        """Test fetching project by slug"""
        response = requests.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "st-thomas-school-thrissur"
        assert "title" in data
        print(f"Project retrieved: {data.get('title')}")
    
    def test_project_has_gallery_for_media_tab(self):
        """Test project has gallery for media tab display"""
        response = requests.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        assert response.status_code == 200
        data = response.json()
        # Gallery exists for fallback when media field is null
        assert "gallery" in data
        gallery = data.get("gallery", [])
        print(f"Project gallery has {len(gallery)} images")
    
    def test_project_structure_for_tabs(self):
        """Verify project has fields needed for tabbed UI"""
        response = requests.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        assert response.status_code == 200
        data = response.json()
        # Core fields
        assert "slug" in data
        assert "title" in data
        assert "location" in data
        assert "type" in data
        # These are used by Story tab
        assert "short_description" in data
        # These are used by Delivery tab  
        assert "challenge" in data or "challenge_detail" in data
        print("Project structure validation passed")


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == ADMIN_EMAIL
        print("Admin login successful")
        return data["access_token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Invalid credentials correctly rejected")


class TestAdminProjectsCRUD:
    """Test admin projects management"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin auth failed")
        return response.json()["access_token"]
    
    def test_get_all_projects_admin(self, auth_token):
        """Test getting all projects as admin (includes drafts)"""
        response = requests.get(
            f"{BASE_URL}/api/projects?published_only=false",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin can see {len(data)} projects (including drafts)")
    
    def test_get_leads_admin(self, auth_token):
        """Test getting leads (admin only)"""
        response = requests.get(
            f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin can see {len(data)} leads")


class TestAdminPartnersCRUD:
    """Test admin partners management"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin auth failed")
        return response.json()["access_token"]
    
    def test_get_all_partners_admin(self, auth_token):
        """Test getting all partners as admin"""
        response = requests.get(
            f"{BASE_URL}/api/partners?published_only=false",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin can see {len(data)} partners")


class TestExportAndSettings:
    """Test export and settings endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for admin operations"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin auth failed")
        return response.json()["access_token"]
    
    def test_export_content(self, auth_token):
        """Test exporting all content"""
        response = requests.get(
            f"{BASE_URL}/api/export",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "partners" in data
        print(f"Export contains {len(data['projects'])} projects, {len(data['partners'])} partners")


class TestSolutionPacks:
    """Test solution packs endpoints"""
    
    def test_get_solution_packs(self):
        """Test solution packs list endpoint"""
        response = requests.get(f"{BASE_URL}/api/solution-packs")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 3  # Should have 3 packs
        print(f"Solution packs API returned {len(data)} packs")


class TestPartnerCategories:
    """Test partner categories endpoint"""
    
    def test_get_partner_categories(self):
        """Test getting partner categories"""
        response = requests.get(f"{BASE_URL}/api/categories/partners")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10  # Should have multiple categories
        print(f"Partner categories: {data}")


class TestContactForm:
    """Test contact form / lead creation"""
    
    def test_create_lead(self):
        """Test creating a lead via contact form"""
        response = requests.post(f"{BASE_URL}/api/leads", json={
            "name": "TEST_Phase3_User",
            "phone": "+91 9876543210",
            "email": "test_phase3@example.com",
            "project_type": "Commercial",
            "message": "Test lead from Phase 3 testing",
            "project_location": "Kerala",
            "budget_range": "50L-1Cr",
            "timeline": "6 months",
            "honeypot": "",
            "page_source": "Phase 3 Testing"
        })
        assert response.status_code == 201
        data = response.json()
        assert "message" in data
        assert "id" in data
        print(f"Lead created with ID: {data['id']}")


class TestBilingualData:
    """Test bilingual data structure in responses"""
    
    def test_partner_bilingual_name(self):
        """Test partner name can be bilingual"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        data = response.json()
        # Check first partner
        if len(data) > 0:
            partner = data[0]
            name = partner.get("name")
            # Name can be string or {en, ml} object
            assert name is not None
            if isinstance(name, dict):
                assert "en" in name
            print(f"Partner name structure: {type(name)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
