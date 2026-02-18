"""Backend API tests for Septa Group website"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestProjects:
    """Project API tests"""

    def test_get_projects_returns_6(self, client):
        resp = client.get(f"{BASE_URL}/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 6

    def test_get_projects_filter_by_type(self, client):
        resp = client.get(f"{BASE_URL}/api/projects?type=Institutional")
        assert resp.status_code == 200
        data = resp.json()
        assert all(p["type"] == "Institutional" for p in data)

    def test_get_projects_filter_by_status(self, client):
        resp = client.get(f"{BASE_URL}/api/projects?status=Completed")
        assert resp.status_code == 200
        data = resp.json()
        assert all(p["status"] == "Completed" for p in data)

    def test_get_project_by_slug(self, client):
        resp = client.get(f"{BASE_URL}/api/projects/st-thomas-school-thrissur")
        assert resp.status_code == 200
        data = resp.json()
        assert data["slug"] == "st-thomas-school-thrissur"
        assert "challenge" in data
        assert "approach_detail" in data
        assert "outcome_detail" in data

    def test_get_project_not_found(self, client):
        resp = client.get(f"{BASE_URL}/api/projects/nonexistent-project")
        assert resp.status_code == 404


class TestTestimonials:
    """Testimonial API tests"""

    def test_get_testimonials_returns_3(self, client):
        resp = client.get(f"{BASE_URL}/api/testimonials")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_testimonial_structure(self, client):
        resp = client.get(f"{BASE_URL}/api/testimonials")
        data = resp.json()
        t = data[0]
        assert "client_name" in t
        assert "client_role" in t
        assert "content" in t
        assert "rating" in t


class TestLeads:
    """Lead API tests"""

    def test_create_lead_success(self, client):
        payload = {
            "name": "TEST_John Doe",
            "phone": "9876543210",
            "email": "testjohn@example.com",
            "project_location": "Kochi",
            "project_type": "Residential",
            "budget_range": "50-80L",
            "timeline": "6 months",
            "message": "Test enquiry message"
        }
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "id" in data
        assert "message" in data

    def test_create_lead_minimal(self, client):
        payload = {"name": "TEST_Min", "phone": "9999999999", "email": "min@test.com"}
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 201

    def test_get_leads(self, client):
        resp = client.get(f"{BASE_URL}/api/leads")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_honeypot_protection(self, client):
        payload = {
            "name": "Bot", "phone": "0000000000", "email": "bot@test.com",
            "honeypot": "filled"
        }
        resp = client.post(f"{BASE_URL}/api/leads", json=payload)
        assert resp.status_code == 201


class TestAdminAuth:
    """Admin authentication tests"""

    def test_admin_auth_correct_password(self, client):
        resp = client.post(f"{BASE_URL}/api/admin/auth", json={"password": "septa2024"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["authenticated"] == True

    def test_admin_auth_wrong_password(self, client):
        resp = client.post(f"{BASE_URL}/api/admin/auth", json={"password": "wrongpassword"})
        assert resp.status_code == 401
