import asyncio, json, os, re, subprocess, sys
from datetime import datetime, timezone
import httpx
import pytest
from models.schemas import LeadCreate, ProjectMedia
from services.content import public_document, publication_check, PUBLIC_QUERY
import server

@pytest.fixture
async def db():
    db = server.db
    for name in await db.list_collection_names():
        await db[name].delete_many({})
    await db.leads.create_index('submission_id', unique=True, sparse=True)
    await db.admins.insert_one({'id':'owner-1','email':'owner@example.com','password_hash':server.get_password_hash('local-test-password-123'),'role':'owner','auth_version':0,'disabled':False})
    return db

@pytest.fixture
async def client(db):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url='http://testserver') as c:
        yield c

@pytest.mark.asyncio
async def test_public_api_requires_review_and_strips_private_fields(client, db):
    base = {'id':'p1','slug':'reviewed-project','title':{'en':'Reviewed','ml':''},'location':'Kerala','scope':{'en':'Delivery','ml':''},'status':'published','publication_reviewed':True,'image':'','credits':[],'contact_email':'private@example.com','partner_stack':[{'partner_id':'x'}], 'media': {'images':[{'url':'/draft.jpg','approved':False},{'url':'/public.jpg','approved':True}]}}
    await db.projects.insert_many([base, {**base, 'id':'p2','slug':'pending-project','publication_reviewed':False}])
    response = await client.get('/api/projects')
    assert response.status_code == 200
    assert [p['slug'] for p in response.json()] == ['reviewed-project']
    public = response.json()[0]
    assert 'contact_email' not in public and 'partner_stack' not in public
    assert [m['url'] for m in public['media']['images']] == ['/public.jpg']


@pytest.mark.asyncio
async def test_older_published_collaborator_list_and_profile_stay_linked(client, db, monkeypatch, tmp_path):
    # Existing collaborators were published before publication_reviewed existed.
    legacy = {'id':'legacy-1','slug':'jacob-binoy','name':{'en':'Jacob Binoy'},
              'bio_short':{'en':'Architect in Kerala'},'status':'published',
              'publication_reviewed':False,'media':{'card_image':'/uploads/jacob.jpg'}}
    await db.partners.insert_many([legacy, {**legacy,'id':'draft-1','slug':'private-person','status':'draft'}])
    import public_site
    monkeypatch.setattr(public_site,'BUILD_DIR',tmp_path)
    (tmp_path/'index.html').write_text('<html><head><title>App</title></head><body><div id="root"></div></body></html>')
    listing = await client.get('/api/partners')
    assert [item['slug'] for item in listing.json()] == ['jacob-binoy']
    profile = await client.get('/ecosystem/jacob-binoy')
    assert profile.status_code == 200 and 'Jacob Binoy' in profile.text
    assert (await client.get('/api/partners/jacob-binoy')).status_code == 200
    assert (await client.get('/api/credits/partner/jacob-binoy/projects')).status_code == 200
    assert (await client.get('/ecosystem/private-person')).status_code == 404

@pytest.mark.asyncio
async def test_admin_login_cookie_and_duplicate_lead(client, db):
    login = await client.post('/api/admin/login', json={'email':'owner@example.com','password':'local-test-password-123'})
    assert login.status_code == 200
    assert 'septa_auth' in login.cookies
    payload={'name':'Jose Paul','phone':'+61400000000','email':'jose@example.com','message':'A project enquiry','submission_id':'submission-1234567890'}
    first=await client.post('/api/leads',json=payload); second=await client.post('/api/leads',json=payload)
    assert first.status_code == second.status_code == 201
    assert first.json()['id'] == second.json()['id']
    assert await db.leads.count_documents({}) == 1

@pytest.mark.asyncio
async def test_publication_check_requires_review_scope_and_published_credit(db):
    with pytest.raises(Exception):
        await publication_check(db, {'status':'published','title':{'en':'Project'},'location':'Kerala','scope':{'en':''},'credits':[]}, 'project', {'role':'owner'})
    with pytest.raises(Exception):
        await publication_check(db, {'status':'published','title':{'en':'Project'},'location':'Kerala','scope':{'en':'Delivery'},'credits':[]}, 'project', {'role':'owner'})

@pytest.mark.asyncio
async def test_leader_and_readiness_routes(client, db):
    await db.leaders.insert_one({'id':'l1','slug':'lead-one','name':{'en':'Lead One'},'title':{'en':'Director'},'bio':{'en':'Bio'},'status':'published','publication_reviewed':True})
    await db.projects.insert_one({'slug':'school-example','title':{'en':'School example'},'location':'Kottayam','scope':{'en':'Construction delivery'},'status':'published','publication_reviewed':True})
    await db.projects.insert_one({'slug':'private-school','title':{'en':'Private school'},'status':'draft','publication_reviewed':False})
    assert (await client.get('/api/leaders')).status_code == 200
    assert (await client.get('/api/admin/readiness')).status_code == 401
    login=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    c=await client.get('/api/admin/readiness',headers={'Authorization':f"Bearer {login.json()['access_token']}"})
    assert c.status_code == 200 and 'content' in c.json()
    assert [item['url'] for item in c.json()['search_content_actions']] == ['/projects/school-example']
    assert any('project story' in issue for issue in c.json()['search_content_actions'][0]['issues'])

def test_production_config_refuses_missing_secret():
    env=os.environ.copy(); env.update({'APP_ENV':'production','SITE_URL':'https://example.com','ALLOW_INDEXING':'true'}); env.pop('SECRET_KEY',None)
    result=subprocess.run([sys.executable,'-c','import sys;sys.path.insert(0,"backend");import config'],env=env,capture_output=True,text=True)
    assert result.returncode != 0 and 'SECRET_KEY' in (result.stderr+result.stdout)


def test_production_config_refuses_password_only_admin():
    env=os.environ.copy()
    env.update({'APP_ENV':'production','SITE_URL':'https://septa.example','SECRET_KEY':'safe-secret-key-for-tests-over-32-bytes','ADMIN_AUTH_MODE':'password'})
    result=subprocess.run([sys.executable,'-c','import sys;sys.path.insert(0,"backend");import config'],env=env,capture_output=True,text=True)
    assert result.returncode != 0 and 'ADMIN_AUTH_MODE=google' in (result.stderr+result.stdout)


@pytest.mark.asyncio
async def test_workspace_sign_in_requires_verified_allowlisted_account(client, db, monkeypatch):
    import google_admin_auth as workspace
    import release_api
    import utils.auth as auth_utils
    for module in (workspace, auth_utils, server, release_api):
        monkeypatch.setattr(module,'ADMIN_AUTH_MODE','google')
    monkeypatch.setattr(workspace,'GOOGLE_CLIENT_ID','client-id')
    monkeypatch.setattr(workspace,'GOOGLE_CLIENT_SECRET','client-secret')
    monkeypatch.setattr(workspace,'GOOGLE_WORKSPACE_DOMAIN','septa.example')
    monkeypatch.setattr(release_api,'GOOGLE_WORKSPACE_DOMAIN','septa.example')
    monkeypatch.setattr(workspace,'SITE_URL','http://testserver')
    await db.admins.update_one({'id':'owner-1'},{'$set':{'email':'owner@septa.example'}})
    import jwt
    start=await client.get('/api/admin/google/start')
    assert start.status_code==302 and start.headers['location'].startswith(workspace.AUTHORIZE_URL)
    state=jwt.decode(start.cookies[workspace.STATE_COOKIE],workspace.SECRET_KEY,algorithms=['HS256'])
    async def identity(code,verifier):
        return {'nonce':state['nonce'],'hd':'septa.example','email_verified':True,
                'email':'owner@septa.example' if code=='allow' else 'stranger@septa.example','sub':'google-person-123'}
    monkeypatch.setattr(workspace,'exchange_identity',identity)
    wrong=await client.get('/api/admin/google/callback',params={'code':'allow','state':'wrong-state'})
    assert wrong.status_code==401
    stranger=await client.get('/api/admin/google/callback',params={'code':'stranger','state':state['state']})
    assert stranger.status_code==401
    assert (await client.post('/api/admin/login',json={'email':'owner@septa.example','password':'local-test-password-123'})).status_code==403
    success=await client.get('/api/admin/google/callback',params={'code':'allow','state':state['state']})
    assert success.status_code==303 and success.headers['location']=='/admin'
    assert (await client.get('/api/admin/session')).json()['email']=='owner@septa.example'
    assert (await client.get('/api/admin/me')).status_code==200
    assert (await db.admins.find_one({'id':'owner-1'}))['google_sub']=='google-person-123'
    token=(await client.get('/api/admin/session')).json()['access_token']
    headers={'Authorization':'Bearer '+token}
    assert (await client.post('/api/admin/users',json={'email':'editor@septa.example','role':'editor'},headers=headers)).status_code==201
    assert (await client.post('/api/admin/users',json={'email':'outside@elsewhere.example','role':'editor'},headers=headers)).status_code==422

@pytest.mark.asyncio
async def test_public_settings_do_not_expose_recipient(client, db):
    await db.site_settings.insert_one({'id':'site_settings','enquiry':{'project_types':[],'lead_notification_email':'private@example.com'},'admin_email':'private@example.com'})
    data=(await client.get('/api/settings')).json()
    assert 'lead_notification_email' not in data.get('enquiry',{}) and 'admin_email' not in data

@pytest.mark.asyncio
async def test_sitemap_and_public_html_follow_approval(client, db, monkeypatch, tmp_path):
    await db.projects.insert_one({'id':'p1','slug':'approved','title':{'en':'Approved project'},'location':'Kerala','scope':{'en':'Delivery'},'short_description':{'en':'Documented work'},'status':'published','publication_reviewed':True,'credits':[]})
    await db.projects.insert_one({'id':'p2','slug':'unapproved','title':{'en':'Private project'},'location':'Kerala','scope':{'en':'Delivery'},'short_description':{'en':'Draft'},'status':'published','publication_reviewed':False,'credits':[]})
    import public_site
    monkeypatch.setattr(public_site, 'INDEXABLE', True)
    monkeypatch.setattr(public_site, 'SITE_URL', 'https://septa.example')
    monkeypatch.setattr(public_site, 'BUILD_DIR', tmp_path)
    (tmp_path/'index.html').write_text('<html><head><title>App</title></head><body><div id="root"></div></body></html>')
    sitemap=await client.get('/sitemap.xml')
    assert 'approved' in sitemap.text and 'unapproved' not in sitemap.text
    page=await client.get('/projects/approved')
    assert page.status_code == 200 and 'application/ld+json' in page.text and 'Approved project' in page.text
    hidden=await client.get('/projects/unapproved')
    assert hidden.status_code == 404


@pytest.mark.asyncio
async def test_search_pages_require_reviewed_project_evidence_and_remain_crawlable(client, db, monkeypatch, tmp_path):
    import public_site
    monkeypatch.setattr(public_site, 'INDEXABLE', True)
    monkeypatch.setattr(public_site, 'SITE_URL', 'https://septa.example')
    monkeypatch.setattr(public_site, 'BUILD_DIR', tmp_path)
    (tmp_path / 'index.html').write_text('<html><head><title>App</title></head><body><div id="root"></div></body></html>')
    await db.projects.insert_one({'slug':'school-example','title':{'en':'Example school'},'location':'Kottayam, Kerala','status':'published','publication_reviewed':True,'credits':[]})
    login = await client.post('/api/admin/login', json={'email':'owner@example.com','password':'local-test-password-123'})
    headers = {'Authorization': f"Bearer {login.json()['access_token']}"}
    page = {'kind':'location','slug':'example-town','title':'Construction in Example Town','location_name':'Example Town','introduction':'We describe confirmed delivery experience and clearly identify the approved projects that support the claims on this page.', 'paragraphs':['This example paragraph documents the scope of construction services and invites readers to inspect the linked published project.'], 'project_slugs':['school-example'], 'status':'draft'}
    assert (await client.post('/api/admin/search-pages', json=page, headers=headers)).status_code == 201
    assert (await client.get('/api/search-pages/location/example-town')).status_code == 404
    assert 'example-town' not in (await client.get('/sitemap.xml')).text
    invalid = await client.put('/api/admin/search-pages/location/example-town', json={**page,'status':'published','publication_reviewed':True}, headers=headers)
    assert invalid.status_code == 422 and 'does not confirm' in str(invalid.json())
    page.update(location_name='Kottayam', title='Construction in Kottayam', status='published', publication_reviewed=True)
    assert (await client.put('/api/admin/search-pages/location/example-town',json=page,headers=headers)).status_code == 200
    public = await client.get('/api/search-pages/location/example-town')
    assert public.status_code == 200 and public.json()['projects'][0]['slug'] == 'school-example'
    landing = await client.get('/locations/example-town')
    assert landing.status_code == 200
    assert 'Construction in Kottayam' in landing.text and 'href="/projects/school-example"' in landing.text
    assert 'https://septa.example/locations/example-town' in landing.text
    assert 'example-town' in (await client.get('/sitemap.xml')).text
    assert 'href="/locations/example-town"' in (await client.get('/services')).text
    assert (await client.get('/locations/not-real')).status_code == 404


@pytest.mark.asyncio
async def test_search_html_links_verified_project_and_person_without_leaking_hidden_content(client, db, monkeypatch, tmp_path):
    import public_site
    monkeypatch.setattr(public_site, 'SITE_URL', 'https://septa.example')
    monkeypatch.setattr(public_site, 'INDEXABLE', True)
    monkeypatch.setattr(server, 'INDEXABLE', True)
    monkeypatch.setattr(public_site, 'BUILD_DIR', tmp_path)
    (tmp_path / 'index.html').write_text('<html><head><title>App</title></head><body><div id="root"></div></body></html>')
    await db.site_settings.insert_one({'id':'site_settings','contact':{'phone_link':'+91 90000 00000','email':'hello@septa.example','office_address':'Kottayam, Kerala'}})
    await db.partners.insert_many([
        {'slug':'jacob-binoy','name':{'en':'Jacob Binoy'},'profile_type':'person','professional_role':{'en':'Architect'},'firm':'Spacecase Architects','bio_long':{'en':'Documented Kerala architecture work.'},'specialties':['Institutional design'],'website_url':'https://spacecase.example/jacob','seo':{'title':'Architect Jacob Binoy projects in Kerala'},'status':'published','publication_reviewed':True},
        {'slug':'spacecase-architects','name':{'en':'Spacecase Architects'},'profile_type':'company','status':'published','publication_reviewed':True},
        {'slug':'unapproved-partner','name':{'en':'Private Contributor'},'profile_type':'person','status':'draft','publication_reviewed':False},
    ])
    await db.projects.insert_one({'slug':'st-thomas','title':{'en':'St Thomas School'},'short_description':{'en':'Approved school project'},'location':'Kottayam','type':'Institutional','project_status':'Completed','year':'2024','scope':{'en':'Construction delivery'},'story':{'paragraphs':[{'en':'We delivered the <school> campus.'}]},'design':{'intent':{'en':'Secret design note'}},'tab_visibility':{'design':False},'delivery':{'highlights':[{'en':'Coordinated the approved build.'}]},'media':{'images':[{'url':'/approved.jpg','caption':{'en':'Completed school facade'},'approved':True},{'url':'/draft.jpg','caption':{'en':'Private image caption'},'approved':False}]},'credits':[{'entity_type':'partner','entity_slug':'jacob-binoy','role':'Architect','verified':True},{'entity_type':'partner','entity_slug':'spacecase-architects','role':'Architecture firm','verified':True},{'entity_type':'partner','entity_slug':'unapproved-partner','role':'Unreleased','verified':True}],'status':'published','publication_reviewed':True})
    profile=await client.get('/ecosystem/jacob-binoy')
    assert profile.status_code == 200
    assert '<h1>Jacob Binoy</h1>' in profile.text and '<title>Architect Jacob Binoy projects in Kerala | Septa Group</title>' in profile.text
    assert 'Documented Kerala architecture work.' in profile.text and 'Institutional design' in profile.text
    assert '/projects/st-thomas' in profile.text and '<h2>Firm</h2><p>Spacecase Architects</p>' in profile.text
    schema=json.loads(re.search(r'<script type="application/ld\+json" id="septa-schema">(.*?)</script>',profile.text).group(1))
    assert schema['mainEntity']['@type']=='Person' and schema['mainEntity']['jobTitle']=='Architect'
    assert schema['mainEntity']['sameAs']==['https://spacecase.example/jacob']
    company=json.loads(re.search(r'<script type="application/ld\+json" id="septa-schema">(.*?)</script>',(await client.get('/ecosystem/spacecase-architects')).text).group(1))
    assert company['mainEntity']['@type']=='Organization'
    project=await client.get('/projects/st-thomas')
    assert project.status_code == 200 and 'index, follow' in project.headers['x-robots-tag']
    assert 'We delivered the &lt;school&gt; campus.' in project.text and 'Coordinated the approved build.' in project.text
    assert 'Completed school facade' in project.text and 'Private image caption' not in project.text
    visible_html=re.sub(r'<script id="septa-bootstrap" type="application/json">.*?</script>', '', project.text)
    assert 'Secret design note' not in visible_html and 'Private Contributor' not in visible_html
    assert 'href="/ecosystem/jacob-binoy"' in project.text
    project_schema=json.loads(re.search(r'<script type="application/ld\+json" id="septa-schema">(.*?)</script>',project.text).group(1))
    assert {m['@type'] for m in project_schema['mentions']}=={'Person','Organization'}
    assert len(project_schema['mentions'])==2
    home_schema=json.loads(re.search(r'<script type="application/ld\+json" id="septa-schema">(.*?)</script>',(await client.get('/')).text).group(1))
    assert home_schema['mainEntity']['telephone']=='+919000000000'
    assert home_schema['mainEntity']['address']=='Kottayam, Kerala'

@pytest.mark.asyncio
async def test_page_content_is_private_until_reviewed(client, db):
    await db.page_content.insert_one({'page_id':'about','status':'draft','publication_reviewed':False,'blocks':[{'title':{'en':'Private'}}]})
    public=(await client.get('/api/pages/about')).json()
    assert public['blocks']==[]
    login=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    private=(await client.get('/api/pages/about',headers={'Authorization':f"Bearer {login.json()['access_token']}"})).json()
    assert private['blocks'][0]['title']['en']=='Private'

@pytest.mark.asyncio
async def test_studio_publishing_permissions_and_live_snapshot(client, db):
    from copy import deepcopy
    from services.pages import DEFAULTS
    page=deepcopy(DEFAULTS['about'])
    assert (await client.get('/api/admin/pages/about')).status_code==401
    login=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    owner={'Authorization':f"Bearer {login.json()['access_token']}"}
    page.update(status='published',publication_reviewed=True)
    page['hero']['title']['en']='Reviewed company introduction'
    first=await client.put('/api/admin/pages/about',json=page,headers=owner)
    assert first.status_code==200,first.text
    page['updated_at']=first.json()['updated_at']
    page['hero']['title']['en']='Unfinished private revision'
    page.update(status='draft',publication_reviewed=False)
    second=await client.put('/api/admin/pages/about',json=page,headers=owner)
    assert second.status_code==200,second.text
    assert (await client.get('/api/site-pages/about')).json()['hero']['title']['en']=='Reviewed company introduction'
    assert (await client.get('/api/seo?path=/about')).json()['title'].startswith('Reviewed company introduction')
    assert (await client.put('/api/admin/pages/about',json=page,headers=owner)).status_code==409
    history=(await client.get('/api/admin/pages/about/revisions',headers=owner)).json()
    assert len(history)==1
    restored=(await client.get('/api/admin/pages/about/revisions/'+history[0]['id'],headers=owner)).json()
    assert restored['status']=='draft' and restored['publication_reviewed'] is False
    await db.admins.insert_one({'id':'editor-1','email':'editor@example.com','password_hash':server.get_password_hash('local-editor-password-123'),'role':'editor','auth_version':0})
    editor_login=await client.post('/api/admin/login',json={'email':'editor@example.com','password':'local-editor-password-123'})
    editor={'Authorization':f"Bearer {editor_login.json()['access_token']}"}
    page.update(updated_at=second.json()['updated_at'],status='published',publication_reviewed=True)
    assert (await client.put('/api/admin/pages/about',json=page,headers=editor)).status_code==403
    page.update(status='review',publication_reviewed=False)
    assert (await client.put('/api/admin/pages/about',json=page,headers=editor)).status_code==200

@pytest.mark.asyncio
async def test_image_upload_enforces_destination_ratio_before_storage(client, db, monkeypatch):
    from io import BytesIO
    from PIL import Image
    from unittest.mock import AsyncMock
    login = await client.post('/api/admin/login', json={'email':'owner@example.com','password':'local-test-password-123'})
    headers = {'Authorization':f"Bearer {login.json()['access_token']}"}
    store = AsyncMock(return_value={'url':'/uploads/test.png','key':'test.png'})
    monkeypatch.setattr(server, 'upload_file', store)
    def data(size):
        stream=BytesIO();Image.new('RGB', size).save(stream, format='PNG');return stream.getvalue()
    invalid = await client.post('/api/upload', headers=headers, data={'media_role':'testimonial_cover'}, files={'file':('test.png',data((900,900)),'image/png')})
    assert invalid.status_code == 422
    assert '16:9' in invalid.json()['detail']
    store.assert_not_awaited()
    valid = await client.post('/api/upload', headers=headers, data={'media_role':'testimonial_cover'}, files={'file':('test.png',data((1600,900)),'image/png')})
    assert valid.status_code == 200
    store.assert_awaited_once()

@pytest.mark.asyncio
async def test_contact_destinations_save_reload_and_reject_bad_links(client, db):
    login = await client.post('/api/admin/login', json={'email':'owner@example.com','password':'local-test-password-123'})
    headers = {'Authorization':f"Bearer {login.json()['access_token']}"}
    contact = {'phone_link':'+91 90000 00000','whatsapp_number':'+919000000000','whatsapp_link':'https://wa.me/61412345678','whatsapp_mode':'number','email':'contact@example.com','contact_person':'Septa Team'}
    saved = await client.put('/api/settings',json={'contact':contact},headers=headers)
    assert saved.status_code == 200
    public = (await client.get('/api/settings')).json()['contact']
    assert public['whatsapp_link'] == '' and public['whatsapp_number'] == '+919000000000'
    assert public['email'] == 'contact@example.com' and public['contact_person'] == 'Septa Team'
    invalid = await client.put('/api/settings',json={'contact':{**contact,'whatsapp_mode':'link','whatsapp_link':'https://example.com/chat'}},headers=headers)
    assert invalid.status_code == 422
    assert (await client.get('/api/settings')).json()['contact'] == public
