"""One publication rule shared by API, profiles, sitemap and initial HTML."""
from copy import deepcopy
from fastapi import HTTPException
from models.schemas import ProjectMedia

PUBLIC_QUERY = {"status": "published", "publication_reviewed": True}

def text(value):
    return (value.get('en') or '') if isinstance(value, dict) else str(value or '')

def public_document(doc):
    doc = deepcopy(doc)
    doc.pop('_id', None)
    doc.pop('verification_notes', None)
    for key in ('contact_email', 'contact_phone', 'email', 'phone', 'lead_notification_email'):
        doc.pop(key, None)
    if doc.get('media') and any(k in doc['media'] for k in ['hero_video', 'gallery', 'images', 'plans', 'plan_drawings', 'model_3d_url']):
        doc['media'] = ProjectMedia.model_validate(doc['media']).model_dump()
        doc['media']['images'] = [m for m in doc['media'].get('images', []) if m.get('approved')]
        doc['media']['renders_3d'] = [m for m in doc['media'].get('renders_3d', []) if m.get('approved')]
        if not doc['media'].get('plans_public'):
            doc['media']['plans'] = []
        else:
            doc['media']['plans'] = [m for m in doc['media'].get('plans', []) if m.get('approved')]
    doc['credits'] = [c for c in doc.get('credits', []) if c.get('verified') and c.get('entity_type') and c.get('entity_slug')]
    doc.pop('partner_stack', None)
    return doc

async def publication_check(db, doc, kind, admin):
    if doc.get('status') != 'published':
        return
    problems = []
    if admin.get('role') == 'editor':
        raise HTTPException(403, 'Editors can save drafts and submit for review; a publisher must publish.')
    if not doc.get('publication_reviewed'):
        problems.append('Confirm factual accuracy and publication permissions.')
    if not text(doc.get('title') if kind == 'project' else doc.get('name') if kind in ['partner', 'leader'] else doc.get('content')):
        problems.append('A title, name or testimonial is required.')
    if kind == 'project':
        if not doc.get('location') or not text(doc.get('scope')):
            problems.append('Add the project location and Septa delivery scope.')
        for credit in doc.get('credits', []):
            collection = db.leaders if credit['entity_type'] == 'leader' else db.partners
            linked = await collection.find_one({'slug': credit['entity_slug'], **PUBLIC_QUERY})
            if not credit.get('verified') or not linked:
                problems.append(f"Verify and publish the credit for {credit['entity_slug']}.")
    for field in ['website_url', 'instagram_url']:
        url = doc.get(field)
        if url and (not url.startswith('https://') or 'placeholder' in url):
            problems.append(f'{field} must be a real HTTPS address or empty.')
    if problems:
        raise HTTPException(422, {'message': 'Publication checks need attention', 'issues': problems})
