"""Single-use account recovery. Only SHA-256 digests are persisted."""
import hashlib
import secrets
import time
from urllib.parse import urlsplit

RESET_TTL = 20 * 60
RESET_COOLDOWN = 5 * 60
RESET_FIELDS = {'reset_hash': '', 'reset_expires': '', 'reset_auth_version': ''}
GENERIC_MESSAGE = 'If this email belongs to an active admin, a reset link will arrive shortly. Check your inbox and spam folder.'


def recovery_origin(site_url):
    url = urlsplit(site_url)
    local = url.hostname in ('localhost', '127.0.0.1')
    if (url.scheme != 'https' and not (local and url.scheme == 'http')) or not url.netloc or url.path or url.query or url.fragment or url.username or url.password:
        return None
    return site_url


def digest(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


def validate_password(password):
    if len(password) < 12 or len(password.encode('utf-8')) > 72:
        raise ValueError('Use at least 12 characters and no more than 72 UTF-8 bytes for your password.')


async def issue_reset(admins, email, origin, send_email):
    account = await admins.find_one({'email': email.strip().lower(), 'disabled': {'$ne': True}})
    if not account:
        return False
    now = time.time()
    version = account.get('auth_version', 0)
    token = secrets.token_urlsafe(32)
    result = await admins.update_one({
        'id': account['id'], 'disabled': {'$ne': True},
        '$expr': {'$eq': [{'$ifNull': ['$auth_version', 0]}, version]},
        '$or': [{'reset_requested_at': {'$lte': now - RESET_COOLDOWN}}, {'reset_requested_at': {'$exists': False}}]
    }, {'$set': {'reset_hash': digest(token), 'reset_expires': now + RESET_TTL,
                'reset_auth_version': version, 'reset_requested_at': now}})
    if not result.modified_count:
        return False
    # Fragment is not sent to the web server or included in access logs.
    sent = await send_email(account['email'], f'{origin}/admin/recover#token={token}')
    if not sent:
        await admins.update_one({'id': account['id'], 'reset_hash': digest(token)}, {'$unset': {**RESET_FIELDS, 'reset_requested_at': ''}})
    return sent


async def consume_reset(admins, token, password, hash_password):
    validate_password(password)
    if not 40 <= len(token) <= 128:
        return False
    result = await admins.update_one({
        'reset_hash': digest(token), 'reset_expires': {'$gt': time.time()},
        'disabled': {'$ne': True},
        '$expr': {'$eq': [{'$ifNull': ['$auth_version', 0]}, '$reset_auth_version']}
    }, {'$set': {'password_hash': hash_password(password)},
        '$inc': {'auth_version': 1}, '$unset': RESET_FIELDS})
    return bool(result.modified_count)
