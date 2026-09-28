#!/usr/bin/env python3
"""Safely reset a local Septa admin password using this installation's .env."""

from datetime import datetime, timezone
from getpass import getpass
import os
from pathlib import Path
from urllib.parse import urlsplit
import uuid

from dotenv import dotenv_values
from passlib.context import CryptContext
from pymongo import MongoClient


ROOT = Path(__file__).resolve().parent
config = {
    **dotenv_values(ROOT / ".env"),
    **dotenv_values(ROOT / "backend" / ".env"),
}
mongo_url = os.environ.get("MONGO_URL") or config.get("MONGO_URL")
db_name = os.environ.get("DB_NAME") or config.get("DB_NAME")
default_email = (os.environ.get("BOOTSTRAP_ADMIN_EMAIL")
                 or config.get("BOOTSTRAP_ADMIN_EMAIL") or "").strip().lower()

if not mongo_url or not db_name:
    raise SystemExit("MONGO_URL and DB_NAME must be set in the project .env file.")

host = urlsplit(mongo_url).hostname or "MongoDB"
print(f"Connected database target: {host} / {db_name}")
if input("Type the database name above to continue: ").strip() != db_name:
    raise SystemExit("Database confirmation did not match; no changes made.")

client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
try:
    db = client[db_name]
    db.command("ping")
except Exception as exc:
    raise SystemExit(f"Could not connect to the configured MongoDB: {exc}") from exc

admins = db.admins
existing = list(admins.find({}, {"_id": 0, "email": 1, "role": 1, "disabled": 1}))
if existing:
    print("Admin accounts in this database:")
    for account in existing:
        state = "disabled" if account.get("disabled") else "active"
        print(f"  {account.get('email', '(no email)')} — {account.get('role', 'owner')}, {state}")
else:
    print("No admin accounts exist in this database; this tool can create the first owner.")

email = input(f"Admin email to reset{f' [{default_email}]' if default_email else ''}: ").strip().lower()
email = email or default_email
if not email or "@" not in email:
    raise SystemExit("Enter a valid admin email; no changes made.")

account = admins.find_one({"email": email})
if existing and not account:
    raise SystemExit("That email is not in this database. Choose one of the listed accounts; no changes made.")
if account and account.get("disabled"):
    raise SystemExit("That admin account is disabled. No changes made; ask an active owner to re-enable it.")

password = getpass("New password (12–72 characters): ")
confirm = getpass("Confirm new password: ")
if password != confirm:
    raise SystemExit("Passwords did not match; no changes made.")
if not 12 <= len(password) <= 72:
    raise SystemExit("Password must be between 12 and 72 characters; no changes made.")

if input("Type RESET to apply this password change: ").strip() != "RESET":
    raise SystemExit("Cancelled; no changes made.")

password_hash = CryptContext(schemes=["bcrypt"], deprecated="auto").hash(password)
if account:
    admins.update_one(
        {"id": account["id"]},
        {"$set": {"password_hash": password_hash,
                   "auth_version": int(account.get("auth_version", 0)) + 1}},
    )
    print(f"Password reset for {email}. Existing role and site content were preserved.")
else:
    admins.insert_one({
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": password_hash,
        "role": "owner",
        "disabled": False,
        "auth_version": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None,
    })
    print(f"Created the first owner account: {email}.")

client.close()
