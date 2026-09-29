"""Page content shared by the CMS, public API and search HTML."""
import json
from copy import deepcopy
from pathlib import Path
from models.page_design import PageDesign, safe_link
from html import escape
from urllib.parse import quote
PUBLIC_QUERY = {'status':'published','publication_reviewed':True}

def text(value):
    return (value.get('en') or '') if isinstance(value,dict) else str(value or '')

DEFAULTS = json.loads((Path(__file__).resolve().parents[2] / 'frontend/src/content/pageDefaults.json').read_text())
PAGE_PATHS = {'home': '/', 'about': '/about', 'services': '/services', 'projects': '/projects', 'ecosystem': '/ecosystem', 'contact': '/contact', 'leaders': '/project-leaders'}


def design(page_id, doc=None):
    """Preserve legacy blocks in the new editor without modifying stored records."""
    base = deepcopy(DEFAULTS[page_id])
    if not doc:
        return base
    if doc.get('version') == 2:
        result = {**base, **{k: v for k, v in doc.items() if k not in ('_id', 'published_snapshot')}}
        if page_id == 'home' and doc.get('layout_revision', 1) < 2:
            # Upgrade once on read/save. Keep custom headings, featured choices and hidden sections.
            sections = deepcopy(result['sections'])
            sections = [section for section in sections if not (section.get('id') == 'approach' and text(section.get('title')) == 'A clear place to start.' and text(section.get('body')) == 'Whether you have an architect, a set of plans or an early idea, start with a conversation about the work you need.')]
            insertion = next((i for i, section in enumerate(sections) if section['type'] == 'cta'), len(sections))
            added = [deepcopy(section) for section in base['sections'] if section['id'] in ('home-septa-team','home-collaborators','home-coverage','home-testimonials') and not any(old['id']==section['id'] for old in sections)]
            sections[insertion:insertion] = added
            result.update(sections=sections, layout_revision=2)
        if page_id == 'home' and doc.get('layout_revision', 1) < 6:
            # Add the new editable slot to existing home pages once, preserving
            # every editor change and allowing a later intentional deletion.
            ticker = next(s for s in base['sections'] if s['id'] == 'home-highlights')
            if not any(s.get('id') == ticker['id'] for s in result['sections']):
                result['sections'] = [deepcopy(ticker), *result['sections']]
        result['sections'] = [s for s in result['sections'] if s.get('type') != 'locations']
        if page_id == 'about' and doc.get('layout_revision', 1) < 5:
            # The earlier About layout copied the Services card block. Drop that
            # duplicate on read so old saved pages adopt the editorial About flow.
            result['sections'] = [section for section in result['sections'] if not (
                section.get('id') == 'services' or
                (section.get('type') == 'cards' and text(section.get('title')).strip().lower() in
                 ('what we build', 'construction, shaped to fit', 'construction shaped to fit'))
            )]
            editorial = [section for section in base['sections'] if section.get('id') in ('about-story','about-journey')]
            present = {section.get('id') for section in result['sections']}
            insert_at = next((i for i, section in enumerate(result['sections']) if section.get('type') in ('people','collaborators','testimonials','cta')), len(result['sections']))
            result['sections'][insert_at:insert_at] = [deepcopy(section) for section in editorial if section.get('id') not in present]
            result['hero'] = {**base['hero'], **result.get('hero', {})}
            # Older About layouts reused the Services hero verbatim. Replace only
            # that known duplicate copy; preserve editor-managed media and links.
            if text(result['hero'].get('title')) == text(DEFAULTS['services']['hero'].get('title')):
                for field in ('eyebrow', 'title', 'body', 'primary_label', 'secondary_label'):
                    result['hero'][field] = deepcopy(base['hero'][field])
        result['layout_revision'] = 6
        return result
    types = {'metrics': 'stats', 'timeline_step': 'process', 'team_member': 'cards', 'proof_callout': 'cards', 'comparison_row': 'cards'}
    for kind, target in types.items():
        blocks = sorted([b for b in doc.get('blocks', []) if b.get('block_type') == kind], key=lambda b:b.get('order', 0))
        if not blocks:
            continue
        items = [{k: b.get(k) or ({} if k in ['title','subtitle','body','link_label'] else '') for k in ['title','subtitle','body','image_url','link_url','link_label']} for b in blocks]
        for i, item in enumerate(items):
            item['id'] = blocks[i].get('id') or f'{kind}-{i}'
            for field in ['title','subtitle','body','link_label']:
                if isinstance(item[field],str):
                    item[field] = {'en':item[field],'ml':''}
        base['sections'].insert(-1, {'id': 'legacy-'+kind, 'type': target, 'enabled': True, 'title': {'en': {'metrics':'At a glance','timeline_step':'How we work','team_member':'Our team','proof_callout':'In practice','comparison_row':'Our approach'}[kind]}, 'items': items, 'theme':'white'})
    base.update(status=doc.get('status','draft'), publication_reviewed=doc.get('publication_reviewed',False), updated_at=doc.get('updated_at'))
    return base

def approved(doc):
    return doc and doc.get('status') == 'published' and doc.get('publication_reviewed') is True

async def public_page(db, page_id):
    doc = await db.page_content.find_one({'page_id': page_id}, {'_id': 0})
    live = doc if approved(doc) else (doc or {}).get('published_snapshot')
    result = design(page_id, live if approved(live) else None)
    result['sections'] = [s for s in result['sections'] if s.get('enabled', True)]
    return result

async def design_html(db, page, settings, before_cta=''):
    """Readable initial HTML follows the same enabled sections as React."""
    def paragraph(value):
        return '<p>' + escape(text(value)) + '</p>' if text(value) else ''
    def link(href, label):
        try:
            safe_link(href or '')
        except ValueError:
            return ''
        return f'<p><a href="{escape(href, quote=True)}">{escape(text(label))}</a></p>' if href else ''
    def picture(href, alt):
        try:
            safe_link(href or '')
        except ValueError:
            return ''
        return f'<img src="{escape(href, quote=True)}" alt="{escape(alt or "", quote=True)}" loading="lazy">' if href else ''
    hero = page.get('hero') or {}
    body = paragraph(hero.get('body')) + picture(hero.get('image_url'), hero.get('image_alt'))
    for prefix in ['primary','secondary']:
        body += link(hero.get(prefix+'_url'),hero.get(prefix+'_label'))
    inserted = False
    for section in page.get('sections', []):
        if not section.get('enabled',True):
            continue
        kind, items = section['type'], section.get('items') or []
        if kind == 'cta' and before_cta and not inserted:
            body += before_cta
            inserted = True
        if kind == 'cards' and section.get('source') == 'services':
            service_page = await public_page(db,'services')
            items = [i for s in service_page['sections'] if s['type']=='cards' and s.get('source')!='services' for i in s.get('items',[])][:section.get('limit',3)]
        if kind == 'locations' and section.get('source') == 'about':
            about = await public_page(db, 'about')
            source = next((s for s in about['sections'] if s['type']=='locations'), None)
            if not source:
                continue
            items = source.get('items') or []
        if kind == 'locations' and not items:
            items = [{'title':{'en':name}} for name in (settings.get('contact') or {}).get('operating_districts',[])]
        if kind in ['projects','people','testimonials','collaborators']:
            coll = {'projects':'projects','people':'leaders','testimonials':'testimonials','collaborators':'partners'}[kind]
            from services.content import PARTNER_PUBLIC_QUERY
            query = dict(PARTNER_PUBLIC_QUERY if kind == 'collaborators' else PUBLIC_QUERY)
            if kind == 'projects' and section.get('project_type'):
                query['type'] = section['project_type']
            records = await db[coll].find(query,{'_id':0}).to_list(500)
            if kind == 'collaborators':
                records.sort(key=lambda r: not bool(r.get('is_featured')))
            if section.get('selected_slugs'):
                records = [r for slug in section['selected_slugs'] for r in records if (r.get('slug') or r.get('id'))==slug]
            records = records[:section.get('limit',3)]
            if not records:
                continue
            items = []
            for record in records:
                from services.content import public_document
                r = public_document(record)
                prefix = '/projects/' if kind=='projects' else '/ecosystem/' if kind=='collaborators' else '/project-leaders/'
                items.append({'title':r.get('title') if kind=='projects' else r.get('name') or r.get('client_name'),'body':r.get('short_description') or r.get('bio_short') or r.get('bio') or r.get('content') or r.get('quote'),'image_url':r.get('cover_image') or r.get('image') or r.get('profile_image') or r.get('photo') or ((r.get('media') or {}).get('portrait_image') if r.get('profile_type')=='person' else (r.get('media') or {}).get('card_image')),'image_alt':text(r.get('title') or r.get('name')),'link_url':prefix+r['slug'] if kind!='testimonials' else ('/projects/'+quote(r['project_ref'])+'#client-perspectives' if r.get('project_ref') and await db.projects.find_one({'slug':r['project_ref'],**PUBLIC_QUERY}) else ''), 'link_label':{'en':'Explore'}})
        if kind in ['cards','process','stats','highlight_ticker','faq'] and not items:
            continue
        body += '<section id="'+escape(section.get('id',''),quote=True)+'"><h2>'+escape(text(section.get('title')))+'</h2>'+paragraph(section.get('body'))
        body += picture(section.get('image_url'),section.get('image_alt'))
        for item in items:
            body += '<article><h3>'+escape(text(item.get('title')))+'</h3>'+paragraph(item.get('subtitle'))+paragraph(item.get('body'))
            body += picture(item.get('image_url'),item.get('image_alt'))
            href = item.get('link_url')
            if not href and kind=='cards':
                href = '/projects?type='+quote(item['tag']) if item.get('tag') else '/contact'
            if not href and kind=='locations':
                href = '/contact'
            body += link(href,item.get('link_label') or {'en':'Explore'})+'</article>'
        body += link(section.get('link_url'),section.get('link_label'))+'</section>'
    return body + (before_cta if not inserted else '')

def next_document(page_id, body, old, now):
    doc = {**body.model_dump(), 'page_id':page_id, 'updated_at':now}
    doc['sections'] = [s for s in doc['sections'] if s.get('type') != 'locations']
    doc['layout_revision'] = 6
    live = design(page_id, old) if approved(old) else (old or {}).get('published_snapshot')
    if body.status not in ('published','archived') and approved(live):
        doc['published_snapshot'] = deepcopy(live)
    return doc

def attach_page_routes(router, db, audit):
    from fastapi import Depends, HTTPException
    from utils.auth import get_current_admin
    from datetime import datetime, timezone
    from uuid import uuid4

    def check(page_id):
        if page_id not in DEFAULTS:
            raise HTTPException(404, 'Page not found')

    @router.get('/site-pages/{page_id}')
    async def published_page(page_id: str):
        check(page_id)
        return await public_page(db, page_id)

    @router.get('/admin/pages/{page_id}')
    async def edit_page(page_id: str, admin=Depends(get_current_admin)):
        check(page_id)
        doc = await db.page_content.find_one({'page_id':page_id}, {'_id':0})
        return {**design(page_id, doc), 'updated_at': (doc or {}).get('updated_at'), 'has_published_version': bool(approved(doc) or approved((doc or {}).get('published_snapshot')))}

    @router.put('/admin/pages/{page_id}')
    async def save_page(page_id: str, body: PageDesign, admin=Depends(get_current_admin)):
        check(page_id)
        if body.status in ('published', 'archived') and admin['role'] == 'editor':
            raise HTTPException(403, 'A publisher or owner must publish or unpublish a page.')
        if body.status == 'published' and not body.publication_reviewed:
            raise HTTPException(422, 'Review the content and publication permissions before publishing.')
        old = await db.page_content.find_one({'page_id':page_id}, {'_id':0})
        if old and old.get('updated_at') != body.updated_at:
            raise HTTPException(409, 'This page changed since you opened it. Reload before saving.')
        now = datetime.now(timezone.utc).isoformat()
        doc = next_document(page_id,body,old,now)
        if old:
            query = {'page_id':page_id, 'updated_at':old.get('updated_at')}
            result = await db.page_content.replace_one(query, doc)
            if not result.matched_count:
                raise HTTPException(409, 'This page was updated by another editor. Reload before saving.')
            await db.page_revisions.insert_one({'id':str(uuid4()),'page_id':page_id,'snapshot':old,'created_at':now,'email':admin['email']})
        else:
            from pymongo.errors import DuplicateKeyError
            try:
                await db.page_content.insert_one(doc)
            except DuplicateKeyError:
                raise HTTPException(409, 'Another editor created this page. Reload before saving.')
        await audit(admin['admin_id'],admin['email'],'update','page_content',page_id)
        return {'message':'Page published' if body.status == 'published' else 'Page unpublished' if body.status == 'archived' else 'Draft saved; the published version is unchanged', 'updated_at':now}

    @router.get('/admin/pages/{page_id}/revisions')
    async def revisions(page_id: str, admin=Depends(get_current_admin)):
        check(page_id)
        return await db.page_revisions.find({'page_id':page_id},{'_id':0,'snapshot':0}).sort('created_at',-1).to_list(30)

    @router.get('/admin/pages/{page_id}/revisions/{revision_id}')
    async def revision(page_id: str, revision_id: str, admin=Depends(get_current_admin)):
        check(page_id)
        item = await db.page_revisions.find_one({'id':revision_id,'page_id':page_id},{'_id':0})
        if not item:
            raise HTTPException(404,'Revision not found')
        return {**design(page_id,item['snapshot']),'status':'draft','publication_reviewed':False}
