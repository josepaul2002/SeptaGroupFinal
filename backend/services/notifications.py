"""Durable notification state on each lead, with recoverable leases and retries."""
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from services.email_service import send_admin_notification, send_user_confirmation

log = logging.getLogger(__name__)

async def deliver(db, lead_id):
    now = datetime.now(timezone.utc)
    lead = await db.leads.find_one_and_update(
        {'id': lead_id, 'notification_status': {'$in': ['pending', 'failed', 'sending']},
         '$or': [{'notification_lease_until': {'$exists': False}}, {'notification_lease_until': {'$lt': now.isoformat()}}]},
        {'$set': {'notification_status': 'sending', 'notification_lease_until': (now + timedelta(minutes=5)).isoformat()}, '$inc': {'notification_attempts': 1}})
    if not lead:
        return
    updates = {}
    try:
        if not lead.get('admin_notified'):
            result = await send_admin_notification(lead, max_retries=1)
            updates['admin_notified'] = bool(result.get('success'))
        if lead.get('email') and not lead.get('email_sent'):
            result = await send_user_confirmation(lead['email'], lead['name'], lead_id=lead_id, max_retries=1)
            updates['email_sent'] = bool(result.get('success'))
    except Exception:
        log.exception('Notification attempt failed for lead %s', lead_id)
    ok = updates.get('admin_notified', lead.get('admin_notified')) and (not lead.get('email') or updates.get('email_sent', lead.get('email_sent')))
    updates['notification_status'] = 'sent' if ok else 'failed'
    updates['notification_retry_at'] = (now + timedelta(minutes=5)).isoformat()
    await db.leads.update_one({'id': lead_id}, {'$set': updates, '$unset': {'notification_lease_until': ''}})

async def worker(db):
    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            cursor = db.leads.find({'notification_status': {'$in': ['pending', 'failed', 'sending']},
                'notification_attempts': {'$lt': 5},
                '$or': [{'notification_retry_at': {'$exists': False}}, {'notification_retry_at': {'$lte': now}}]})
            for lead in await cursor.to_list(20):
                await deliver(db, lead['id'])
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception('Notification worker failed; retrying')
        await asyncio.sleep(15)
