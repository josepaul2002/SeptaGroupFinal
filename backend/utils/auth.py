"""
Authentication utilities for Admin panel
JWT tokens with secure cookie storage
"""
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Request, Response, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "septa-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer(auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.warning(f"Token decode error: {str(e)}")
        return None


def set_auth_cookie(response: Response, token: str, name: str = "septa_auth"):
    """Set secure HttpOnly cookie with auth token"""
    response.set_cookie(
        key=name,
        value=token,
        httponly=True,
        secure=True,  # HTTPS only
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/api"
    )


def clear_auth_cookie(response: Response, name: str = "septa_auth"):
    """Clear auth cookie"""
    response.delete_cookie(key=name, path="/api")


async def get_current_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Get current admin from token
    Checks both Authorization header and cookie
    """
    token = None
    
    # Try Authorization header first
    if credentials:
        token = credentials.credentials
    
    # Fallback to cookie
    if not token:
        token = request.cookies.get("septa_auth")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    admin_id = payload.get("sub")
    email = payload.get("email")
    
    if not admin_id or not email:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return {"admin_id": admin_id, "email": email}


async def get_optional_admin(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current admin if authenticated, None otherwise
    Used for preview mode
    """
    try:
        return await get_current_admin(request, credentials)
    except HTTPException:
        return None
