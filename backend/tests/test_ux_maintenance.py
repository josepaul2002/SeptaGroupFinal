import pytest
import httpx
from io import BytesIO
from PIL import Image
import server
from services.pages import design


@pytest.fixture
async def db():
    for name in await server.db.list_collection_names():
        await server.db[name].delete_many({})
    await server.db.admins.insert_one({'id':'ux-owner','email':'owner@example.com','password_hash':server.get_password_hash('local-test-password-123'),'role':'owner','auth_version':0,'disabled':False})
    return server.db


@pytest.fixture
async def client(db):
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app),base_url='http://testserver') as client:
        yield client


async def login(client):
    response=await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    assert response.status_code==200
    return {'Authorization':'Bearer '+response.json()['access_token']}


def build(monkeypatch,tmp_path):
    import public_site
    monkeypatch.setattr(public_site,'BUILD_DIR',tmp_path)
    monkeypatch.setattr(public_site,'INDEXABLE',True)
    (tmp_path/'index.html').write_text('<html><head></head><body><div id="root"></div></body></html>')


@pytest.mark.asyncio
async def test_maintenance_exact_page_status_preview_and_reopen(client,db,monkeypatch,tmp_path):
    build(monkeypatch,tmp_path)
    assert (await client.put('/api/admin/maintenance',json={'path':'/about','enabled':True})).status_code==401
    headers=await login(client)
    response=await client.put('/api/admin/maintenance',json={'path':'/about','enabled':True,'title':'Updating our story','message':'Please return soon.','retry_after':600},headers=headers)
    assert response.status_code==200
    assert (await client.put('/api/admin/maintenance',json={'path':'/admin','enabled':True},headers=headers)).status_code==404
    page=await client.get('/about')
    assert page.status_code==503 and page.headers['retry-after']=='600'
    assert 'Updating our story' in page.text and 'application/ld+json' not in page.text
    assert (await client.get('/services')).status_code==200
    assert (await client.get('/api/admin/me',headers=headers)).status_code==200
    preview=await client.get('/api/page-status?path=/about&preview=true',headers=headers)
    assert preview.json()['preview_allowed'] is True
    client.cookies.clear()
    anonymous=await client.get('/api/page-status?path=/about&preview=true')
    assert anonymous.json()['maintenance'] is True and anonymous.json()['preview_allowed'] is False
    assert (await client.get('/api/page-status?path=/about/')).json()['maintenance'] is True
    assert '/about</loc>' in (await client.get('/sitemap.xml')).text
    assert (await client.put('/api/admin/maintenance',json={'path':'/about','enabled':False},headers=headers)).status_code==200
    assert (await client.get('/about')).status_code==200


@pytest.mark.asyncio
async def test_search_drafts_keep_live_snapshot_and_preview_requires_auth(client,db,monkeypatch,tmp_path):
    build(monkeypatch,tmp_path)
    headers=await login(client)
    await db.projects.insert_one({'slug':'school','title':{'en':'School'},'location':'Kottayam','status':'published','publication_reviewed':True,'credits':[]})
    payload={'kind':'service','slug':'school-delivery','title':'School construction delivery','introduction':'Documented construction delivery for an approved school project in Kottayam.','paragraphs':['This factual account is supported by the published school project linked below.'],'paragraph_headings':['Documented experience'],'project_slugs':['school'],'status':'published','publication_reviewed':True}
    assert (await client.post('/api/admin/search-pages',json=payload,headers=headers)).status_code==201
    record=(await client.get('/api/admin/search-pages',headers=headers)).json()[0]
    draft={**record,'title':'Private draft heading','status':'draft','publication_reviewed':False}
    assert (await client.put('/api/admin/search-pages/service/school-delivery',json=draft,headers=headers)).status_code==200
    public=await client.get('/api/search-pages/service/school-delivery')
    assert public.json()['title']==payload['title'] and 'published_snapshot' not in public.json()
    html=await client.get('/services/school-delivery')
    assert html.status_code==200 and 'Documented experience' in html.text and 'Private draft heading' not in html.text
    assert '/services/school-delivery</loc>' in (await client.get('/sitemap.xml')).text
    assert (await client.get('/api/search-pages/service/school-delivery?preview=true',headers=headers)).json()['title']=='Private draft heading'
    assert len((await client.get('/api/admin/search-pages/service/school-delivery/revisions',headers=headers)).json())==1
    assert (await client.put('/api/admin/search-pages/service/school-delivery',json=draft,headers=headers)).status_code==409
    client.cookies.clear()
    assert (await client.get('/api/search-pages/service/school-delivery?preview=true')).status_code==401
    current=(await client.get('/api/admin/search-pages',headers=headers)).json()[0]
    assert (await client.put('/api/admin/search-pages/service/school-delivery',json={**current,'status':'archived'},headers=headers)).status_code==200
    assert (await client.get('/api/search-pages/service/school-delivery')).status_code==404


@pytest.mark.asyncio
async def test_editor_cannot_change_availability_or_unpublish_search_page(client,db):
    headers=await login(client)
    await db.admins.update_one({'id':'ux-owner'},{'$set':{'role':'editor'}})
    assert (await client.put('/api/admin/maintenance',json={'path':'/about','enabled':True},headers=headers)).status_code==403
    assert (await client.post('/api/admin/search-pages',json={'kind':'service','slug':'example','title':'Example page','status':'archived'},headers=headers)).status_code==403


def test_about_removal_and_custom_copy_survive_read():
    page=design('about',{'version':2,'layout_revision':5,'hero':{'title':{'en':'Our own story'}},'sections':[]})
    assert page['sections']==[] and page['hero']['title']['en']=='Our own story'


@pytest.mark.asyncio
async def test_responsive_local_image_and_path_boundary(client,monkeypatch,tmp_path):
    import media_delivery
    monkeypatch.setattr(media_delivery,'UPLOADS_DIR',tmp_path)
    Image.new('RGB',(1920,1080),'#606060').save(tmp_path/'photo.png')
    response=await client.get('/api/media/image',params={'path':'/uploads/photo.png','width':480})
    assert response.status_code==200 and response.headers['content-type']=='image/webp'
    with Image.open(BytesIO(response.content)) as image:
        assert image.size==(480,270)
    assert (await client.get('/api/media/image',params={'path':'https://example.com/photo.png','width':480})).status_code==400
    assert (await client.get('/api/media/image',params={'path':'/uploads/../outside.png','width':480})).status_code==404
    assert (await client.get('/api/media/image',params={'path':'/uploads/photo.png','width':99999})).status_code==400
