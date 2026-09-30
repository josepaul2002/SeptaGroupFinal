"""Delegated CMS access: explicit consent, PKCE, audience-bound tokens and revocation."""
import base64
import hashlib
import html
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, urlsplit

import jwt
from fastapi import HTTPException, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from config import SITE_URL, SECRET_KEY
from utils.auth import get_current_admin

SCOPES = {'cms:read', 'cms:draft', 'cms:media', 'cms:publish'}

def now():
    return datetime.now(timezone.utc)

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def challenge(value):
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode()).digest()).rstrip(b'=').decode()

def resource():
    return SITE_URL + '/api/mcp'

async def limited_body(request):
    body=bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body)>16384:
            raise HTTPException(413,'Request too large')
    request._body=bytes(body)

def oauth_error(message):
    raise HTTPException(400, message)

async def integration_account(request, db):
    token = request.headers.get('authorization', '')
    try:
        if not token.startswith('Bearer '):
            raise ValueError()
        claims = jwt.decode(token[7:], SECRET_KEY, algorithms=['HS256'], audience=resource(), issuer=SITE_URL,
                            options={'require':['exp','sub','aud','iss','jti','type']})
        if claims['type'] != 'cms_integration':
            raise ValueError()
        grant = await db.cms_grants.find_one({'_id':claims['jti'], 'revoked':False, 'expires_at':{'$gt':now()}})
        if not grant:
            raise ValueError()
        account = await db.admins.find_one({'id':claims['sub'], 'disabled':{'$ne':True}})
        if (not account or grant['admin_id'] != account['id'] or
            account.get('auth_version',0) != grant['auth_version'] or
            account.get('google_sub') != grant.get('google_sub')):
            raise ValueError()
        return account, set(grant['scopes'])
    except (jwt.PyJWTError, ValueError, KeyError):
        raise HTTPException(401, 'Reconnect the Septa CMS integration.', headers={
            'WWW-Authenticate':f'Bearer resource_metadata="{SITE_URL}/.well-known/oauth-protected-resource/api/mcp"'})


def attach_cms_oauth(app, router, db, audit, limiter):
    @app.get('/.well-known/oauth-protected-resource/api/mcp')
    @app.get('/.well-known/oauth-protected-resource')
    async def protected_metadata():
        return {'resource':resource(), 'authorization_servers':[SITE_URL], 'scopes_supported':sorted(SCOPES),
                'bearer_methods_supported':['header']}

    @app.get('/.well-known/oauth-authorization-server')
    async def auth_metadata():
        return {'issuer':SITE_URL, 'authorization_endpoint':SITE_URL+'/api/integration/authorize',
                'token_endpoint':SITE_URL+'/api/integration/token', 'registration_endpoint':SITE_URL+'/api/integration/register',
                'response_types_supported':['code'], 'grant_types_supported':['authorization_code'],
                'code_challenge_methods_supported':['S256'], 'token_endpoint_auth_methods_supported':['none'],
                'scopes_supported':sorted(SCOPES)}

    @router.post('/integration/register', status_code=201)
    @limiter.limit('5/hour')
    async def register(request: Request):
        await limited_body(request)
        try:
            body = await request.json()
            redirects = body['redirect_uris']
            if not isinstance(redirects,list) or not 1 <= len(redirects) <= 5:
                raise ValueError()
            for value in redirects:
                parsed = urlsplit(value)
                if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password
                        or parsed.fragment or len(value)>2048):
                    raise ValueError()
            if body.get('token_endpoint_auth_method','none') != 'none':
                raise ValueError()
        except (ValueError, KeyError, TypeError, AttributeError):
            oauth_error('Provide exact HTTPS redirect_uris and public-client authentication (none).')
        client_id = secrets.token_urlsafe(24)
        doc = {'_id':client_id, 'redirect_uris':redirects, 'client_name':str(body.get('client_name','CMS client'))[:100]}
        await db.cms_clients.insert_one(doc)
        return JSONResponse({'client_id':client_id,'client_name':doc['client_name'],'redirect_uris':redirects,
                             'token_endpoint_auth_method':'none','grant_types':['authorization_code'],'response_types':['code']},
                            status_code=201,headers={'Cache-Control':'no-store'})

    @router.get('/integration/authorize')
    async def authorize(request: Request):
        q = dict(request.query_params)
        client = await db.cms_clients.find_one({'_id':q.get('client_id','')})
        scopes = set(q.get('scope','cms:read cms:draft cms:media').split())
        if (not client or q.get('redirect_uri') not in client['redirect_uris'] or q.get('response_type')!='code'
            or q.get('code_challenge_method')!='S256' or not re.fullmatch(r'[A-Za-z0-9_-]{43}',q.get('code_challenge',''))
            or q.get('resource')!=resource() or not scopes or not scopes <= SCOPES or len(q.get('state',''))>2048):
            oauth_error('Invalid authorization request')
        try:
            admin = await get_current_admin(request, None)
        except HTTPException:
            target = '/api/integration/authorize?' + urlencode(q)
            return RedirectResponse('/api/admin/google/start?'+urlencode({'next':target}),302)
        if admin['role'] not in ('owner','publisher','editor'):
            raise HTTPException(403,'CMS access denied')
        if admin['role']=='editor':
            scopes.discard('cms:publish')
        ticket = secrets.token_urlsafe(32)
        await db.cms_consents.insert_one({'_id':digest(ticket),'admin_id':admin['admin_id'],'query':q,
                                         'scopes':sorted(scopes),'expires_at':now()+timedelta(minutes=10)})
        checks = ''.join(f'<p><label><input type="checkbox" name="scope" value="{s}" {"" if s=="cms:publish" else "checked"}> {s}</label></p>' for s in sorted(scopes))
        body = f'''<!doctype html><html><head><title>Connect Septa CMS</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{{margin:0;padding:24px;background:#f4f3f0;color:#151515;font:16px/1.6 system-ui,sans-serif}}main{{max-width:620px;margin:5vh auto;background:white;padding:clamp(20px,5vw,40px);border:1px solid #ddd;overflow-wrap:anywhere}}h1{{font-size:28px;line-height:1.2}}label{{display:block;padding:10px;border:1px solid #ddd}}input{{margin-right:12px}}button{{padding:12px 18px;margin:8px 8px 0 0;cursor:pointer;font:inherit}}</style></head><body><main>
        <h1>Connect Septa CMS</h1><p>Signed in as {html.escape(admin['email'])}.</p>
        <p>Client: <strong>{html.escape(client['client_name'])}</strong></p>
        <p>Return address: {html.escape(q['redirect_uri'])}</p>
        <p>Read includes unpublished content. Draft access creates and edits unpublished entries. Media access uploads public assets.
        Publish access can change live content. No access to enquiries, passwords or account management is granted.</p>
        <p>This connection expires after eight hours and can be revoked in Admin → Account.</p>
        <form method="post" action="/api/integration/consent"><input type="hidden" name="ticket" value="{ticket}">{checks}
        <button name="decision" value="allow">Connect selected permissions</button> <button name="decision" value="deny">Cancel</button></form>
        </main></body></html>'''
        return HTMLResponse(body,headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex'})

    @router.post('/integration/consent')
    async def consent(request: Request, admin=Depends(get_current_admin)):
        await limited_body(request)
        form = await request.form()
        record = await db.cms_consents.find_one_and_delete({'_id':digest(str(form.get('ticket',''))),
                    'admin_id':admin['admin_id'],'expires_at':{'$gt':now()}})
        if not record:
            oauth_error('Consent expired. Start the connection again.')
        q = record['query']
        result = {'state':q.get('state','')}
        scopes = set(form.getlist('scope'))
        if form.get('decision')!='allow' or not scopes:
            result['error']='access_denied'
        else:
            if not scopes <= set(record['scopes']) or ('cms:publish' in scopes and admin['role']=='editor'):
                raise HTTPException(403,'Permission denied')
            account = await db.admins.find_one({'id':admin['admin_id']})
            code = secrets.token_urlsafe(32)
            await db.cms_codes.insert_one({'_id':digest(code), 'query':q, 'admin_id':admin['admin_id'],
                'auth_version':account.get('auth_version',0), 'google_sub':account.get('google_sub'),
                'scopes':sorted(scopes),'expires_at':now()+timedelta(minutes=2)})
            result['code']=code
        return RedirectResponse(q['redirect_uri']+('&' if '?' in q['redirect_uri'] else '?')+urlencode(result),303,
                                headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer'})

    @router.post('/integration/token')
    @limiter.limit('20/minute')
    async def token(request: Request):
        await limited_body(request)
        f = await request.form()
        record = await db.cms_codes.find_one({'_id':digest(str(f.get('code',''))),'expires_at':{'$gt':now()}})
        verifier = str(f.get('code_verifier',''))
        if (not record or f.get('grant_type')!='authorization_code' or f.get('resource')!=resource()
            or not re.fullmatch(r'[A-Za-z0-9._~-]{43,128}',verifier)
            or f.get('client_id')!=record['query']['client_id'] or f.get('redirect_uri')!=record['query']['redirect_uri']
            or challenge(verifier)!=record['query']['code_challenge']):
            return JSONResponse({'error':'invalid_grant'},400,headers={'Cache-Control':'no-store'})
        consumed = await db.cms_codes.find_one_and_delete({'_id':record['_id'],'expires_at':{'$gt':now()}})
        if not consumed:
            return JSONResponse({'error':'invalid_grant'},400)
        account=await db.admins.find_one({'id':record['admin_id'],'disabled':{'$ne':True}})
        if (not account or account.get('auth_version',0)!=record['auth_version']
                or account.get('google_sub')!=record.get('google_sub')):
            return JSONResponse({'error':'invalid_grant'},400,headers={'Cache-Control':'no-store'})
        grant_id = secrets.token_urlsafe(24)
        expiry = now()+timedelta(hours=8)
        await db.cms_grants.insert_one({'_id':grant_id, 'admin_id':record['admin_id'],'client_id':f['client_id'],
            'scopes':record['scopes'],'auth_version':record['auth_version'],'google_sub':record.get('google_sub'),
            'revoked':False,'created_at':now(),'expires_at':expiry})
        encoded = jwt.encode({'iss':SITE_URL,'aud':resource(),'sub':record['admin_id'],'jti':grant_id,
                              'type':'cms_integration','exp':expiry},SECRET_KEY,algorithm='HS256')
        await audit(record['admin_id'],'','integration_connected','integration',grant_id,{'scopes':record['scopes']})
        return JSONResponse({'access_token':encoded,'token_type':'Bearer','expires_in':28800,'scope':' '.join(record['scopes'])},
                            headers={'Cache-Control':'no-store','Pragma':'no-cache'})

    @router.get('/admin/integrations')
    async def grants(admin=Depends(get_current_admin)):
        docs = await db.cms_grants.find({'admin_id':admin['admin_id'],'revoked':False,'expires_at':{'$gt':now()}}).to_list(100)
        return [{'id':d['_id'],'scopes':d['scopes'],'expires_at':d['expires_at']} for d in docs]

    @router.post('/admin/integrations/{grant_id}/revoke')
    async def revoke(grant_id: str, admin=Depends(get_current_admin)):
        await db.cms_grants.update_one({'_id':grant_id,'admin_id':admin['admin_id']},{'$set':{'revoked':True}})
        await audit(admin['admin_id'],admin['email'],'integration_revoked','integration',grant_id)
        return {'revoked':True}
