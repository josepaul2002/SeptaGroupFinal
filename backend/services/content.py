"""One publication rule shared by API, profiles, sitemap and initial HTML."""
from copy import deepcopy
from fastapi import HTTPException
from models.schemas import ProjectMedia

PUBLIC_QUERY = {"status": "published", "publication_reviewed": True}
# Existing collaborators were already public with status=published, including
# records without a review flag. Keep that status authoritative for reads;
# publication_check still requires review for every new published write.
PARTNER_PUBLIC_QUERY = {"status": "published"}

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
            linked_query = PARTNER_PUBLIC_QUERY if credit['entity_type'] == 'partner' else PUBLIC_QUERY
            linked = await collection.find_one({'slug': credit['entity_slug'], **linked_query})
            if not linked:
                problems.append(f"Profile {credit['entity_slug']} is not reviewed and published. Publish it in {'Project leaders' if credit['entity_type']=='leader' else 'Partners'}, or remove this credit. You can still save this project as a draft.")
            if not credit.get('verified'):
                problems.append(f"Confirm the project role using Credit verified for {credit['entity_slug']}.")
            if credit.get('display_as') == 'company' and not credit.get('affiliation_at_time', '').strip():
                problems.append('Enter the company represented when displaying a company credit.')
            if credit.get('affiliation_url') and not credit['affiliation_url'].startswith('https://'):
                problems.append('Company website must start with https://.')
    if kind == 'testimonial' and doc.get('project_ref'):
        project = await db.projects.find_one({'slug': doc['project_ref'], **PUBLIC_QUERY})
        if not project:
            problems.append('Choose a published, reviewed project or clear the project link.')
        elif doc.get('completed_project') and project.get('project_status') != 'Completed':
            problems.append('The linked project must be marked Completed for a completed-project testimonial.')
    for field in ['website_url', 'instagram_url', 'facebook_url']:
        url = doc.get(field)
        if url and (not url.startswith('https://') or 'placeholder' in url):
            problems.append(f'{field} must be a real HTTPS address or empty.')
    if problems:
        raise HTTPException(422, {'message': 'Publication checks need attention', 'issues': problems})
