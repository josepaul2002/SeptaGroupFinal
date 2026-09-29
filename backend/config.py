"""Environment loaded before services; production refuses unsafe defaults."""
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit
from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parent
# Accept the documented repository-root .env as well as a backend-local file.
# The backend-local file wins when both are present for developer overrides.
for key, value in {**dotenv_values(ROOT.parent / '.env'), **dotenv_values(ROOT / '.env')}.items():
    if value is not None:
        os.environ.setdefault(key, value)
PRODUCTION = os.getenv('APP_ENV', 'development') == 'production'
SITE_URL = os.getenv('SITE_URL', '').rstrip('/')
INDEXABLE = PRODUCTION and os.getenv('ALLOW_INDEXING', 'false').lower() == 'true'
ADMIN_AUTH_MODE = os.getenv('ADMIN_AUTH_MODE', 'google' if PRODUCTION else 'password').strip().lower()
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', '').strip()
GOOGLE_WORKSPACE_DOMAIN = os.getenv('GOOGLE_WORKSPACE_DOMAIN', '').strip().lower().lstrip('@')
SECRET_KEY = os.getenv('SECRET_KEY', '')
if not SECRET_KEY or len(SECRET_KEY) < 32 or any(marker in SECRET_KEY.lower() for marker in ('change-in-production', 'generate-a-unique')):
    if PRODUCTION:
        raise RuntimeError('Set a unique SECRET_KEY of at least 32 characters before production startup.')
    SECRET_KEY = secrets.token_urlsafe(48)
CORS_ORIGINS = [s.strip().rstrip('/') for s in os.getenv('CORS_ORIGINS', SITE_URL or 'http://localhost:3000').split(',') if s.strip()]
if PRODUCTION:
    parsed = urlsplit(SITE_URL)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.path or parsed.query or parsed.fragment:
        raise RuntimeError('SITE_URL must be the confirmed HTTPS production origin.')
    if '*' in CORS_ORIGINS:
        raise RuntimeError('Production CORS_ORIGINS must contain explicit trusted origins.')
    if ADMIN_AUTH_MODE != 'google':
        raise RuntimeError('Production admin sign-in requires ADMIN_AUTH_MODE=google.')
if ADMIN_AUTH_MODE not in ('google', 'password'):
    raise RuntimeError('ADMIN_AUTH_MODE must be google or password.')
if ADMIN_AUTH_MODE == 'google' and not all((GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_WORKSPACE_DOMAIN)):
    raise RuntimeError('Google admin sign-in requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_WORKSPACE_DOMAIN.')
if ADMIN_AUTH_MODE == 'google':
    parsed = urlsplit(SITE_URL)
    if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.path or parsed.query or parsed.fragment:
        raise RuntimeError('Google admin sign-in requires SITE_URL to be the exact site origin.')


def project_path(value: str, default: Path) -> Path:
    path = Path(value) if value else default
    return path if path.is_absolute() else (ROOT.parent / path).resolve()

UPLOADS_DIR = project_path(os.getenv('LOCAL_UPLOAD_DIR', ''), ROOT / 'uploads')
BUILD_DIR = project_path(os.getenv('FRONTEND_BUILD_DIR', ''), ROOT.parent / 'frontend' / 'build')
