"""Expiring, revocable review links for unpublished collaborator profiles."""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import secrets
import uuid

from fastapi import Depends, HTTPException, Request, Response
from pydantic import BaseModel, Field

from config import SITE_URL
from utils.auth import get_current_admin


class ReviewLinkOptions(BaseModel):
    expires_days: int = Field(default=7, ge=1, le=14)


class ReviewDecision(BaseModel):
    decision: str
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(default='', max_length=254)
    comment: str = Field(default='', max_length=2000)
    permission_confirmed: bool = False


VISIBLE_FIELDS = (
    'slug', 'name', 'profile_type', 'professional_role', 'firm', 'category',
    'relationship_type', 'bio_short', 'bio_long', 'specialties', 'highlights',
    'districts', 'website_url', 'facebook_url', 'instagram_url', 'media',
    'known_for', 'septa_collaboration',
)


def profile_snapshot(partner):
    """Only fields intended for the external profile; never expose admin contact data."""
    return {field: partner[field] for field in VISIBLE_FIELDS if field in partner}


def review_state(review, partner):
    stale = (partner or {}).get('updated_at', '') != review['partner_updated_at']
    expired = datetime.fromisoformat(review['expires_at']) <= datetime.now(timezone.utc)
    return {key: review[key] for key in ('id', 'slug', 'status', 'created_at', 'expires_at', 'response') if key in review} | {'stale': stale, 'expired': expired}


def attach_collaborator_review_routes(router, db, limiter):
    @router.post('/admin/partners/{slug}/review-links', status_code=201)
    async def create_review_link(slug: str, request: Request, options: ReviewLinkOptions,
                                 admin=Depends(get_current_admin)):
        if admin.get('role') not in ('owner', 'publisher'):
            raise HTTPException(403, 'A publisher must create external review links.')
        partner = await db.partners.find_one({'slug': slug}, {'_id': 0})
        if not partner or partner.get('status') == 'archived':
            raise HTTPException(404, 'Collaborator not found.')
        if partner.get('status') == 'published':
            raise HTTPException(409, 'This profile is already public. Move a revised profile to draft before external review.')
        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        review = {
            'id': str(uuid.uuid4()), 'slug': slug,
            'token_hash': sha256(token.encode()).hexdigest(),
            'snapshot': profile_snapshot(partner),
            'partner_updated_at': partner.get('updated_at', ''),
            'status': 'pending', 'created_by': admin['email'],
            'created_at': now.isoformat(),
            'expires_at': (now + timedelta(days=options.expires_days)).isoformat(),
        }
        await db.partner_reviews.insert_one(review)
        origin = SITE_URL or str(request.base_url).rstrip('/')
        return {'url': f'{origin}/review/collaborator/{token}', 'review': review_state(review, partner)}

    @router.get('/admin/partner-reviews')
    async def list_reviews(admin=Depends(get_current_admin)):
        reviews = await db.partner_reviews.find({}, {'_id': 0, 'token_hash': 0, 'snapshot': 0}).sort('created_at', -1).to_list(500)
        partners = {p['slug']: p for p in await db.partners.find({}, {'_id': 0, 'slug': 1, 'updated_at': 1}).to_list(500)}
        return [review_state(item, partners.get(item['slug'])) for item in reviews]

    @router.post('/admin/partner-reviews/{review_id}/revoke')
    async def revoke_review(review_id: str, admin=Depends(get_current_admin)):
        if admin.get('role') not in ('owner', 'publisher'):
            raise HTTPException(403, 'A publisher must revoke external review links.')
        changed = await db.partner_reviews.update_one({'id': review_id, 'status': {'$ne': 'revoked'}}, {'$set': {'status': 'revoked'}})
        if not changed.matched_count:
            raise HTTPException(404, 'Active review link not found.')
        return {'message': 'Review link revoked'}

    async def active_review(token: str):
        if len(token) < 35 or len(token) > 70:
            raise HTTPException(404, 'Review link not found.')
        review = await db.partner_reviews.find_one({'token_hash': sha256(token.encode()).hexdigest()}, {'_id': 0})
        if not review:
            raise HTTPException(404, 'Review link not found.')
        if review['status'] == 'revoked' or datetime.fromisoformat(review['expires_at']) <= datetime.now(timezone.utc):
            raise HTTPException(410, 'This review link is no longer available. Ask Septa for a new one.')
        partner = await db.partners.find_one({'slug': review['slug']}, {'_id': 0, 'updated_at': 1, 'status': 1})
        if not partner or partner.get('status') == 'archived' or partner.get('updated_at', '') != review['partner_updated_at']:
            raise HTTPException(410, 'This profile has changed. Ask Septa for a new review link.')
        return review

    @router.get('/collaborator-review/{token}')
    @limiter.limit('20/minute')
    async def view_review(request: Request, response: Response, token: str):
        review = await active_review(token)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
        return {'profile': review['snapshot'], 'status': review['status'], 'expires_at': review['expires_at']}

    @router.post('/collaborator-review/{token}/respond')
    @limiter.limit('5/minute')
    async def respond_to_review(request: Request, token: str, answer: ReviewDecision):
        review = await active_review(token)
        if review['status'] != 'pending':
            raise HTTPException(409, 'This review already has a response.')
        if answer.decision not in ('approved', 'changes_requested'):
            raise HTTPException(422, 'Choose approve or request changes.')
        if answer.decision == 'approved' and not answer.permission_confirmed:
            raise HTTPException(422, 'Confirm that you are authorised to approve this text and media.')
        changed = await db.partner_reviews.update_one(
            {'id': review['id'], 'status': 'pending'},
            {'$set': {'status': answer.decision, 'response': {
                'name': answer.name.strip(), 'email': answer.email.strip(),
                'comment': answer.comment.strip(), 'permission_confirmed': answer.permission_confirmed,
                'submitted_at': datetime.now(timezone.utc).isoformat(),
            }}}
        )
        if not changed.matched_count:
            raise HTTPException(409, 'This review already has a response.')
        return {'message': 'Your response has been recorded for Septa to review.'}
