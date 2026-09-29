"""Public HTML and metadata use the same approved records as the API.
Serve the production frontend through this app, not an SPA-only static host.
"""
import json
import re
from html import escape
from urllib.parse import quote
from fastapi import HTTPException, Request
from fastapi.responses import HTMLResponse, Response, FileResponse
from services.content import PUBLIC_QUERY, PARTNER_PUBLIC_QUERY, public_document, text
from config import SITE_URL, INDEXABLE, BUILD_DIR
from services.pages import PAGE_PATHS, public_page as load_public_page, design_html
from search_pages import public_search_page, live_search_document, SEARCH_PUBLIC_QUERY
from maintenance import maintenance_for

STATIC = {'/': ('Septa Group', 'Construction delivery in Kerala.'), '/about': ('About Septa Group', 'The people and experience behind Septa Group.'), '/services': ('Construction Capabilities', 'Explore Septa’s construction capabilities and relevant project experience.'), '/projects': ('Projects', 'Explore documented projects delivered by Septa Group.'), '/ecosystem': ('People & Collaborators', 'Independent professionals behind projects delivered with Septa.'), '/project-leaders': ('Project Leaders', 'Meet the people responsible for construction delivery.'), '/contact': ('Discuss Your Project', 'Tell Septa about the project you are planning.'), '/privacy': ('Privacy', 'How Septa handles website enquiries.')}

def safe_json(value):
    return json.dumps(value, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')

def url(value):
    return escape(value, quote=True)

def media_url(value):
    if value and (value.startswith('https://') or (value.startswith('/') and not value.startswith('//'))):
        return SITE_URL + value if value.startswith('/') else value
    return ''


def text_section(label, value):
    """Render approved editorial fields into the initial public HTML."""
    content = text(value).strip()
    return f'<section><h2>{escape(label)}</h2><p>{escape(content)}</p></section>' if content else ''


def text_list(label, values):
    items = [text(value).strip() for value in (values or [])]
    items = [value for value in items if value]
    return ('<section><h2>' + escape(label) + '</h2><ul>' + ''.join('<li>' + escape(value) + '</li>' for value in items) + '</ul></section>') if items else ''


def editorial_html(collection, doc):
    """Use the public record and visibility flags; never surface draft media."""
    if collection == 'projects':
        result = ''.join(text_section(label, doc.get(field)) for label, field in [
            ('Project type', 'type'), ('Location', 'location'), ('Project status', 'project_status'),
            ('Year', 'year'), ('Septa’s scope', 'scope'), ('Challenge', 'challenge_detail'),
            ('Approach', 'approach_detail'), ('Outcome', 'outcome_detail'),
        ])
        visible = doc.get('tab_visibility') or {}
        if visible.get('story', True):
            result += text_list('The project story', (doc.get('story') or {}).get('paragraphs'))
        if visible.get('design', True):
            result += text_section('Design intent', (doc.get('design') or {}).get('intent'))
        if visible.get('delivery', True):
            result += text_list('Delivery highlights', (doc.get('delivery') or {}).get('highlights'))
        if doc.get('media_visible', True):
            images = (doc.get('media') or {}).get('images') or []
            result += text_list('Project photographs', [item.get('caption') or item.get('alt') for item in images if isinstance(item, dict) and item.get('approved')])
        return result
    if collection == 'leaders':
        return (text_section('About', doc.get('bio')) + text_list('Expertise', doc.get('expertise'))
                + text_list('Qualifications', doc.get('qualifications')))
    return (text_section('Professional role', doc.get('professional_role'))
            + text_section('Firm', doc.get('firm'))
            + text_section('About', doc.get('bio_long'))
            + text_section('Work with Septa', doc.get('septa_collaboration'))
            + text_list('Specialties', doc.get('specialties'))
            + text_list('Known for', doc.get('known_for')))


def entity_schema(doc, collection, path):
    entity = {
        '@type': 'Person' if collection == 'leaders' or doc.get('profile_type') == 'person' else 'Organization',
        '@id': SITE_URL + path + '#entity', 'name': text(doc.get('name')),
        'url': SITE_URL + path,
    }
    summary = text(doc.get('bio_short') or doc.get('bio_long') or doc.get('bio')).strip()
    if summary:
        entity['description'] = summary
    if collection == 'leaders':
        role = text(doc.get('title')).strip()
    else:
        role = text(doc.get('professional_role')).strip()
    if role and entity['@type'] == 'Person':
        entity['jobTitle'] = role
    if collection == 'partners':
        official = doc.get('website_url') or ''
        if official.startswith('https://'):
            entity['sameAs'] = [official]
    return entity

async def resolve(db, path):
    path = '/' + path.strip('/') if path.strip('/') else '/'
    maintenance = await maintenance_for(db, path)
    if maintenance:
        heading = maintenance.get('title') or 'We’re updating this page.'
        return {'heading':heading,'title':heading+' | Septa Group','description':maintenance.get('message',''),'canonical':SITE_URL+path,'image':'','robots':'index, follow','schema':None,'status':503,'body':'<p>'+escape(maintenance.get('message',''))+'</p><p><a href="/contact">Contact Septa</a></p>','data':{},'retry_after':str(maintenance.get('retry_after',3600))}
    settings = await db.site_settings.find_one({'id': 'site_settings'}, {'_id': 0}) or {}
    settings.setdefault('site_url', SITE_URL)
    settings.pop('lead_notification_email', None)
    settings.pop('admin_email', None)
    if isinstance(settings.get('enquiry'), dict):
        settings['enquiry'].pop('lead_notification_email', None)
    data = {'/settings': settings}
    title, description = STATIC.get(path, ('Page Not Found', 'This page is unavailable.'))
    status, body, image, noindex = (200 if path in STATIC else 404), '', '', False
    content_heading = None
    schema = {'@context': 'https://schema.org', '@type': 'WebPage', 'name': title, 'url': SITE_URL + path}
    pieces = path.strip('/').split('/')
    if len(pieces) == 2 and pieces[0] in ('services', 'locations'):
        kind = 'service' if pieces[0] == 'services' else 'location'
        landing = live_search_document(await db.search_pages.find_one({'kind': kind, 'slug': pieces[1]}, {'_id': 0}))
        if landing:
            status = 200
            content_heading = landing['title']
            title = landing['title']
            seo = landing.get('seo') or {}
            description = seo.get('description') or landing.get('introduction') or title
            title, image, noindex = seo.get('title') or title, seo.get('image') or '', seo.get('noindex', False)
            body = '<p>' + escape(landing.get('introduction') or '') + '</p>'
            if landing.get('image'):
                body += '<img src="' + url(landing['image']) + '" alt="' + url(landing.get('image_alt', '')) + '" loading="lazy">'
            headings = landing.get('paragraph_headings') or []
            for i, paragraph in enumerate(landing.get('paragraphs', [])):
                if paragraph.strip():
                    if i < len(headings) and headings[i]:
                        body += '<h2>' + escape(headings[i]) + '</h2>'
                    body += '<p>' + escape(paragraph.strip()) + '</p>'
            linked = await db.projects.find({'slug': {'$in': landing.get('project_slugs', [])}, **PUBLIC_QUERY}, {'_id': 0}).to_list(12)
            order = {slug: i for i, slug in enumerate(landing.get('project_slugs', []))}
            linked = sorted(linked, key=lambda item: order.get(item['slug'], 99))
            if linked:
                body += '<section><h2>Relevant work</h2>' + ''.join('<p><a href="/projects/' + url(project['slug']) + '">' + escape(text(project['title'])) + '</a> — ' + escape(project.get('location') or '') + '</p>' for project in linked) + '</section>'
            body += '<p><a href="/contact">Discuss a project with Septa</a></p>'
            data[f'/search-pages/{kind}/{pieces[1]}'] = {**public_search_page(landing), 'projects': [public_document(project) for project in linked]}
        else:
            status = 404
    elif len(pieces) == 2 and pieces[0] in ['projects', 'ecosystem', 'project-leaders']:
        collection, endpoint = {'projects': ('projects', 'projects'), 'ecosystem': ('partners', 'partners'), 'project-leaders': ('leaders', 'leaders')}[pieces[0]]
        visibility = PARTNER_PUBLIC_QUERY if collection == 'partners' else PUBLIC_QUERY
        doc = await db[collection].find_one({'slug': pieces[1], **visibility}, {'_id': 0})
        if doc:
            doc = public_document(doc)
            status = 200
            data[f'/{endpoint}/{pieces[1]}'] = doc
            title = text(doc.get('title') if collection == 'projects' else doc.get('name'))
            content_heading = title
            description = text(doc.get('short_description') or doc.get('bio_short') or doc.get('bio')) or title
            image = doc.get('image') or doc.get('photo') or (doc.get('media') or {}).get('hero_image') or (doc.get('media') or {}).get('card_image') or ''
            seo = doc.get('seo') or {}
            title, description, image, noindex = seo.get('title') or title, seo.get('description') or description, seo.get('image') or image, seo.get('noindex', False)
            body = f'<p>{escape(description)}</p>' + editorial_html(collection, doc)
            if collection == 'projects':
                credits = []
                mentions = []
                for credit in doc.get('credits', []):
                    if not credit.get('verified') or credit.get('entity_type') not in ('leader', 'partner') or not credit.get('entity_slug'):
                        continue
                    coll = 'leaders' if credit['entity_type'] == 'leader' else 'partners'
                    person = await db[coll].find_one({'slug': credit['entity_slug'], **(PARTNER_PUBLIC_QUERY if coll == 'partners' else PUBLIC_QUERY)})
                    if person:
                        href = ('/project-leaders/' if coll == 'leaders' else '/ecosystem/') + credit['entity_slug']
                        credits.append({**credit, 'name': person['name'], 'url': href})
                        body += f'<p>{escape(credit.get("role", "Contributor"))}: <a href="{url(href)}">{escape(text(person["name"]))}</a></p>'
                        mentions.append({'@id': SITE_URL + href + '#entity', '@type': 'Person' if coll == 'leaders' or person.get('profile_type') == 'person' else 'Organization', 'name': text(person['name']), 'url': SITE_URL + href})
                data[f'/projects/{pieces[1]}/credits'] = credits
                if mentions:
                    schema['mentions'] = mentions
                body += f'<p><a href="/contact?project={url(pieces[1])}">Discuss a project like this</a></p>'
            else:
                entity_type = 'leader' if collection == 'leaders' else 'partner'
                projects = await db.projects.find({**PUBLIC_QUERY, 'credits': {'$elemMatch': {'entity_type': entity_type, 'entity_slug': pieces[1], 'verified': True}}}, {'_id': 0}).to_list(500)
                data[f'/credits/{entity_type}/{pieces[1]}/projects'] = [public_document(p) for p in projects]
                body += '<h2>Projects with Septa</h2>' + ''.join(f'<p><a href="/projects/{url(p["slug"])}">{escape(text(p["title"]))}</a></p>' for p in projects)
                schema['mainEntity'] = entity_schema(doc, collection, path)
        else:
            status = 404
    elif path in ['/', '/projects', '/ecosystem', '/project-leaders']:
        coll, api = {'/': ('projects', 'projects'), '/projects': ('projects', 'projects'), '/ecosystem': ('partners', 'partners'), '/project-leaders': ('leaders', 'leaders')}[path]
        docs = await db[coll].find(PARTNER_PUBLIC_QUERY if coll == 'partners' else PUBLIC_QUERY, {'_id': 0}).to_list(500)
        data['/' + api] = [public_document(d) for d in docs]
        prefix = '/projects/' if coll == 'projects' else '/ecosystem/' if coll == 'partners' else '/project-leaders/'
        body = '<p>' + escape(description) + '</p>' + ''.join(f'<article><h2><a href="{prefix}{url(d["slug"])}">{escape(text(d.get("title") if coll == "projects" else d.get("name")))}</a></h2><p>{escape(text(d.get("short_description") or d.get("bio_short") or d.get("bio")))}</p></article>' for d in docs)
    elif path == '/services':
        pages = [live_search_document(doc) for doc in await db.search_pages.find(SEARCH_PUBLIC_QUERY, {'_id': 0}).sort('title', 1).to_list(200)]
        data['/search-pages'] = [public_search_page(page) for page in pages]
        linked_pages = [page for page in pages if not (page.get('seo') or {}).get('noindex')]
        body = '<section><h2>Explore our services and places</h2>' + ''.join('<p><a href="/' + ('services/' if page['kind'] == 'service' else 'locations/') + url(page['slug']) + '">' + escape(page['title']) + '</a></p>' for page in linked_pages) + '</section>' if linked_pages else ''
    elif path == '/about':
        body = ''
    elif path == '/privacy':
        body = '<p>Information submitted through an enquiry is used to respond and coordinate your request. Please avoid submitting sensitive documents through the public form. Contact Septa using the contact page to request access, correction or deletion of your enquiry. External links and messaging services operate under their own privacy policies.</p>'
    elif path == '/contact':
        contact = settings.get('contact') or {}
        body = '<p>Tell us about your project using the enquiry form or our business contact details.</p>'
        body += '<p>' + escape(contact.get('phone_display', '')) + '</p><p>' + escape(contact.get('email', '')) + '</p>'
    elif path.startswith('/admin') or path == '/content-checklist':
        title, status, noindex = 'Admin — Septa Group', 200, True
    heading = content_heading or title
    page_id = next((key for key,value in PAGE_PATHS.items() if value==path),None)
    if page_id:
        page = await load_public_page(db,page_id)
        data['/site-pages/'+page_id] = page
        heading = text(page['hero']['title'])
        seo = page.get('seo') or {}
        title = seo.get('title') or heading.replace('\n',' ')
        description = seo.get('description') or text(page['hero'].get('body'))
        image = seo.get('image') or page['hero'].get('image_url') or ''
        noindex = seo.get('noindex',False)
        page_body = await design_html(db,page,settings,before_cta=body if page_id=='services' else '')
        body = page_body + (body if page_id in ['projects','ecosystem','leaders','contact'] else '')
    schema.update(name=title, description=description)
    if path == '/':
        organization = {'@type': 'Organization', '@id': SITE_URL + '/#organization', 'name': 'Septa Group', 'url': SITE_URL, 'logo': SITE_URL + '/septa-logo.png'}
        contact = settings.get('contact') or {}
        phone = re.sub(r'[\s().-]', '', contact.get('phone_link') or contact.get('phone_display') or '')
        email = (contact.get('email') or '').strip()
        if re.fullmatch(r'\+?[1-9]\d{6,14}', phone):
            organization['telephone'] = phone
        if re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
            organization['email'] = email
        if (contact.get('office_address') or '').strip():
            organization['address'] = contact['office_address'].strip()
        schema['mainEntity'] = organization
    canonical = SITE_URL + path if SITE_URL and status == 200 else ''
    return {'heading':heading,'title': title + (' | Septa Group' if 'Septa Group' not in title else ''), 'description': description, 'image': media_url(image), 'canonical': canonical, 'robots': 'index, follow' if INDEXABLE and status == 200 and not noindex else 'noindex, nofollow', 'schema': schema if status == 200 else None, 'status': status, 'body': body, 'data': data}


def attach_public_site(app, db):
    @app.get('/api/seo')
    async def seo(path: str = '/'):
        result = await resolve(db, path.split('?')[0])
        return {k: v for k, v in result.items() if k not in ['body', 'data']}

    @app.get('/robots.txt')
    async def robots():
        return Response('User-agent: *\n' + ('Allow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: ' + SITE_URL + '/sitemap.xml\n' if INDEXABLE else 'Disallow: /\n'), media_type='text/plain')

    @app.get('/sitemap.xml')
    async def sitemap():
        entries = []
        if INDEXABLE:
            for p in STATIC:
                page_id = next((key for key,value in PAGE_PATHS.items() if value==p),None)
                if page_id and (await load_public_page(db,page_id)).get('seo',{}).get('noindex'):
                    continue
                entries.append((p,''))
            for coll, prefix in [('projects', '/projects/'), ('partners', '/ecosystem/'), ('leaders', '/project-leaders/')]:
                visibility = PARTNER_PUBLIC_QUERY if coll == 'partners' else PUBLIC_QUERY
                for doc in await db[coll].find({**visibility, 'seo.noindex': {'$ne': True}}, {'_id': 0}).to_list(10000):
                    entries.append((prefix + doc['slug'], doc.get('updated_at') or doc.get('created_at', '')))
            for record in await db.search_pages.find(SEARCH_PUBLIC_QUERY, {'_id': 0}).to_list(1000):
                doc = live_search_document(record)
                if doc and not (doc.get('seo') or {}).get('noindex'):
                    entries.append(('/' + ('services/' if doc['kind'] == 'service' else 'locations/') + doc['slug'], doc.get('updated_at', '')))
        xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        for path, modified in entries:
            xml += '<url><loc>' + escape(SITE_URL + path) + '</loc>' + ('<lastmod>' + escape(modified) + '</lastmod>' if modified else '') + '</url>'
        return Response(xml + '</urlset>', media_type='application/xml')

    @app.get('/{path:path}')
    async def public_page(path: str, request: Request):
        if path.rstrip('/') == 'collaborators' or path.startswith('collaborators/'):
            from fastapi.responses import RedirectResponse
            destination = '/ecosystem' + path[len('collaborators'):]
            if request.url.query:
                destination += '?' + request.url.query
            return RedirectResponse(destination, status_code=301)
        if path.rstrip('/') == 'solution-packs':
            from fastapi.responses import RedirectResponse
            return RedirectResponse('/services',status_code=301)
        if path.startswith(('api/', 'uploads/')):
            raise HTTPException(404)
        candidate = (BUILD_DIR / path).resolve()
        if path and candidate.is_relative_to(BUILD_DIR.resolve()) and candidate.is_file() and candidate.suffix in ['.js', '.css', '.png', '.jpg', '.svg', '.ico', '.woff', '.woff2', '.txt', '.json']:
            return FileResponse(candidate)
        if path.startswith('review/collaborator/'):
            # The token and draft never enter HTML, sitemap, metadata or search schema.
            result = {'title': 'Private collaborator review | Septa Group', 'heading': 'Private collaborator review',
                      'description': 'Review a collaborator profile before publication.', 'image': '',
                      'canonical': '', 'robots': 'noindex, nofollow, noarchive', 'schema': None,
                      'status': 200, 'body': '', 'data': {}}
        else:
            result = await resolve(db, '/' + path)
        if request.query_params.get('preview') == 'true':
            result['robots'] = 'noindex, nofollow'
        index = BUILD_DIR / 'index.html'
        if not index.exists():
            return HTMLResponse('Frontend build missing. Run npm run build.', status_code=503)
        html = index.read_text()
        html = re.sub(r'<title>.*?</title>', '', html, flags=re.S)
        html = re.sub(r'<meta\s+(?:name|property)=["\'](?:description|robots|og:[^"\']+|twitter:[^"\']+)["\'][^>]*>', '', html)
        head = '<title>' + escape(result['title']) + '</title>'
        for name, value in [('description', result['description']), ('robots', result['robots']), ('og:title', result['title']), ('og:description', result['description']), ('og:url', result['canonical']), ('og:image', result['image']), ('og:type', 'website'), ('twitter:card', 'summary_large_image')]:
            head += f'<meta {"property" if name.startswith("og:") else "name"}="{name}" content="{url(value)}">'
        if result['canonical']:
            head += '<link rel="canonical" href="' + url(result['canonical']) + '">'
        if result['schema']:
            head += '<script type="application/ld+json" id="septa-schema">' + safe_json(result['schema']) + '</script>'
        from urllib.parse import quote
        # Hydrate the availability gate as well as the page content. Do not briefly
        # replace readable server HTML with a loading screen on normal navigation.
        if not path.startswith('review/collaborator/'):
            is_preview = request.query_params.get('preview') == 'true'
            status_key = '/page-status?path=' + quote('/' + path, safe='') + ('&preview=true' if is_preview else '')
            result['data'][status_key] = {'maintenance':result['status']==503, 'preview_allowed':False, 'title':result['heading'], 'message':result['description']}
            head += '<script id="septa-bootstrap" type="application/json">' + safe_json(result['data']) + '</script>'
        html = html.replace('</head>', head + '</head>')
        content = '<div class="max-w-5xl mx-auto px-6 py-24"><nav><a href="/">Septa Group</a> · <a href="/projects">Projects</a> · <a href="/services">What we do</a> · <a href="/about">About</a> · <a href="/contact">Contact</a></nav><h1>' + escape(result['heading']) + '</h1>' + result['body'] + '</div>'
        html = html.replace('<div id="root"></div>', '<div id="root">' + content + '</div>')
        headers = {'Cache-Control':'no-store','X-Robots-Tag':result['robots']}
        if result.get('retry_after'):
            headers['Retry-After'] = result['retry_after']
        return HTMLResponse(html, status_code=result['status'], headers=headers)
