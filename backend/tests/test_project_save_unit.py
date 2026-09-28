"""Execute the real update handler with collection doubles (no FastAPI runtime)."""
import ast
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
import uuid
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from models.schemas import ProjectUpdate

class Collection:
    def __init__(self, doc=None):self.doc=deepcopy(doc);self.rows=[]
    async def find_one(self, query, projection=None):
        if self.doc is None:return None
        if projection and projection.get('id')==1:return {k:v for k,v in self.doc.items() if k=='id'}
        return deepcopy(self.doc)
    async def update_one(self,query,change):
        self.doc.update(change['$set']);return SimpleNamespace(matched_count=1)
    async def insert_one(self,doc):self.rows.append(deepcopy(doc))

class SaveTests(unittest.IsolatedAsyncioTestCase):
    async def test_legacy_project_without_id_saves_media_and_revision(self):
        existing={'slug':'legacy-house','title':{'en':'Legacy house'},'status':'draft','image':'old.jpg'}
        db=SimpleNamespace(projects=Collection(existing),revisions=Collection())
        audit=[]
        async def publication_check(*args):pass
        async def log_audit(*args):audit.append(args)
        tree=ast.parse((Path(__file__).resolve().parents[1]/'server.py').read_text())
        fn=next(n for n in tree.body if isinstance(n,ast.AsyncFunctionDef) and n.name=='update_project')
        fn.decorator_list=[];fn.returns=None;fn.args.defaults=[]
        for arg in fn.args.args:arg.annotation=None
        namespace={'db':db,'publication_check':publication_check,'log_audit':log_audit,'datetime':datetime,'timezone':timezone,'uuid':uuid}
        exec(compile(ast.Module(body=[fn],type_ignores=[]),'server.update_project','exec'),namespace)
        result=await namespace['update_project']('legacy-house',ProjectUpdate(image='/uploads/cover.jpg',media={'model_3d':'https://sketchfab.com/models/'+'a'*32}),{'admin_id':'owner','email':'owner@example.com'})
        self.assertEqual(result['message'],'Project updated')
        self.assertEqual(db.projects.doc['image'],'/uploads/cover.jpg')
        self.assertEqual(db.revisions.rows[0]['snapshot'],existing)
        self.assertEqual(audit[0][4],'legacy-house')

if __name__=='__main__':unittest.main()
