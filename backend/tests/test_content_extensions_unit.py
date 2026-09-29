import ast
from pathlib import Path
from types import SimpleNamespace
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from models.schemas import TestimonialCreate, ProjectCredit, PartnerMedia
from services.enquiry_questions import validate_questions
class ContentTests(unittest.TestCase):
    def test_media_and_identity_survive_schema(self):
        quote=TestimonialCreate(client_name='Client',client_role='Owner',content={'en':'Approved words'},profile_image='/uploads/a.jpg',cover_image='/uploads/b.jpg',project_ref='school',completed_project=True)
        self.assertEqual(quote.model_dump()['cover_image'],'/uploads/b.jpg')
        self.assertEqual(quote.project_type,'')
        credit=ProjectCredit(entity_type='partner',entity_slug='studio',role='Architect',display_as='company',affiliation_at_time='Studio',affiliation_url='https://studio.example')
        self.assertEqual(credit.model_dump()['display_as'],'company')
        self.assertEqual(PartnerMedia(videos=['/uploads/film.mp4']).videos,['/uploads/film.mp4'])
        self.assertEqual(PartnerMedia(video_titles=['Site visit']).video_titles,['Site visit'])
        with self.assertRaises(Exception): PartnerMedia(video_titles=['This caption is intentionally far too long'])
    def test_invalid_questions_rejected(self):
        q={'id':'q','label':'Site ready?','type':'select','options':['Yes','No'],'required':True}
        self.assertEqual(validate_questions([q]),[q])
        for bad in [[q,q],[{**q,'label':''}],[{**q,'options':[]}],[{**q,'type':'html'}]]:
            with self.assertRaises(ValueError):validate_questions(bad)
class PublicationTests(unittest.IsolatedAsyncioTestCase):
    async def test_credit_checks_distinguish_profile_and_project_verification(self):
        class Error(Exception):
            def __init__(self,status,detail):self.detail=detail
        class Collection:
            async def find_one(self,q):return None
        async_fn=next(n for n in ast.parse((Path(__file__).resolve().parents[1]/'services/content.py').read_text()).body if isinstance(n,ast.AsyncFunctionDef) and n.name=='publication_check')
        namespace={'HTTPException':Error,'PUBLIC_QUERY':{'status':'published','publication_reviewed':True},'PARTNER_PUBLIC_QUERY':{'status':'published'},'text':lambda v:v.get('en','') if isinstance(v,dict) else str(v or '')}
        exec(compile(ast.Module(body=[async_fn],type_ignores=[]),'publication-check','exec'),namespace)
        doc={'status':'published','publication_reviewed':True,'title':{'en':'School'},'location':'Kerala','scope':'Construction','credits':[{'entity_type':'partner','entity_slug':'studio','role':'Architect','verified':False}]}
        with self.assertRaises(Error) as error:await namespace['publication_check'](SimpleNamespace(partners=Collection()),doc,'project',{'role':'owner'})
        issues=error.exception.detail['issues'];self.assertTrue(any('Profile studio' in s for s in issues));self.assertTrue(any('Credit verified' in s for s in issues))
