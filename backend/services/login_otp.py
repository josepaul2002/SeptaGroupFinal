"""Email login codes: keyed hashes, atomic attempt budget and one-time consumption."""
import hashlib
import hmac
import secrets
import time

TTL = 300

def code_digest(secret, challenge, code):
    return hmac.new(secret.encode(), f'{challenge}:{code}'.encode(), hashlib.sha256).hexdigest()

async def issue_code(admins, account, secret, send):
    now=time.time()
    challenge=secrets.token_urlsafe(32)
    code=f'{secrets.randbelow(1000000):06d}'
    result=await admins.update_one({'id':account['id'], 'disabled':{'$ne':True}, '$expr':{'$eq':[{'$ifNull':['$auth_version',0]},account.get('auth_version',0)]}, '$or':[{'otp_sent_at':{'$lte':now-60}},{'otp_sent_at':{'$exists':False}}]}, {'$set':{'otp_challenge':challenge,'otp_hash':code_digest(secret,challenge,code),'otp_expires':now+TTL,'otp_attempts':0,'otp_sent_at':now,'otp_version':account.get('auth_version',0)}})
    if not result.modified_count:
        return None
    if not await send(account['email'],code):
        await admins.update_one({'id':account['id'],'otp_challenge':challenge},{'$unset':{'otp_challenge':'','otp_hash':''}})
        raise RuntimeError('Email delivery unavailable')
    return challenge

async def consume_code(admins, challenge, code, secret):
    # Reserving each attempt atomically prevents parallel guesses from exceeding the limit.
    query={'otp_challenge':challenge,'otp_expires':{'$gt':time.time()},'otp_attempts':{'$lt':5},'disabled':{'$ne':True},'$expr':{'$eq':[{'$ifNull':['$auth_version',0]},'$otp_version']}}
    account=await admins.find_one_and_update(query,{'$inc':{'otp_attempts':1}})
    if not account or not hmac.compare_digest(account.get('otp_hash',''),code_digest(secret,challenge,code)):
        return None
    result=await admins.update_one({'id':account['id'],'otp_challenge':challenge,'otp_hash':account['otp_hash'],'disabled':{'$ne':True},'$expr':{'$eq':[{'$ifNull':['$auth_version',0]},account.get('auth_version',0)]}}, {'$unset':{'otp_challenge':'','otp_hash':'','otp_expires':'','otp_version':'','otp_attempts':''},'$set':{'email_verified_at':time.time()}})
    return account if result.modified_count else None
