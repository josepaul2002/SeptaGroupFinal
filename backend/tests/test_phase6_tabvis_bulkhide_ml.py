"""
Phase 6 tests:
- Per-project tab_visibility (story/design/delivery/partners) toggles + persistence
- Bulk POST /api/admin/projects/hide-photoless (auth required, count/slugs response)
- Malayalam (ml) input on page content blocks — persistence via /api/pages/{page_key}
- Regression sanity: nav_visibility and media_visible still work

Restores modified state after tests.
"""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@septa.group"
ADMIN_PASSWORD = "septa2024admin"

TAB_KEYS = ["story", "design", "delivery", "partners"]
PROJECT_SLUG = "harmony-business-centre-kottayam"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token") or r.json().get("token")
    assert token
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# -------- tab_visibility --------

def test_get_project_has_tab_visibility_defaults():
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip("Seed project missing")
    assert r.status_code == 200
    data = r.json()
    assert "tab_visibility" in data, "tab_visibility not defaulted on GET"
    for k in TAB_KEYS:
        assert k in data["tab_visibility"]
        assert isinstance(data["tab_visibility"][k], bool)


def test_toggle_project_tab_visibility_design_off_then_restore(auth_headers):
    orig = requests.get(f"{API}/projects/{PROJECT_SLUG}").json().get("tab_visibility") or {
        k: True for k in TAB_KEYS
    }
    new_tv = {**{k: True for k in TAB_KEYS}, **orig, "design": False}
    upd = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"tab_visibility": new_tv}, headers=auth_headers)
    assert upd.status_code == 200, f"PUT failed: {upd.status_code} {upd.text}"

    after = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
    assert after["tab_visibility"]["design"] is False
    # other keys still True (or as originally)
    for k in ["story", "delivery", "partners"]:
        assert after["tab_visibility"][k] is True

    # Restore
    restore = {k: True for k in TAB_KEYS}
    r2 = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"tab_visibility": restore}, headers=auth_headers)
    assert r2.status_code == 200
    chk = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
    for k in TAB_KEYS:
        assert chk["tab_visibility"][k] is True


def test_tab_visibility_update_requires_auth():
    r = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"tab_visibility": {"design": False}})
    assert r.status_code in (401, 403)


# -------- hide-photoless bulk --------

def test_hide_photoless_requires_auth():
    r = requests.post(f"{API}/admin/projects/hide-photoless")
    assert r.status_code in (401, 403)


def test_hide_photoless_with_temp_photoless_project(auth_headers):
    # Create a temp photo-less project
    slug = f"test-photoless-{uuid.uuid4().hex[:8]}"
    # Clone existing project to satisfy schema, then blank out all photos
    src = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
    src.pop("_id", None)
    src.pop("id", None)
    src["slug"] = slug
    src["image"] = ""
    src["hero_image"] = ""
    src["cover_image"] = ""
    src["gallery"] = []
    src["media"] = {"images": [], "gallery": [], "plans": []}
    src["media_visible"] = True
    # Coerce string bilingual fields to dicts if needed
    for k in ("title", "short_description", "challenge", "challenge_detail",
              "approach_detail", "outcome_detail"):
        v = src.get(k)
        if isinstance(v, str):
            src[k] = {"en": v, "ml": ""}
    payload = src
    cr = requests.post(f"{API}/projects", json=payload, headers=auth_headers)
    if cr.status_code not in (200, 201):
        pytest.skip(f"Could not create temp project: {cr.status_code} {cr.text[:200]}")

    try:
        # Snapshot other real projects that would also be affected (photo-less real ones), so we can restore
        listing = requests.get(f"{API}/projects").json()
        # Some endpoints return {projects:[...]} or list
        proj_list = listing if isinstance(listing, list) else listing.get("projects", [])
        # Track which projects currently have media_visible=True but are photo-less (would flip to False)
        affected_pre = []
        for p in proj_list:
            media = p.get("media") or {}
            has_photos = bool(
                p.get("gallery") or media.get("images") or media.get("gallery")
                or media.get("hero_video") or media.get("model_3d") or media.get("plans")
                or p.get("hero_image") or p.get("image")
            )
            if not has_photos and p.get("media_visible", True) is not False and p.get("slug") != slug:
                affected_pre.append(p["slug"])

        # Call bulk hide
        r = requests.post(f"{API}/admin/projects/hide-photoless", headers=auth_headers)
        assert r.status_code == 200, f"Bulk hide failed: {r.status_code} {r.text}"
        data = r.json()
        assert "count" in data
        assert "slugs" in data
        assert isinstance(data["slugs"], list)
        assert slug in data["slugs"], f"Temp photo-less project not in slugs: {data}"
        assert data["count"] >= 1

        # Verify media_visible flipped to False on our temp project
        after = requests.get(f"{API}/projects/{slug}").json()
        assert after.get("media_visible") is False

        # Verify a project WITH photos was NOT touched (harmony has photos)
        harmony = requests.get(f"{API}/projects/{PROJECT_SLUG}").json()
        assert harmony.get("media_visible", True) is not False, "Bulk hide incorrectly affected a project with photos"

        # Restore any real projects that got flipped (excluding our temp)
        for real_slug in data["slugs"]:
            if real_slug == slug:
                continue
            requests.put(f"{API}/projects/{real_slug}", json={"media_visible": True}, headers=auth_headers)
    finally:
        # Delete temp project
        requests.delete(f"{API}/projects/{slug}", headers=auth_headers)


# -------- Malayalam page content --------

PAGE_KEY = "about"


def test_page_content_ml_persists(auth_headers):
    r = requests.get(f"{API}/pages/{PAGE_KEY}")
    if r.status_code == 404:
        pytest.skip(f"Page {PAGE_KEY} not found")
    assert r.status_code == 200
    page = r.json()
    page.pop("_id", None)
    blocks = page.get("blocks") or page.get("content_blocks") or []
    if not blocks:
        pytest.skip("No blocks on page")

    marker = f"TESTML-{uuid.uuid4().hex[:6]}"
    original_first = None
    # find first block with a title dict
    target_idx = None
    for i, b in enumerate(blocks):
        if isinstance(b.get("title"), dict):
            target_idx = i
            original_first = {"title": dict(b["title"])}
            b["title"]["ml"] = marker
            break
        elif "title" in b:
            # convert to bilingual dict
            target_idx = i
            original_first = {"title": b["title"]}
            b["title"] = {"en": b.get("title", ""), "ml": marker}
            break
    if target_idx is None:
        pytest.skip("No suitable block with title")

    # PUT the page
    put_url = f"{API}/pages/{PAGE_KEY}"
    upd = requests.put(put_url, json=page, headers=auth_headers)
    if upd.status_code == 404:
        # Try /api/admin/pages/{key}
        upd = requests.put(f"{API}/admin/pages/{PAGE_KEY}", json=page, headers=auth_headers)
    assert upd.status_code in (200, 201), f"Page update failed: {upd.status_code} {upd.text[:300]}"

    # Verify
    check = requests.get(f"{API}/pages/{PAGE_KEY}").json()
    check_blocks = check.get("blocks") or check.get("content_blocks") or []
    t = check_blocks[target_idx].get("title")
    assert isinstance(t, dict), f"title not bilingual dict after save: {t}"
    assert t.get("ml") == marker, f"ml not persisted: {t}"

    # Restore
    check_blocks[target_idx]["title"] = original_first["title"]
    check.pop("_id", None)
    restore = requests.put(put_url, json=check, headers=auth_headers)
    if restore.status_code == 404:
        requests.put(f"{API}/admin/pages/{PAGE_KEY}", json=check, headers=auth_headers)


# -------- regression: media_visible + nav_visibility --------

def test_regression_media_visible_toggle(auth_headers):
    r = requests.get(f"{API}/projects/{PROJECT_SLUG}")
    if r.status_code == 404:
        pytest.skip("skip")
    orig = r.json().get("media_visible", True)
    upd = requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": False}, headers=auth_headers)
    assert upd.status_code == 200
    assert requests.get(f"{API}/projects/{PROJECT_SLUG}").json()["media_visible"] is False
    requests.put(f"{API}/projects/{PROJECT_SLUG}", json={"media_visible": orig}, headers=auth_headers)


def test_regression_nav_visibility_still_present():
    r = requests.get(f"{API}/settings")
    assert r.status_code == 200
    assert "nav_visibility" in r.json()
