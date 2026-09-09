"""
Phase 5 tests: nav_visibility settings and per-project media_visible toggle.
Also verifies restoration of settings after tests.
"""
import os
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@septa.group"
ADMIN_PASSWORD = "septa2024admin"

NAV_KEYS = ["about", "services", "projects", "ecosystem", "contact"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token") or r.json().get("token")
    assert token, f"No token in response: {r.json()}"
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Settings / nav_visibility ---

def test_get_settings_has_nav_visibility():
    r = requests.get(f"{API}/settings")
    assert r.status_code == 200
    data = r.json()
    assert "nav_visibility" in data, f"nav_visibility missing: {data.keys()}"
    for k in NAV_KEYS:
        assert k in data["nav_visibility"], f"Key {k} missing in nav_visibility"
        assert isinstance(data["nav_visibility"][k], bool)


def test_toggle_nav_visibility_ecosystem_off_then_on(auth_headers):
    # Get current settings
    current = requests.get(f"{API}/settings").json()
    payload = {**current, "nav_visibility": {**current.get("nav_visibility", {}), "ecosystem": False}}
    # exclude any _id if present
    payload.pop("_id", None)

    r = requests.put(f"{API}/settings", json=payload, headers=auth_headers)
    assert r.status_code == 200, f"PUT failed: {r.status_code} {r.text}"

    # Verify persisted
    after = requests.get(f"{API}/settings").json()
    assert after["nav_visibility"]["ecosystem"] is False

    # Restore
    restore_payload = {**after, "nav_visibility": {k: True for k in NAV_KEYS}}
    restore_payload.pop("_id", None)
    r2 = requests.put(f"{API}/settings", json=restore_payload, headers=auth_headers)
    assert r2.status_code == 200
    restored = requests.get(f"{API}/settings").json()
    for k in NAV_KEYS:
        assert restored["nav_visibility"][k] is True


def test_put_settings_requires_auth():
    r = requests.put(f"{API}/settings", json={"nav_visibility": {"ecosystem": False}})
    assert r.status_code in (401, 403)


# --- Project media_visible ---

PROJECT_SLUG = "harmony-business-centre-kottayam"


def test_project_has_media_visible_field():
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip(f"Project {PROJECT_SLUG} not found in DB")
    assert r.status_code == 200
    data = r.json()
    # Legacy projects may not have media_visible saved; frontend treats missing as True.
    # Accept missing OR bool.
    if "media_visible" in data:
        assert isinstance(data["media_visible"], bool)


def test_toggle_project_media_visible(auth_headers):
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip(f"Project {PROJECT_SLUG} not found")
    original = r.json().get("media_visible", True)

    # Turn OFF
    upd = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": False}, headers=auth_headers)
    assert upd.status_code == 200, f"Update failed: {upd.status_code} {upd.text}"
    check = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
    assert check["media_visible"] is False

    # Restore to original (True typically)
    upd2 = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": original}, headers=auth_headers)
    assert upd2.status_code == 200
    check2 = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
    assert check2["media_visible"] is original


def test_project_update_media_visible_requires_auth():
    r = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": False})
    assert r.status_code in (401, 403)
