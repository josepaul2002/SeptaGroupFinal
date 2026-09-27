"""Environment loaded before services; production refuses unsafe defaults."""
import os
import secrets
from pathlib import Path
from urllib.parse import urlsplit
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
# Accept the documented repository-root .env as well as a backend-local file.
# The backend-local file wins when both are present for developer overrides.
load_dotenv(ROOT.parent / '.env')
load_dotenv(ROOT / '.env', override=True)
PRODUCTION = os.getenv('APP_ENV', 'development') == 'production'
SITE_URL = os.getenv('SITE_URL', '').rstrip('/')
INDEXABLE = PRODUCTION and os.getenv('ALLOW_INDEXING', 'false').lower() == 'true'
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


def project_path(value: str, default: Path) -> Path:
    path = Path(value) if value else default
    return path if path.is_absolute() else (ROOT.parent / path).resolve()

UPLOADS_DIR = project_path(os.getenv('LOCAL_UPLOAD_DIR', ''), ROOT / 'uploads')
BUILD_DIR = project_path(os.getenv('FRONTEND_BUILD_DIR', ''), ROOT.parent / 'frontend' / 'build')
