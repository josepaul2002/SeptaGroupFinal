import json
import re
from urllib.parse import urlsplit, parse_qs
import pytest
from test_deployment_contract import db, client
from cms_oauth import challenge, resource

pytestmark = pytest.mark.asyncio

async def connect(client, scopes='cms:read cms:draft cms:media'):
    login = await client.post('/api/admin/login', json={'email':'owner@example.com','password':'local-test-password-123'})
    assert login.status_code == 200
    registration = await client.post('/api/integration/register',json={'redirect_uris':['https://client.example/callback'],'client_name':'Test assistant'})
    assert registration.status_code == 201
    verifier = 'a'*64
    params = {'client_id':registration.json()['client_id'],'redirect_uri':'https://client.example/callback','response_type':'code','code_challenge_method':'S256','code_challenge':challenge(verifier),'resource':resource(),'scope':scopes,'state':'test-state'}
    consent = await client.get('/api/integration/authorize',params=params)
    assert consent.status_code == 200
    ticket = re.search(r'name="ticket" value="([^"]+)"',consent.text)[1]
    response = await client.post('/api/integration/consent',data={'ticket':ticket,'decision':'allow','scope':scopes.split()},headers={'Origin':'http://testserver'})
    assert response.status_code == 303, response.text
    returned = parse_qs(urlsplit(response.headers['location']).query)
    assert returned['state'] == ['test-state']
    form = {'code':returned['code'][0],'client_id':params['client_id'],'redirect_uri':params['redirect_uri'],'resource':resource(),'grant_type':'authorization_code','code_verifier':verifier}
    wrong = await client.post('/api/integration/token',data={**form,'code_verifier':'b'*64})
    assert wrong.status_code == 400
    exchanged = await client.post('/api/integration/token',data=form)
    assert exchanged.status_code == 200, exchanged.text
    assert (await client.post('/api/integration/token',data=form)).status_code == 400
    return exchanged.json()['access_token']

async def rpc(client, token, name, args):
    return await client.post('/api/mcp',headers={'Authorization':'Bearer '+token},json={'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':name,'arguments':args}})

def value(response):
    assert response.status_code == 200, response.text
    result = response.json()['result']
    assert not result['isError'], result
    return json.loads(result['content'][0]['text'])

def project():
    return {'title':{'en':'Test building'},'location':'Kottayam','type':'Residential','project_status':'Completed','sqft':'','duration':'','year':'','client_type':'','client_lens':'','image':'','short_description':{'en':'Verified facts pending'},'challenge':{'en':''}}

async def test_oauth_scope_revocation_and_token_separation(client,db):
    assert (await client.post('/api/mcp',json={})).status_code == 400
    token = await connect(client, 'cms:read')
    assert (await rpc(client,token,'cms_stage',{'collection':'projects','record_id':'test','content':project()})).status_code == 403
    assert (await client.get('/api/admin/me',headers={'Authorization':'Bearer '+token})).status_code == 401
    grants = (await client.get('/api/admin/integrations')).json()
    assert len(grants) == 1
    revoke = await client.post('/api/admin/integrations/'+grants[0]['id']+'/revoke',headers={'Origin':'http://testserver'})
    assert revoke.status_code == 200
    assert (await rpc(client,token,'cms_list',{'collection':'projects'})).status_code == 401

async def test_stage_apply_stale_and_publish_protection(client,db):
    token = await connect(client)
    proposal = value(await rpc(client,token,'cms_stage',{'collection':'projects','record_id':'test-building','content':project()}))
    assert await db.projects.count_documents({}) == 0
    assert (await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id'],'publish':True})).status_code == 403
    created = value(await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id']}))
    assert created['slug'] == 'test-building'
    assert (await db.projects.find_one({'slug':'test-building'}))['status'] == 'draft'
    assert (await client.get('/api/projects')).json() == []
    again = await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id']})
    assert again.json()['result']['isError']
    proposal = value(await rpc(client,token,'cms_stage',{'collection':'projects','record_id':'test-building','content':project()}))
    await db.projects.update_one({'slug':'test-building'},{'$set':{'location':'Updated by human'}})
    stale = await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id']})
    assert stale.json()['result']['isError']
    assert (await db.projects.find_one({'slug':'test-building'}))['location'] == 'Updated by human'

async def test_existing_live_record_and_publication_validation(client,db):
    token = await connect(client,'cms:read cms:draft cms:publish')
    await db.projects.insert_one({**project(),'id':'live','slug':'live','status':'published','publication_reviewed':True})
    proposal = value(await rpc(client,token,'cms_stage',{'collection':'projects','record_id':'live','content':project()}))
    assert (await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id']})).json()['result']['isError']
    failed = await rpc(client,token,'cms_apply',{'proposal_id':proposal['proposal_id'],'publish':True})
    assert failed.json()['result']['isError'] # Missing verified construction scope, cover, etc.
    assert (await db.projects.find_one({'slug':'live'}))['status'] == 'published'

async def test_account_disable_origin_and_bad_upload(client,db):
    token = await connect(client)
    result = await rpc(client,token,'cms_upload',{'filename':'a.png','content_type':'image/png','data_base64':'invalid!'})
    assert result.json()['result']['isError']
    response = await client.post('/api/mcp',headers={'Authorization':'Bearer '+token,'Origin':'https://untrusted.example'},json={'jsonrpc':'2.0','id':1,'method':'ping'})
    assert response.status_code == 403
    await db.admins.update_one({'id':'owner-1'},{'$set':{'disabled':True}})
    assert (await rpc(client,token,'cms_list',{'collection':'projects'})).status_code == 401

async def test_google_start_moves_to_callback_origin(client, monkeypatch):
    import google_admin_auth as auth
    monkeypatch.setattr(auth,'ADMIN_AUTH_MODE','google')
    monkeypatch.setattr(auth,'SITE_URL','https://septa.one')
    response = await client.get('/api/admin/google/start',params={'next':'https://evil.example'})
    assert response.status_code == 302
    assert response.headers['location'] == 'https://septa.one/api/admin/google/start?next=%2Fadmin'
    assert not response.cookies

async def test_page_draft_preserves_live_snapshot(client,db):
    from copy import deepcopy
    from services.pages import DEFAULTS
    token = await connect(client, 'cms:read cms:draft cms:publish')
    page = deepcopy(DEFAULTS['about'])
    page['hero']['title']['en'] = 'Approved introduction'
    staged = value(await rpc(client,token,'cms_stage',{'collection':'pages','record_id':'about','content':page}))
    value(await rpc(client,token,'cms_apply',{'proposal_id':staged['proposal_id'],'publish':True}))
    page['hero']['title']['en'] = 'Private draft introduction'
    staged = value(await rpc(client,token,'cms_stage',{'collection':'pages','record_id':'about','content':page}))
    value(await rpc(client,token,'cms_apply',{'proposal_id':staged['proposal_id']}))
    assert (await client.get('/api/site-pages/about')).json()['hero']['title']['en'] == 'Approved introduction'
    assert (await db.page_content.find_one({'page_id':'about'}))['hero']['title']['en'] == 'Private draft introduction'

async def test_media_uses_existing_ratio_validation(client, db, monkeypatch):
    import base64
    from io import BytesIO
    from PIL import Image
    from unittest.mock import AsyncMock
    import server
    token = await connect(client)
    store = AsyncMock(return_value={'url':'/uploads/test.png','key':'test.png'})
    monkeypatch.setattr(server,'upload_file',store)
    def payload(size):
        stream=BytesIO()
        Image.new('RGB',size).save(stream,format='PNG')
        return {'filename':'test.png','content_type':'image/png','media_role':'project_cover','data_base64':base64.b64encode(stream.getvalue()).decode()}
    invalid = await rpc(client,token,'cms_upload',payload((900,900)))
    assert invalid.json()['result']['isError']
    assert '16:9' in invalid.text
    store.assert_not_awaited()
    assert value(await rpc(client,token,'cms_upload',payload((1600,900))))['key'] == 'test.png'
    store.assert_awaited_once()

async def test_consent_requires_origin_and_single_use_ticket(client,db):
    await client.post('/api/admin/login',json={'email':'owner@example.com','password':'local-test-password-123'})
    reg = await client.post('/api/integration/register',json={'redirect_uris':['https://client.example/callback']})
    params={'client_id':reg.json()['client_id'],'redirect_uri':'https://client.example/callback','response_type':'code','code_challenge_method':'S256','code_challenge':challenge('a'*64),'resource':resource(),'scope':'cms:read'}
    consent=await client.get('/api/integration/authorize',params=params)
    ticket=re.search(r'name="ticket" value="([^"]+)"',consent.text)[1]
    data={'ticket':ticket,'decision':'allow','scope':'cms:read'}
    assert (await client.post('/api/integration/consent',data=data)).status_code == 403
    assert (await client.post('/api/integration/consent',data=data,headers={'Origin':'http://testserver'})).status_code == 303
    assert (await client.post('/api/integration/consent',data=data,headers={'Origin':'http://testserver'})).status_code == 400
    params['redirect_uri']='https://unregistered.example/callback'
    assert (await client.get('/api/integration/authorize',params=params)).status_code == 400

async def test_protocol_handshake_and_account_version_change(client,db):
    token=await connect(client)
    headers={'Authorization':'Bearer '+token}
    init=await client.post('/api/mcp',headers=headers,json={'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'test','version':'1'}}})
    assert init.json()['result']['protocolVersion']=='2025-06-18'
    listed=await client.post('/api/mcp',headers=headers,json={'jsonrpc':'2.0','id':2,'method':'tools/list'})
    assert len(listed.json()['result']['tools'])==6
    assert (await client.post('/api/mcp',headers=headers,json={'jsonrpc':'2.0','method':'notifications/initialized'})).status_code==202
    assert (await client.get('/api/mcp',headers=headers)).status_code==405
    assert (await client.get('/api/mcp',headers={**headers,'Origin':'https://untrusted.example'})).status_code==403
    assert (await client.post('/api/mcp',headers={**headers,'MCP-Protocol-Version':'invalid'},json={})).status_code==400
    await db.admins.update_one({'id':'owner-1'},{'$inc':{'auth_version':1}})
    assert (await rpc(client,token,'cms_list',{'collection':'projects'})).status_code==401

async def test_official_mcp_client_handshake(client,db):
    # Optional interoperability check: pip install mcp in the test environment.
    pytest.importorskip('mcp')
    import httpx
    import server
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client
    token=await connect(client,'cms:read')
    def factory(**kwargs):
        return httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app),**kwargs)
    async with streamablehttp_client(resource(),headers={'Authorization':'Bearer '+token},httpx_client_factory=factory) as (read,write,_):
        async with ClientSession(read,write) as session:
            initialized=await session.initialize()
            assert initialized.serverInfo.name=='septa-cms'
            tools=await session.list_tools()
            assert {t.name for t in tools.tools}=={'cms_schema','cms_list','cms_get'}
            records=await session.call_tool('cms_list',{'collection':'projects'})
            assert not records.isError
            assert json.loads(records.content[0].text)['items']==[]


async def test_anonymous_discovery_signals_oauth_without_exposing_data(client,db):
    await db.projects.insert_one({'slug':'private-secret-project','status':'draft'})
    response=await client.post('/api/mcp',json={'jsonrpc':'2.0','id':1,'method':'tools/list'})
    assert response.status_code==200
    assert 'private-secret-project' not in response.text
    tools=response.json()['result']['tools']
    assert len(tools)==6
    assert all(t['securitySchemes'][0]['type']=='oauth2' for t in tools)
    assert all(t['_meta']['securitySchemes']==t['securitySchemes'] for t in tools)
    for name,args in [('cms_list',{'collection':'projects'}),('cms_stage',{'collection':'projects','record_id':'unauthorized','content':project()})]:
        result=(await client.post('/api/mcp',json={'jsonrpc':'2.0','id':2,'method':'tools/call','params':{'name':name,'arguments':args}})).json()['result']
        assert result['isError']
        assert 'invalid_token' in result['_meta']['mcp/www_authenticate'][0]
        assert 'private-secret-project' not in json.dumps(result)
    assert await db.cms_proposals.count_documents({})==0
    assert await db.projects.count_documents({})==1
