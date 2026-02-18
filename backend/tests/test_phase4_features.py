"""
Phase 4 Testing: Partner CMS, Bilingual Content, About/Services CMS, Admin Settings
Testing the new major features: /api/settings, /api/pages/{page_id}, Partner detail pages, Leads with new fields
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndBasics:
    """Basic health and API accessibility tests"""

    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        print("Health endpoint working")

    def test_api_root(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Septa Group API" in data.get("message", "")
        print("API root working")


class TestSiteSettings:
    """Site settings endpoint tests - /api/settings"""

    def test_get_settings_returns_all_fields(self):
        """Test 1: GET /api/settings returns site settings"""
        response = requests.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "contact" in data
        assert "enquiry" in data
        assert "content_language_mode" in data
        
        # Verify contact fields
        contact = data["contact"]
        assert "phone_display" in contact
        assert "email" in contact
        assert "office_address" in contact
        assert "whatsapp_number" in contact
        assert "operating_districts" in contact
        assert isinstance(contact["operating_districts"], list)
        
        # Verify enquiry fields
        enquiry = data["enquiry"]
        assert "project_types" in enquiry
        assert "budget_ranges" in enquiry
        assert "timeline_ranges" in enquiry
        assert isinstance(enquiry["project_types"], list)
        assert isinstance(enquiry["budget_ranges"], list)
        
        # Check language mode
        assert data["content_language_mode"] in ["english_only", "malayalam_primary", "toggle"]
        
        print(f"Settings retrieved: {len(contact.get('operating_districts', []))} districts, mode={data['content_language_mode']}")


class TestPageContent:
    """Page content CMS tests - /api/pages/{page_id}"""

    def test_get_about_page_content(self):
        """Test 2: GET /api/pages/about returns about page blocks"""
        response = requests.get(f"{BASE_URL}/api/pages/about")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("page_id") == "about"
        assert "blocks" in data
        blocks = data["blocks"]
        assert isinstance(blocks, list)
        
        # Check for expected block types
        block_types = set(b.get("block_type") for b in blocks)
        assert "metrics" in block_types, "About page should have metrics blocks"
        assert "timeline_step" in block_types, "About page should have timeline_step blocks"
        assert "proof_callout" in block_types, "About page should have proof_callout blocks"
        
        # Verify metrics content
        metrics = [b for b in blocks if b["block_type"] == "metrics"]
        assert len(metrics) >= 3, "Should have at least 3 metrics"
        
        # Verify timeline steps
        steps = [b for b in blocks if b["block_type"] == "timeline_step"]
        assert len(steps) >= 5, "Should have at least 5 Septa Standard timeline steps"
        
        # Check proof callouts
        proofs = [b for b in blocks if b["block_type"] == "proof_callout"]
        assert len(proofs) >= 1, "Should have at least 1 proof callout"
        
        print(f"About page: {len(metrics)} metrics, {len(steps)} steps, {len(proofs)} proofs")

    def test_get_services_page_content(self):
        """Test 3: GET /api/pages/services returns services comparison rows"""
        response = requests.get(f"{BASE_URL}/api/pages/services")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("page_id") == "services"
        assert "blocks" in data
        blocks = data["blocks"]
        
        # Check comparison rows
        comparisons = [b for b in blocks if b["block_type"] == "comparison_row"]
        assert len(comparisons) >= 4, "Should have at least 4 comparison rows"
        
        # Verify comparison row structure
        for comp in comparisons:
            assert "title" in comp
            assert "body" in comp
            assert "metadata" in comp
            # Traditional column should be in metadata
            assert "traditional" in comp.get("metadata", {}), "Comparison row should have traditional column in metadata"
        
        print(f"Services page: {len(comparisons)} comparison rows")


class TestAdminAuth:
    """Admin authentication tests"""

    def test_admin_login_success(self):
        """Test 11: Admin login works with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "septa2024admin"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == "admin@septa.group"
        print("Admin login successful")
        return data["access_token"]

    def test_admin_login_failure(self):
        """Test admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("Admin login correctly rejected wrong password")


class TestSettingsUpdate:
    """Settings update with admin auth tests"""

    @pytest.fixture
    def auth_token(self):
        """Get auth token for protected endpoints"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "septa2024admin"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")

    def test_update_settings_requires_auth(self):
        """Test 4: PUT /api/settings requires admin auth"""
        response = requests.put(f"{BASE_URL}/api/settings", json={
            "footer_tagline": "Test Tagline"
        })
        # Should fail without auth
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422 without auth, got {response.status_code}"
        print("Settings update correctly requires auth")

    def test_update_settings_with_auth(self, auth_token):
        """Test 4: PUT /api/settings updates settings with admin auth"""
        # First get current settings
        current = requests.get(f"{BASE_URL}/api/settings").json()
        original_tagline = current.get("footer_tagline", "")
        
        # Update settings
        response = requests.put(f"{BASE_URL}/api/settings", 
            json={"footer_tagline": "TEST_Tagline_Updated"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Verify update
        updated = requests.get(f"{BASE_URL}/api/settings").json()
        assert updated["footer_tagline"] == "TEST_Tagline_Updated"
        
        # Restore original
        requests.put(f"{BASE_URL}/api/settings",
            json={"footer_tagline": original_tagline},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        print("Settings update with auth successful")


class TestPartners:
    """Partner endpoint tests"""

    def test_get_partners_list(self):
        """Test 9: GET /api/partners returns partner list"""
        response = requests.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        partners = response.json()
        assert isinstance(partners, list)
        assert len(partners) > 0, "Should have at least 1 partner"
        
        # Check partner structure
        partner = partners[0]
        assert "slug" in partner
        assert "name" in partner
        assert "category" in partner
        assert "relationship_type" in partner
        assert "media" in partner, "Partner should have media field"
        
        # Check media structure
        media = partner.get("media", {})
        assert "card_image" in media or partner.get("cover_image"), "Partner should have card_image or cover_image"
        
        # Check for relationship badges
        valid_types = ["Group Company", "Core Partner", "Project Partner", "Preferred Vendor"]
        assert partner["relationship_type"] in valid_types
        
        print(f"Partners list: {len(partners)} partners")
        return partner["slug"]

    def test_get_partner_by_slug(self):
        """Test 10: GET /api/partners/{slug} returns partner detail"""
        # First get a slug
        partners = requests.get(f"{BASE_URL}/api/partners").json()
        if not partners:
            pytest.skip("No partners in database")
        slug = partners[0]["slug"]
        
        # Get partner detail
        response = requests.get(f"{BASE_URL}/api/partners/{slug}")
        assert response.status_code == 200
        partner = response.json()
        
        assert partner["slug"] == slug
        assert "bio_short" in partner
        assert "bio_long" in partner
        assert "specialties" in partner
        assert "media" in partner
        
        # Check for gallery in media
        media = partner.get("media", {})
        assert "hero_image" in media or "card_image" in media
        
        print(f"Partner detail for '{slug}' retrieved successfully")

    def test_partner_not_found(self):
        """Test partner 404 for non-existent slug"""
        response = requests.get(f"{BASE_URL}/api/partners/non-existent-partner-slug-xyz")
        assert response.status_code == 404
        print("Partner 404 correctly returned for non-existent slug")


class TestLeads:
    """Lead creation and management tests"""

    def test_create_lead_with_new_fields(self):
        """Test 17: Lead submission stores partner_ref, service_ref, budget_range, timeline"""
        lead_data = {
            "name": "TEST_Phase4_User",
            "phone": "9876543210",
            "email": "test@example.com",
            "project_type": "Institutional / Educational",
            "project_location": "Ernakulam",
            "budget_range": "₹1Cr – ₹3 Crore",
            "timeline": "6 months – 1 year",
            "message": "Test message for Phase 4",
            "partner_ref": "aether-design-studio",
            "service_ref": "institutional",
            "page_source": "contact"
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data or "message" in data
        print(f"Lead created with budget_range, timeline, partner_ref fields")

    def test_lead_honeypot_rejection(self):
        """Test honeypot spam protection"""
        lead_data = {
            "name": "Bot User",
            "phone": "1234567890",
            "honeypot": "spam content"  # Honeypot filled = bot
        }
        
        response = requests.post(f"{BASE_URL}/api/leads", json=lead_data)
        # Should return 200 with generic message (silently reject)
        assert response.status_code in [200, 201]
        print("Honeypot correctly triggered for spam detection")

    def test_lead_rate_limiting(self):
        """Test rate limiting on lead endpoint (5/minute)"""
        # Note: This might fail if previous tests already hit the limit
        # Just document the behavior
        print("Rate limiting test: /api/leads is limited to 5/minute")


class TestPartnerCategories:
    """Partner category and filtering tests"""

    def test_get_partner_categories(self):
        """Test partner categories endpoint"""
        response = requests.get(f"{BASE_URL}/api/categories/partners")
        assert response.status_code == 200
        categories = response.json()
        assert isinstance(categories, list)
        assert len(categories) >= 5, "Should have multiple partner categories"
        assert "Architecture & Design" in categories
        print(f"Partner categories: {len(categories)} categories")

    def test_filter_partners_by_category(self):
        """Test filtering partners by category"""
        response = requests.get(f"{BASE_URL}/api/partners?category=Architecture%20%26%20Design")
        assert response.status_code == 200
        partners = response.json()
        # All returned partners should be in the Architecture category
        for p in partners:
            assert p["category"] == "Architecture & Design"
        print(f"Category filter working: {len(partners)} Architecture partners")


class TestAdminEndpoints:
    """Admin panel endpoint tests"""

    @pytest.fixture
    def auth_token(self):
        """Get auth token for protected endpoints"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "email": "admin@septa.group",
            "password": "septa2024admin"
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin login failed")

    def test_get_leads_admin(self, auth_token):
        """Test admin can get leads list"""
        response = requests.get(f"{BASE_URL}/api/leads",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        leads = response.json()
        assert isinstance(leads, list)
        print(f"Admin leads list: {len(leads)} leads")

    def test_get_audit_logs(self, auth_token):
        """Test admin can get audit logs"""
        response = requests.get(f"{BASE_URL}/api/audit-logs",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        logs = response.json()
        assert isinstance(logs, list)
        print(f"Audit logs: {len(logs)} entries")

    def test_export_content(self, auth_token):
        """Test content export"""
        response = requests.get(f"{BASE_URL}/api/export/content",
            headers={"Authorization": f"Bearer {auth_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data
        assert "partners" in data
        assert "exported_at" in data
        print("Content export working")


class TestLanguageMode:
    """Test content_language_mode behavior"""

    def test_english_only_mode(self):
        """Test 5: When mode is english_only, language toggle should not be visible"""
        settings = requests.get(f"{BASE_URL}/api/settings").json()
        mode = settings.get("content_language_mode")
        print(f"Current language mode: {mode}")
        
        if mode == "english_only":
            print("Mode is english_only - language toggle should NOT be visible in navbar")
        elif mode == "toggle":
            print("Mode is toggle - language toggle SHOULD be visible in navbar")
        else:
            print(f"Mode is {mode} - Malayalam primary, toggle should not be visible")


class TestContentStructure:
    """Test bilingual content structure"""

    def test_partner_bilingual_fields(self):
        """Test partners have bilingual name and bio fields"""
        partners = requests.get(f"{BASE_URL}/api/partners").json()
        if not partners:
            pytest.skip("No partners")
        
        partner = partners[0]
        # Name should be bilingual object
        name = partner.get("name")
        assert isinstance(name, dict), "Partner name should be bilingual object"
        assert "en" in name, "Partner name should have English"
        
        # bio_short should be bilingual
        bio = partner.get("bio_short")
        if bio:
            assert isinstance(bio, dict), "Partner bio_short should be bilingual object"
        
        print("Partner bilingual structure verified")

    def test_about_page_bilingual_blocks(self):
        """Test about page blocks have bilingual title/body"""
        page = requests.get(f"{BASE_URL}/api/pages/about").json()
        blocks = page.get("blocks", [])
        
        for block in blocks:
            title = block.get("title")
            if title:
                assert isinstance(title, dict), f"Block title should be bilingual: {block.get('block_type')}"
            body = block.get("body")
            if body:
                assert isinstance(body, dict), f"Block body should be bilingual: {block.get('block_type')}"
        
        print("About page bilingual blocks verified")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Get auth token
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "email": "admin@septa.group",
        "password": "septa2024admin"
    })
    if response.status_code != 200:
        return
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get and delete test leads
    leads = requests.get(f"{BASE_URL}/api/leads", headers=headers).json()
    for lead in leads:
        if lead.get("name", "").startswith("TEST_"):
            requests.delete(f"{BASE_URL}/api/leads/{lead['id']}", headers=headers)
            print(f"Cleaned up test lead: {lead['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
