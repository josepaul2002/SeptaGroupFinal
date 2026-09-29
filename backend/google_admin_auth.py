"""Google Workspace OpenID Connect for the existing, allowlisted admin accounts."""
import asyncio
import base64
import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timezone
from urllib.parse import urlencode

import httpx
from fastapi import Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
import jwt
from jwt import PyJWTError as JWTError
from google.auth.exceptions import GoogleAuthError
from requests.exceptions import RequestException

from config import (ADMIN_AUTH_MODE, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
                    GOOGLE_WORKSPACE_DOMAIN, PRODUCTION, SECRET_KEY, SITE_URL)
from utils.auth import create_access_token, decode_token, get_current_admin, set_auth_cookie

logger = logging.getLogger(__name__)
STATE_COOKIE = 'septa_google_state'
AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
TOKEN_URL = 'https://oauth2.googleapis.com/token'


def verify_google_identity(id_token_value):
    # Google's maintained library verifies the signature, issuer, audience,
    # expiration and issued-at time against Google's rotating public keys.
    from google.auth.transport.requests import Request as GoogleRequest
    from google.oauth2 import id_token
    return id_token.verify_oauth2_token(id_token_value, GoogleRequest(), GOOGLE_CLIENT_ID)


def make_auth_request():
    state, nonce, verifier = (secrets.token_urlsafe(32) for _ in range(3))
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    cookie = jwt.encode({'type':'google_state','state':state,'nonce':nonce,'verifier':verifier,
                         'exp':int(datetime.now(timezone.utc).timestamp())+600}, SECRET_KEY, algorithm='HS256')
    redirect_uri = SITE_URL + '/api/admin/google/callback'
    params = {'client_id':GOOGLE_CLIENT_ID,'redirect_uri':redirect_uri,'response_type':'code',
              'scope':'openid email','state':state,'nonce':nonce,'hd':GOOGLE_WORKSPACE_DOMAIN,
              'code_challenge':challenge,'code_challenge_method':'S256','prompt':'select_account'}
    return AUTHORIZE_URL + '?' + urlencode(params), cookie


async def exchange_identity(code, verifier):
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(TOKEN_URL, data={'code':code,'client_id':GOOGLE_CLIENT_ID,
            'client_secret':GOOGLE_CLIENT_SECRET,'redirect_uri':SITE_URL+'/api/admin/google/callback',
            'grant_type':'authorization_code','code_verifier':verifier})
        response.raise_for_status()
        identity_token = response.json()['id_token']
    return await asyncio.to_thread(verify_google_identity, identity_token)


def attach_google_routes(router, db, audit, limiter):
    @router.get('/admin/auth/config')
    async def auth_config():
        return {'mode': ADMIN_AUTH_MODE}

    @router.get('/admin/google/start')
    @limiter.limit('10/minute')
    async def google_start(request: Request):
        if ADMIN_AUTH_MODE != 'google':
            raise HTTPException(404, 'Google sign-in is not enabled.')
        url, cookie = make_auth_request()
        response = RedirectResponse(url, status_code=302)
        response.set_cookie(STATE_COOKIE, cookie, max_age=600, httponly=True,
                            secure=PRODUCTION, samesite='lax', path='/api/admin/google')
        return response

    @router.get('/admin/google/callback')
    @limiter.limit('10/minute')
    async def google_callback(request: Request, code: str = '', state: str = '', error: str = ''):
        if ADMIN_AUTH_MODE != 'google' or error or not code or not state:
            raise HTTPException(401, 'Google sign-in was not completed.')
        try:
            saved = jwt.decode(request.cookies.get(STATE_COOKIE, ''), SECRET_KEY, algorithms=['HS256'])
            if saved.get('type') != 'google_state' or not hmac.compare_digest(saved['state'], state):
                raise ValueError('state mismatch')
            identity = await exchange_identity(code, saved['verifier'])
            if (not hmac.compare_digest(str(identity.get('nonce', '')), saved['nonce'])
                    or identity.get('hd', '').lower() != GOOGLE_WORKSPACE_DOMAIN
                    or identity.get('email_verified') is not True):
                raise ValueError('identity mismatch')
            email = identity['email'].strip().lower()
            subject = identity['sub']
            if not subject or not email.endswith('@' + GOOGLE_WORKSPACE_DOMAIN):
                raise ValueError('invalid Workspace identity')
            account = await db.admins.find_one({'email':email,'disabled':{'$ne':True}}, {'_id':0})
            if not account or (account.get('google_sub') and account['google_sub'] != subject):
                raise ValueError('not allowlisted or subject mismatch')
            if not account.get('google_sub'):
                await db.admins.update_one({'id':account['id'],'google_sub':None},
                                           {'$set':{'google_sub':subject}})
                stored = await db.admins.find_one({'id':account['id']}, {'_id':0})
                if stored.get('google_sub') != subject:
                    raise ValueError('subject changed')
            token = create_access_token({'sub':account['id'],'email':email,
                'auth_version':account.get('auth_version',0),'auth_method':'google','google_sub':subject})
        except (JWTError, KeyError, ValueError, httpx.HTTPError, GoogleAuthError, RequestException, TypeError) as exc:
            logger.warning('Google admin sign-in rejected: %s', type(exc).__name__)
            raise HTTPException(401, 'Google sign-in could not be verified or this account is not authorized.')
        response = RedirectResponse('/admin', status_code=303)
        response.delete_cookie(STATE_COOKIE, path='/api/admin/google')
        set_auth_cookie(response, token)
        await db.admins.update_one({'id':account['id']}, {'$set':{'last_login':datetime.now(timezone.utc).isoformat()}})
        await audit(account['id'], email, 'login', 'admin', account['id'], {'method':'google'})
        return response

    @router.get('/admin/session')
    async def admin_session(request: Request, admin: dict = Depends(get_current_admin)):
        if ADMIN_AUTH_MODE != 'google':
            raise HTTPException(404, 'Workspace session unavailable.')
        # The HttpOnly cookie never enters a redirect URL. The existing CMS API
        # temporarily consumes this short-lived token from sessionStorage.
        cookie = request.cookies.get('septa_auth', '')
        payload = decode_token(cookie) if cookie else None
        if not payload or payload.get('sub') != admin['admin_id'] or payload.get('auth_method') != 'google':
            raise HTTPException(401, 'Workspace session is unavailable.')
        return {'access_token':cookie, 'admin_id':admin['admin_id'],
                'email':admin['email'],'role':admin['role']}
