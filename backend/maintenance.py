"""Temporary, exact-page maintenance. This is presentation control, not media privacy."""
from datetime import datetime, timezone
from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from services.pages import PAGE_PATHS
from services.content import text
from utils.auth import get_current_admin, get_optional_admin


class MaintenanceChange(BaseModel):
    path: str
    enabled: bool = False
    title: str = Field(default='We’re updating this page.', min_length=3, max_length=100)
    message: str = Field(default='This page is temporarily unavailable while we update its content. Please check back soon or contact Septa.', max_length=500)
    retry_after: int = Field(default=3600, ge=60, le=86400)

    @field_validator('path')
    @classmethod
    def valid_path(cls, value):
        import re
        if not re.fullmatch(r'/(?:[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)?)?', value):
            raise ValueError('Choose an exact public page URL.')
        return value


async def page_options(db):
    pages = [{'path': path, 'label': name.replace('_', ' ').title()} for name, path in PAGE_PATHS.items()]
    pages.append({'path':'/privacy','label':'Privacy'})
    for collection, prefix in [('projects','projects'),('partners','ecosystem'),('leaders','project-leaders')]:
        for doc in await db[collection].find({}, {'_id':0,'slug':1,'name':1,'title':1}).to_list(1000):
            if doc.get('slug'):
                pages.append({'path':f"/{prefix}/{doc['slug']}", 'label':text(doc.get('name') or doc.get('title')) or doc['slug']})
    for doc in await db.search_pages.find({}, {'_id':0,'slug':1,'kind':1,'title':1}).to_list(1000):
        pages.append({'path':f"/{'services' if doc['kind']=='service' else 'locations'}/{doc['slug']}", 'label':doc['title']})
    return pages


async def maintenance_for(db, path):
    normalized = '/' + path.strip('/') if path.strip('/') else '/'
    return await db.page_maintenance.find_one({'path':normalized,'enabled':True}, {'_id':0})


def attach_maintenance_routes(router, db, audit):
    @router.get('/page-status')
    async def status(path: str = '/', preview: bool = False, admin=Depends(get_optional_admin)):
        entry = await maintenance_for(db, path)
        return {'maintenance':bool(entry), 'preview_allowed':bool(preview and admin), 'title':(entry or {}).get('title',''), 'message':(entry or {}).get('message','')}

    @router.get('/admin/maintenance')
    async def list_pages(admin=Depends(get_current_admin)):
        return {'pages':await page_options(db), 'settings':await db.page_maintenance.find({}, {'_id':0}).to_list(2000)}

    @router.put('/admin/maintenance')
    async def change_page(body: MaintenanceChange, admin=Depends(get_current_admin)):
        if admin['role'] not in ('owner','publisher'):
            raise HTTPException(403, 'A publisher or owner must change page availability.')
        if body.path not in {item['path'] for item in await page_options(db)}:
            raise HTTPException(404, 'Choose an existing public page. Admin and API routes cannot be put into maintenance.')
        doc = {**body.model_dump(), 'updated_at':datetime.now(timezone.utc).isoformat()}
        await db.page_maintenance.update_one({'path':body.path},{'$set':doc},upsert=True)
        await audit(admin['admin_id'],admin['email'],'maintenance','page',body.path)
        return doc
