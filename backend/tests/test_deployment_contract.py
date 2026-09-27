import asyncio, os, subprocess, sys
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
    assert (await client.get('/api/leaders')).status_code == 200
    assert (await client.get('/api/admin/readiness')).status_code == 401
    login=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    c=await client.get('/api/admin/readiness',headers={'Authorization':f"Bearer {login.json()['access_token']}"})
    assert c.status_code == 200 and 'content' in c.json()

def test_production_config_refuses_missing_secret():
    env=os.environ.copy(); env.update({'APP_ENV':'production','SITE_URL':'https://example.com','ALLOW_INDEXING':'true'}); env.pop('SECRET_KEY',None)
    result=subprocess.run([sys.executable,'-c','import sys;sys.path.insert(0,"backend");import config'],env=env,capture_output=True,text=True)
    assert result.returncode != 0 and 'SECRET_KEY' in (result.stderr+result.stdout)

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
async def test_page_content_is_private_until_reviewed(client, db):
    await db.page_content.insert_one({'page_id':'about','status':'draft','publication_reviewed':False,'blocks':[{'title':{'en':'Private'}}]})
    public=(await client.get('/api/pages/about')).json()
    assert public['blocks']==[]
    login=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    private=(await client.get('/api/pages/about',headers={'Authorization':f"Bearer {login.json()['access_token']}"})).json()
    assert private['blocks'][0]['title']['en']=='Private'
