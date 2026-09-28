"""On a fresh local database only, offer to create the initial owner interactively."""
from datetime import datetime, timezone
from getpass import getpass
from pathlib import Path
import os
import sys
import uuid

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from config import PRODUCTION
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from email_validator import validate_email, EmailNotValidError
from utils.auth import get_password_hash


def main():
    if PRODUCTION:
        return
    client = MongoClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=4000)
    try:
        admins = client[os.environ['DB_NAME']].admins
        if admins.count_documents({}, limit=1):
            print('Existing admin account found in MongoDB. Sign in with your current credentials.')
            return
        if not sys.stdin.isatty():
            raise SystemExit('No admin account exists. Start this launcher in an interactive Terminal to create one.')
        print('No admin account was found in this database. Create the first owner account.')
        try:
            email = validate_email(input('Owner email: ').strip(), check_deliverability=False).normalized.lower()
        except EmailNotValidError as error:
            raise SystemExit(f'Invalid email: {error}')
        password = getpass('New password (12–72 UTF-8 bytes): ')
        if len(password) < 12 or len(password.encode('utf-8')) > 72:
            raise SystemExit('Password must contain at least 12 characters and no more than 72 UTF-8 bytes.')
        if getpass('Confirm password: ') != password:
            raise SystemExit('Passwords did not match. Nothing was changed.')
        admins.insert_one({
            'id': str(uuid.uuid4()), 'email': email, 'password_hash': get_password_hash(password),
            'role': 'owner', 'disabled': False, 'auth_version': 0,
            'created_at': datetime.now(timezone.utc).isoformat(), 'last_login': None,
        })
        print('Owner account created. Use this email and password at http://localhost:8000/admin')
    except PyMongoError as error:
        raise SystemExit(f'Cannot reach MongoDB at the configured address ({type(error).__name__}). Start MongoDB, then run this launcher again.')
    finally:
        client.close()


if __name__ == '__main__':
    main()
