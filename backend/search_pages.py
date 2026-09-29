"""Evidence-backed service and location pages authored in the Septa admin."""
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from copy import deepcopy

from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from models.page_design import safe_link

from models.schemas import SEOSettings
from services.content import PUBLIC_QUERY, public_document
from utils.auth import get_current_admin, get_optional_admin

SEARCH_PUBLIC_QUERY = {'$or':[PUBLIC_QUERY, {'published_snapshot.status':'published','published_snapshot.publication_reviewed':True}]}

def live_search_document(doc):
    if not doc:
        return None
    if doc.get('status') == 'published' and doc.get('publication_reviewed'):
        return public_search_page(doc)
    snapshot = doc.get('published_snapshot')
    return public_search_page(snapshot) if snapshot and snapshot.get('status') == 'published' and snapshot.get('publication_reviewed') else None


class SearchPage(BaseModel):
    kind: Literal['service', 'location']
    slug: str = Field(pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    title: str = Field(min_length=5, max_length=140)
    introduction: str = Field(default='', max_length=700)
    paragraphs: list[str] = Field(default_factory=list, max_length=12)
    paragraph_headings: list[str] = Field(default_factory=list, max_length=12)
    image: str = ''
    image_alt: str = Field(default='', max_length=200)
    location_name: str = Field(default='', max_length=100)
    project_slugs: list[str] = Field(default_factory=list, max_length=12)
    seo: SEOSettings = Field(default_factory=SEOSettings)
    status: Literal['draft', 'review', 'published', 'archived'] = 'draft'
    publication_reviewed: bool = False
    updated_at: str | None = None

    @field_validator('image')
    @classmethod
    def valid_image(cls, value):
        safe_link(value)
        return value

    @field_validator('paragraph_headings')
    @classmethod
    def short_headings(cls, value):
        if any(len(heading) > 120 for heading in value):
            raise ValueError('Section headings must be 120 characters or fewer.')
        return value


def public_search_page(doc):
    return {key: value for key, value in doc.items() if key not in ('_id', 'review_notes', 'published_snapshot')}


async def check_page(db, page, admin):
    if page.status in ('published','archived') and admin.get('role') == 'editor':
        raise HTTPException(403, 'Editors can submit for review; a publisher must publish or unpublish.')
    if page.status != 'published':
        return
    if admin.get('role') == 'editor':
        raise HTTPException(403, 'Editors can submit for review; a publisher must publish.')
    issues = []
    if not page.publication_reviewed:
        issues.append('Confirm project facts and publication permissions.')
    if len(page.introduction.strip()) < 60 or not any(len(item.strip()) >= 60 for item in page.paragraphs):
        issues.append('Write a useful introduction and at least one substantial factual paragraph.')
    if not page.project_slugs:
        issues.append('Link at least one approved project as evidence.')
    if page.kind == 'location' and not page.location_name.strip():
        issues.append('Enter the real town or district this page covers.')
    for slug in set(page.project_slugs):
        project = await db.projects.find_one({'slug': slug, **PUBLIC_QUERY}, {'location': 1})
        if not project:
            issues.append(f'Project {slug} must be reviewed and published first.')
        elif page.kind == 'location' and page.location_name.casefold().strip() not in (project.get('location') or '').casefold():
            issues.append(f'Project {slug} does not confirm work in {page.location_name}.')
    if issues:
        raise HTTPException(422, {'message': 'Review search-page evidence before publishing.', 'issues': issues})


def attach_search_routes(router, db, audit):
    @router.get('/search-pages')
    async def list_public_search_pages():
        return [live_search_document(doc) for doc in await db.search_pages.find(SEARCH_PUBLIC_QUERY, {'_id': 0}).sort('title', 1).to_list(200)]

    @router.get('/search-pages/{kind}/{slug}')
    async def public_page(kind: Literal['service', 'location'], slug: str, preview: bool = False, admin=Depends(get_optional_admin)):
        record = await db.search_pages.find_one({'kind': kind, 'slug': slug}, {'_id': 0})
        if preview and not admin:
            raise HTTPException(401, 'Sign in to preview unpublished content.')
        doc = public_search_page(record) if preview and record else live_search_document(record)
        if not doc:
            raise HTTPException(404, 'Search page not found')
        linked = await db.projects.find({'slug': {'$in': doc.get('project_slugs', [])}, **PUBLIC_QUERY}, {'_id': 0}).to_list(12)
        order = {project_slug: i for i, project_slug in enumerate(doc.get('project_slugs', []))}
        return {**public_search_page(doc), 'projects': [public_document(item) for item in sorted(linked, key=lambda item: order.get(item['slug'], 99))]}

    @router.get('/admin/search-pages')
    async def list_admin_pages(admin=Depends(get_current_admin)):
        return await db.search_pages.find({}, {'_id': 0}).sort('title', 1).to_list(500)

    @router.get('/admin/search-pages/{kind}/{slug}/revisions')
    async def revisions(kind: str, slug: str, admin=Depends(get_current_admin)):
        return await db.search_page_revisions.find({'kind':kind,'slug':slug},{'_id':0}).sort('created_at',-1).to_list(20)

    @router.post('/admin/search-pages', status_code=201)
    async def create_page(page: SearchPage, admin=Depends(get_current_admin)):
        await check_page(db, page, admin)
        if await db.search_pages.find_one({'kind': page.kind, 'slug': page.slug}):
            raise HTTPException(409, 'This page URL is already in use.')
        doc = page.model_dump()
        doc.update(id=str(uuid4()), updated_at=datetime.now(timezone.utc).isoformat())
        await db.search_pages.insert_one(doc)
        await audit(admin['admin_id'], admin['email'], 'create', 'search_page', doc['id'])
        return {'kind': page.kind, 'slug': page.slug}

    @router.put('/admin/search-pages/{kind}/{slug}')
    async def update_page(kind: Literal['service', 'location'], slug: str, page: SearchPage, admin=Depends(get_current_admin)):
        old = await db.search_pages.find_one({'kind': kind, 'slug': slug}, {'_id': 0})
        if not old:
            raise HTTPException(404, 'Page not found')
        if page.kind != kind or page.slug != slug:
            raise HTTPException(422, 'Published URLs are stable. Keep the original type and slug.')
        await check_page(db, page, admin)
        if page.updated_at is not None and page.updated_at != old.get('updated_at'):
            raise HTTPException(409,'Another editor changed this page. Reload before saving.')
        doc = {**public_search_page(old), **page.model_dump(), 'updated_at': datetime.now(timezone.utc).isoformat()}
        live = live_search_document(old)
        if page.status in ('draft','review') and live:
            doc['published_snapshot'] = deepcopy(live)
        result = await db.search_pages.replace_one({'kind':kind,'slug':slug,'updated_at':old.get('updated_at')},doc)
        if not result.matched_count:
            raise HTTPException(409,'Another editor changed this page. Reload before saving.')
        await db.search_page_revisions.insert_one({'id':str(uuid4()),'kind':kind,'slug':slug,'snapshot':public_search_page(old),'created_at':doc['updated_at']})
        await audit(admin['admin_id'], admin['email'], 'update', 'search_page', old['id'])
        return {'kind': kind, 'slug': slug}
