"""CMS release workflows: people, credits, recovery, permissions and readiness."""
import os
import secrets
import uuid
from datetime import datetime, timezone
from typing import Optional, Literal
from fastapi import Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field, EmailStr
from pymongo.errors import DuplicateKeyError
from models.schemas import LeaderCreate, ProjectMedia
from utils.auth import get_current_admin, get_optional_admin, get_password_hash
from services.content import PUBLIC_QUERY, PARTNER_PUBLIC_QUERY, public_document, publication_check, text
from services.storage_service import is_cloud_storage_configured
from services.notifications import deliver
from config import PRODUCTION, SITE_URL, INDEXABLE, BUILD_DIR, ADMIN_AUTH_MODE, GOOGLE_WORKSPACE_DOMAIN

class NewUser(BaseModel):
    email: EmailStr
    password: Optional[str] = Field(default=None, min_length=12, max_length=72)
    role: Literal['owner', 'publisher', 'editor'] = 'editor'

class UserAccess(BaseModel):
    role: Literal['owner', 'publisher', 'editor']
    disabled: bool = False


def attach_release_routes(router, db, audit):
    @router.get('/leaders')
    async def leaders(published_only: bool = True, admin=Depends(get_optional_admin)):
        query = PUBLIC_QUERY if published_only or not admin else {}
        return await db.leaders.find(query, {'_id': 0}).sort('name.en', 1).to_list(500)

    @router.get('/leaders/{slug}')
    async def leader(slug: str, preview: bool = False, admin=Depends(get_optional_admin)):
        query = {'slug': slug, **({} if preview and admin else PUBLIC_QUERY)}
        doc = await db.leaders.find_one(query, {'_id': 0})
        if not doc:
            raise HTTPException(404, 'Project leader not found')
        return doc

    @router.post('/leaders', status_code=201)
    async def create_leader(body: LeaderCreate, admin=Depends(get_current_admin)):
        doc = body.model_dump()
        await publication_check(db, doc, 'leader', admin)
        doc.update(id=str(uuid.uuid4()), created_at=datetime.now(timezone.utc).isoformat())
        try:
            await db.leaders.insert_one(doc)
        except DuplicateKeyError:
            raise HTTPException(409, 'This URL is already in use')
        await audit(admin['admin_id'], admin['email'], 'create', 'leader', doc['id'])
        return {'id': doc['id'], 'slug': doc['slug']}

    @router.put('/leaders/{slug}')
    async def update_leader(slug: str, body: LeaderCreate, admin=Depends(get_current_admin)):
        old = await db.leaders.find_one({'slug': slug}, {'_id': 0})
        if not old:
            raise HTTPException(404, 'Project leader not found')
        if body.slug != slug:
            raise HTTPException(422, 'Published URLs are stable; keep the original slug.')
        doc = body.model_dump()
        await publication_check(db, doc, 'leader', admin)
        await db.revisions.insert_one({'id': str(uuid.uuid4()), 'collection': 'leaders', 'slug': slug, 'snapshot': old, 'created_at': datetime.now(timezone.utc).isoformat()})
        await db.leaders.update_one({'slug': slug}, {'$set': {**doc, 'updated_at': datetime.now(timezone.utc).isoformat()}})
        await audit(admin['admin_id'], admin['email'], 'update', 'leader', old['id'])
        return {'message': 'Project leader saved'}

    @router.get('/credits/{entity_type}/{slug}/projects')
    async def credited_projects(entity_type: Literal['leader', 'partner'], slug: str):
        collection = db.leaders if entity_type == 'leader' else db.partners
        visibility = PARTNER_PUBLIC_QUERY if entity_type == 'partner' else PUBLIC_QUERY
        if not await collection.find_one({'slug': slug, **visibility}):
            raise HTTPException(404, 'Profile not found')
        docs = await db.projects.find({**PUBLIC_QUERY, 'credits': {'$elemMatch': {'entity_type': entity_type, 'entity_slug': slug, 'verified': True}}}, {'_id': 0}).to_list(500)
        return [public_document(doc) for doc in docs]

    @router.get('/projects/{slug}/credits')
    async def project_credits(slug: str, preview: bool = False, admin=Depends(get_optional_admin)):
        preview = bool(preview and admin)
        doc = await db.projects.find_one({'slug': slug, **({} if preview else PUBLIC_QUERY)})
        if not doc:
            raise HTTPException(404, 'Project not found')
        result = []
        for c in doc.get('credits', []):
            if (not preview and not c.get('verified')) or c.get('entity_type') not in ('leader', 'partner') or not c.get('entity_slug'):
                continue
            collection = db.leaders if c['entity_type'] == 'leader' else db.partners
            visibility = PARTNER_PUBLIC_QUERY if c['entity_type'] == 'partner' else PUBLIC_QUERY
            entity = await collection.find_one({'slug': c['entity_slug'], **({} if preview else visibility)})
            if entity:
                result.append({**c, 'photo': entity.get('photo') or ((entity.get('media') or {}).get('portrait_image') if entity.get('profile_type') == 'person' else (entity.get('media') or {}).get('logo_image')) or (entity.get('media') or {}).get('card_image') or '', 'profile_type': entity.get('profile_type', 'person' if c['entity_type']=='leader' else 'company'), 'firm': entity.get('firm',''), 'name': entity['name'], 'url': ('/project-leaders/' if c['entity_type'] == 'leader' else '/ecosystem/') + c['entity_slug']})
        return result

    @router.get('/admin/revisions/{collection}/{slug}')
    async def revisions(collection: Literal['projects', 'partners', 'leaders'], slug: str, admin=Depends(get_current_admin)):
        return await db.revisions.find({'collection': collection, 'slug': slug}, {'_id': 0, 'snapshot': 0}).sort('created_at', -1).to_list(50)

    @router.post('/admin/revisions/{revision_id}/restore')
    async def restore_revision(revision_id: str, admin=Depends(get_current_admin)):
        revision = await db.revisions.find_one({'id': revision_id})
        if not revision or revision['collection'] not in ['projects', 'partners', 'leaders']:
            raise HTTPException(404, 'Revision not found')
        collection = db[revision['collection']]
        old = await collection.find_one({'slug': revision['slug']}, {'_id': 0})
        if old:
            await db.revisions.insert_one({'id': str(uuid.uuid4()), 'collection': revision['collection'], 'slug': revision['slug'], 'snapshot': old, 'created_at': datetime.now(timezone.utc).isoformat()})
        restored = {**revision['snapshot'], 'status': 'draft', 'publication_reviewed': False, 'updated_at': datetime.now(timezone.utc).isoformat()}
        await collection.replace_one({'slug': revision['slug']}, restored, upsert=True)
        await audit(admin['admin_id'], admin['email'], 'restore', revision['collection'], revision['slug'])
        return {'message': 'Restored as a draft. Review before publishing.'}

    @router.post('/admin/restore/{collection}/{key}')
    async def restore_archive(collection: Literal['projects', 'partners', 'leaders', 'leads', 'testimonials'], key: str, admin=Depends(get_current_admin)):
        field = 'id' if collection in ['leads', 'testimonials'] else 'slug'
        update = {'status': 'new'} if collection == 'leads' else {'status': 'draft', 'publication_reviewed': False}
        result = await db[collection].update_one({field: key, 'status': 'archived'}, {'$set': update})
        if not result.matched_count:
            raise HTTPException(404, 'Archived record not found')
        await audit(admin['admin_id'], admin['email'], 'restore', collection, key)
        return {'message': 'Record restored'}

    @router.post('/leads/{lead_id}/retry-notification')
    async def retry(lead_id: str, background_tasks: BackgroundTasks, admin=Depends(get_current_admin)):
        result = await db.leads.update_one({'id': lead_id, 'notification_status': {'$ne': 'sending'}}, {'$set': {'notification_status': 'pending', 'notification_attempts': 0}, '$unset': {'notification_retry_at': ''}})
        if not result.matched_count:
            raise HTTPException(409, 'Notification is already processing or lead does not exist')
        background_tasks.add_task(deliver, db, lead_id)
        return {'message': 'Notification queued'}

    @router.get('/admin/readiness')
    async def readiness(admin=Depends(get_current_admin)):
        counts = {}
        for collection in ['projects', 'partners', 'leaders', 'testimonials']:
            visibility = PARTNER_PUBLIC_QUERY if collection == 'partners' else PUBLIC_QUERY
            counts[collection] = {'published': await db[collection].count_documents(visibility), 'needs_review': await db[collection].count_documents({'publication_reviewed': {'$ne': True}, 'status': {'$ne': 'archived'}})}
        counts['pages'] = {
            'published': await db.page_content.count_documents({'$or':[PUBLIC_QUERY,{'published_snapshot.status':'published','published_snapshot.publication_reviewed':True}]}),
            'needs_review': await db.page_content.count_documents({'status':{'$in':['draft','review']}})
        }
        search_actions = []
        for kind, collection, prefix in [('project', db.projects, '/projects/'), ('collaborator', db.partners, '/ecosystem/')]:
            visibility = PARTNER_PUBLIC_QUERY if kind == 'collaborator' else PUBLIC_QUERY
            for record in await collection.find(visibility, {'_id': 0}).to_list(500):
                issues = []
                seo = record.get('seo') or {}
                if not seo.get('title') or not seo.get('description'):
                    issues.append('Write a unique search title and description.')
                if kind == 'project':
                    if not text(record.get('short_description')):
                        issues.append('Explain the project in a short description.')
                    if not any(text(item) for item in (record.get('story') or {}).get('paragraphs', [])):
                        issues.append('Add factual project story paragraphs.')
                    if not record.get('credits'):
                        issues.append('Add verified team credits if public attribution is approved.')
                    if not record.get('image'):
                        issues.append('Add an approved project cover image.')
                else:
                    if not text(record.get('bio_long')):
                        issues.append('Add a factual full biography or company profile.')
                    if record.get('profile_type') == 'person' and not text(record.get('professional_role')):
                        issues.append('Confirm the professional role.')
                    if not (record.get('media') or {}).get('card_image'):
                        issues.append('Add an approved collaborator card image.')
                if issues:
                    search_actions.append({'kind': kind, 'name': text(record.get('title') or record.get('name')),
                                           'url': prefix + record['slug'], 'issues': issues})
        return {'environment': 'production' if PRODUCTION else 'development', 'site_url': SITE_URL,
            'indexing_enabled': INDEXABLE, 'persistent_storage_configured': is_cloud_storage_configured(),
            'email_configured': bool(os.getenv('RESEND_API_KEY') and os.getenv('ADMIN_NOTIFY_EMAIL') and os.getenv('FROM_EMAIL') and 'resend.dev' not in os.getenv('FROM_EMAIL', '')),
            'frontend_build_present': (BUILD_DIR / 'index.html').exists(), 'content': counts,
            'search_content_actions': search_actions,
            'new_leads': await db.leads.count_documents({'status': 'new'}),
            'failed_notifications': await db.leads.count_documents({'notification_status': 'failed'}),
            'overdue_followups': await db.leads.count_documents({'follow_up_at': {'$gt': '', '$lt': datetime.now(timezone.utc).isoformat()}, 'status': {'$nin': ['closed', 'archived']}})}

    @router.get('/admin/users')
    async def users(admin=Depends(get_current_admin)):
        return await db.admins.find({}, {'_id': 0, 'password_hash': 0, 'google_sub': 0, 'auth_version': 0, 'reset_hash': 0, 'reset_expires': 0, 'reset_auth_version': 0, 'reset_requested_at': 0, 'otp_hash': 0, 'otp_challenge': 0, 'otp_expires': 0, 'otp_version': 0, 'otp_attempts': 0}).to_list(100)

    @router.post('/admin/users', status_code=201)
    async def add_user(body: NewUser, admin=Depends(get_current_admin)):
        email = str(body.email).lower()
        if ADMIN_AUTH_MODE == 'google' and not email.endswith('@' + GOOGLE_WORKSPACE_DOMAIN):
            raise HTTPException(422, 'Use an account in the configured Google Workspace domain.')
        if ADMIN_AUTH_MODE != 'google' and not body.password:
            raise HTTPException(422, 'Temporary password is required.')
        doc = {'id': str(uuid.uuid4()), 'email': email,
               'password_hash': get_password_hash(secrets.token_urlsafe(48) if ADMIN_AUTH_MODE == 'google' else body.password),
               'role': body.role, 'auth_version': 0, 'created_at': datetime.now(timezone.utc).isoformat()}
        try:
            await db.admins.insert_one(doc)
        except DuplicateKeyError:
            raise HTTPException(409, 'Account already exists')
        await audit(admin['admin_id'], admin['email'], 'create', 'admin', doc['id'])
        return {'message': 'Account created'}

    @router.patch('/admin/users/{user_id}')
    async def access(user_id: str, body: UserAccess, admin=Depends(get_current_admin)):
        if user_id == admin['admin_id']:
            raise HTTPException(422, 'You cannot disable or demote your own account.')
        result = await db.admins.update_one({'id': user_id}, {'$set': body.model_dump(), '$inc': {'auth_version': 1}})
        if not result.matched_count:
            raise HTTPException(404, 'Account not found')
        await audit(admin['admin_id'], admin['email'], 'access_change', 'admin', user_id)
        return {'message': 'Access updated and previous sessions revoked'}
