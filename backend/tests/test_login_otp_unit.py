import asyncio
from copy import deepcopy
import time
import unittest
from test_account_recovery_unit import Accounts
from services.login_otp import issue_code, consume_code
class OTPAccounts(Accounts):
    def matches(self,q):
        for k,v in q.items():
            if isinstance(v,dict) and '$lt' in v and self.doc.get(k,999)>=v['$lt']:return False
        return super().matches(q)
    async def find_one_and_update(self,q,changes):
        old=deepcopy(self.doc)
        return old if (await self.update_one(q,changes)).modified_count else None
class OTPTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):self.db=OTPAccounts();self.code='';self.secret='server-key'*8
    async def send(self,email,code):self.code=code;return True
    async def issue(self):return await issue_code(self.db,self.db.doc,self.secret,self.send)
    async def test_single_use_and_no_plain_code(self):
        ch=await self.issue();self.assertNotIn(self.code,str(self.db.doc))
        result=await asyncio.gather(*(consume_code(self.db,ch,self.code,self.secret) for _ in range(2)))
        self.assertEqual(sum(bool(r) for r in result),1)
    async def test_five_attempts_exhaust_code(self):
        ch=await self.issue();bad='111111' if self.code!='111111' else '222222'
        for _ in range(5):self.assertIsNone(await consume_code(self.db,ch,bad,self.secret))
        self.assertIsNone(await consume_code(self.db,ch,self.code,self.secret))
    async def test_expiry_revocation_disable(self):
        for mode in ['expiry','version','disabled']:
            self.db=OTPAccounts();ch=await self.issue()
            if mode=='expiry':self.db.doc['otp_expires']=time.time()-1
            elif mode=='version':self.db.doc['auth_version']+=1
            else:self.db.doc['disabled']=True
            self.assertIsNone(await consume_code(self.db,ch,self.code,self.secret))
    async def test_cooldown_failed_delivery(self):
        await self.issue();self.assertIsNone(await self.issue())
        self.db=OTPAccounts()
        async def fail(*args):return False
        with self.assertRaises(RuntimeError):await issue_code(self.db,self.db.doc,self.secret,fail)
        self.assertNotIn('otp_hash',self.db.doc)
