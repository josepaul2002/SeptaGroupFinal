import asyncio
import logging
import os
from fastapi import BackgroundTasks, HTTPException, Request, Response
from pydantic import BaseModel, Field, EmailStr, field_validator
from config import SITE_URL, ADMIN_AUTH_MODE
from services.account_recovery import GENERIC_MESSAGE, issue_reset, consume_reset, recovery_origin, validate_password, digest
from services.email_service import send_password_reset, send_password_changed, _configure_resend
from utils.auth import get_password_hash, clear_auth_cookie

logger = logging.getLogger(__name__)

class ResetRequest(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    token: str = Field(min_length=40, max_length=128)
    password: str = Field(min_length=12, max_length=72)

    @field_validator('password')
    @classmethod
    def check_password(cls, value):
        validate_password(value)
        return value


def attach_recovery_routes(router, db, limiter):
    async def send_link(email, origin):
        try:
            await issue_reset(db.admins, email, origin, send_password_reset)
        except Exception as error:
            # Never log tokens, messages, URLs or provider response bodies.
            logger.error('Account recovery failed: %s', type(error).__name__)

    @router.post('/admin/forgot-password')
    @limiter.limit('5/minute')
    async def forgot_password(request: Request, data: ResetRequest, tasks: BackgroundTasks):
        if ADMIN_AUTH_MODE == 'google':
            raise HTTPException(403, 'Recover your account through Google Workspace.')
        origin = recovery_origin(SITE_URL)
        if not origin or not _configure_resend() or not os.getenv('FROM_EMAIL'):
            raise HTTPException(503, 'Email recovery is not configured yet. The site owner must set SITE_URL, RESEND_API_KEY and a verified FROM_EMAIL on the server. The local reset-admin.py helper is still available.')
        tasks.add_task(send_link, str(data.email).lower(), origin)
        return {'message': GENERIC_MESSAGE}

    @router.post('/admin/reset-password')
    @limiter.limit('5/minute')
    async def reset_password(request: Request, response: Response, data: ResetPassword, tasks: BackgroundTasks):
        if ADMIN_AUTH_MODE == 'google':
            raise HTTPException(403, 'Recover your account through Google Workspace.')
        # bcrypt is deliberately slow; avoid blocking concurrent website requests.
        password_hash = await asyncio.to_thread(get_password_hash, data.password)
        account = await db.admins.find_one({'reset_hash': digest(data.token)}, {'_id': 0, 'email': 1})
        changed = await consume_reset(db.admins, data.token, data.password, lambda _: password_hash)
        if not changed:
            raise HTTPException(400, 'This reset link has expired or has already been used. Request a new link.')
        if account:
            tasks.add_task(send_password_changed, account['email'])
        clear_auth_cookie(response)
        return {'message': 'Password updated. Sign in with your new password. All previous sessions have been signed out.'}
