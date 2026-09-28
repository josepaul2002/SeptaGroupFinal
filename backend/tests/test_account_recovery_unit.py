"""Recovery invariants using an in-memory atomic collection; no network required."""
import asyncio
from copy import deepcopy
from pathlib import Path
import sys
import time
import unittest
from types import SimpleNamespace
from urllib.parse import urlsplit, parse_qs
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.account_recovery import issue_reset, consume_reset, recovery_origin, validate_password, digest

class Accounts:
    def __init__(self):
        self.doc={'id':'owner','email':'owner@example.com','auth_version':3,'password_hash':'old','role':'owner'}
    def matches(self,query):
        def expr(v):
            if isinstance(v,dict) and '$ifNull' in v:
                first,default=v['$ifNull'];return self.doc.get(first[1:],default)
            return self.doc.get(v[1:]) if isinstance(v,str) and v.startswith('$') else v
        for k,v in query.items():
            if k=='$or':
                if not any(self.matches(q) for q in v):return False
            elif k=='$expr':
                a,b=v['$eq']
                if expr(a)!=expr(b):return False
            elif isinstance(v,dict):
                for op,value in v.items():
                    actual=self.doc.get(k)
                    if op=='$ne' and actual==value:return False
                    if op=='$exists' and (k in self.doc)!=value:return False
                    if op=='$gt' and (actual is None or actual<=value):return False
                    if op=='$lte' and (actual is None or actual>value):return False
            elif self.doc.get(k)!=v:return False
        return True
    async def find_one(self,query):return deepcopy(self.doc) if self.matches(query) else None
    async def update_one(self,query,changes):
        if not self.matches(query):return SimpleNamespace(modified_count=0)
        self.doc.update(changes.get('$set',{}))
        for k,v in changes.get('$inc',{}).items():self.doc[k]=self.doc.get(k,0)+v
        for k in changes.get('$unset',{}):self.doc.pop(k,None)
        return SimpleNamespace(modified_count=1)

class RecoveryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):self.db=Accounts();self.mail=[]
    async def send(self,email,url):self.mail.append((email,url));return True
    async def issue(self):
        await issue_reset(self.db,' OWNER@example.com ','https://septa.example',self.send)
        return parse_qs(urlsplit(self.mail[-1][1]).fragment)['token'][0]
    async def test_digest_only_single_use_and_session_revocation(self):
        token=await self.issue()
        self.assertNotIn(token,str(self.db.doc));self.assertEqual(self.db.doc['reset_hash'],digest(token))
        results=await asyncio.gather(*[consume_reset(self.db,token,'a-new-password-123',lambda _: 'new-hash') for _ in range(2)])
        self.assertEqual(sorted(results),[False,True]);self.assertEqual(self.db.doc['auth_version'],4)
        self.assertEqual(self.db.doc['role'],'owner');self.assertNotIn('reset_hash',self.db.doc)
    async def test_expired_link_does_not_change_password(self):
        token=await self.issue();self.db.doc['reset_expires']=time.time()-1
        self.assertFalse(await consume_reset(self.db,token,'a-new-password-123',lambda _: 'new'))
        self.assertEqual(self.db.doc['password_hash'],'old')
    async def test_disabled_account_cannot_issue_or_consume(self):
        token=await self.issue();self.db.doc['disabled']=True
        self.assertFalse(await consume_reset(self.db,token,'a-new-password-123',lambda _: 'new'))
        self.assertFalse(await issue_reset(self.db,'owner@example.com','https://septa.example',self.send))
    async def test_session_version_change_invalidates_pending_link(self):
        token=await self.issue();self.db.doc['auth_version']+=1
        self.assertFalse(await consume_reset(self.db,token,'a-new-password-123',lambda _: 'new'))
    async def test_account_cooldown_and_unknown_address(self):
        await self.issue();before=deepcopy(self.db.doc)
        self.assertFalse(await issue_reset(self.db,'owner@example.com','https://septa.example',self.send))
        self.assertFalse(await issue_reset(self.db,'unknown@example.com','https://septa.example',self.send))
        self.assertEqual(before,self.db.doc);self.assertEqual(len(self.mail),1)
    async def test_failed_delivery_clears_unusable_token_and_cooldown(self):
        async def failure(*args):return False
        self.assertFalse(await issue_reset(self.db,'owner@example.com','https://septa.example',failure))
        self.assertNotIn('reset_hash',self.db.doc);self.assertNotIn('reset_requested_at',self.db.doc)
    def test_origin_cannot_be_host_injected(self):
        for origin in ['http://example.com','https://user:secret@example.com','https://example.com/path','https://example.com?next=bad','//example.com']:
            self.assertIsNone(recovery_origin(origin))
        self.assertEqual(recovery_origin('http://localhost:8000'),'http://localhost:8000')
    def test_bcrypt_utf8_limit_is_checked(self):
        validate_password('x'*72)
        for password in ['short', 'x'*73, '🔒'*19]:
            with self.assertRaises(ValueError):validate_password(password)

if __name__=='__main__':unittest.main()
