"""
Phase 7 tests:
- POST /api/admin/google-session: no header → 400, invalid header → 401 (never 404/500)
- Existing password login POST /api/admin/login still returns 200
- Bulk hide-photoless still returns count/slugs
- media_visible + tab_visibility default fields present on GET
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
PROJECT_SLUG = "harmony-business-centre-kottayam"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Password login broken: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok
    return tok


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# --- Google session ---

def test_google_session_no_header_returns_400():
    r = requests.post(f"{API}/admin/google-session")
    assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"


def test_google_session_invalid_header_returns_401():
    r = requests.post(f"{API}/admin/google-session", headers={"X-Session-ID": "invalid_test"})
    assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


def test_google_session_endpoint_not_404():
    r = requests.post(f"{API}/admin/google-session")
    assert r.status_code != 404


# --- password login regression ---

def test_password_login_still_works():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    body = r.json()
    assert body.get("access_token") or body.get("token")


# --- media_visible + tab_visibility defaults ---

def test_project_get_has_media_visible_and_tab_visibility():
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip(f"Project {PROJECT_SLUG} not seeded")
    assert r.status_code == 200
    data = r.json()
    assert "media_visible" in data
    assert isinstance(data["media_visible"], bool)
    assert "tab_visibility" in data
    for k in ["story", "design", "delivery", "partners"]:
        assert k in data["tab_visibility"]


# --- media_visible round-trip on target slug ---

def test_media_visible_toggle_persists_and_restores(auth_headers):
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip("skip")
    orig = r.json().get("media_visible", True)
    try:
        upd = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": False}, headers=auth_headers)
        assert upd.status_code == 200, upd.text
        assert requests.get(f"{API}/projects/{PROJECT_SLUG}").json()["media_visible"] is False
        upd2 = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": True}, headers=auth_headers)
        assert upd2.status_code == 200
        assert requests.get(f"{API}/projects/{PROJECT_SLUG}").json()["media_visible"] is True
    finally:
        requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": orig}, headers=auth_headers)


# --- tab_visibility round-trip on target slug ---

def test_tab_visibility_toggle_persists_and_restores(auth_headers):
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip("skip")
    orig = r.json().get("tab_visibility") or {k: True for k in ["story","design","delivery","partners"]}
    try:
        new_tv = {**{k: True for k in ["story","design","delivery","partners"]}, "design": False}
        upd = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"tab_visibility": new_tv}, headers=auth_headers)
        assert upd.status_code == 200, upd.text
        after = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
        assert after["tab_visibility"]["design"] is False
        assert after["tab_visibility"]["story"] is True
    finally:
        restore = {k: True for k in ["story","design","delivery","partners"]}
        restore.update({k: v for k, v in orig.items() if isinstance(v, bool)})
        requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"tab_visibility": restore}, headers=auth_headers)


# --- bulk hide-photoless still returns count ---

def test_hide_photoless_returns_count(auth_headers):
    r = requests.post(f"{API}/admin/projects/hide-photoless", headers=auth_headers)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "count" in body
    assert "slugs" in body
    assert isinstance(body["slugs"], list)
    # Restore any accidentally flipped ones
    for s in body["slugs"]:
        requests.put(f"{API}/projects/{s}", json={"media_visible": True}, headers=auth_headers)


def test_hide_photoless_requires_auth():
    r = requests.post(f"{API}/admin/projects/hide-photoless")
    assert r.status_code in (401, 403)
