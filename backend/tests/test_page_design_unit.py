"""Run without the HTTP/database stack: python3 -m unittest discover -s backend/tests -p test_page_design_unit.py -v"""
import asyncio
from copy import deepcopy
from pathlib import Path
import sys
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from pydantic import ValidationError
from models.page_design import PageDesign
from services.pages import DEFAULTS, design, public_page, next_document, design_html

class Collection:
    def __init__(self,doc):self.doc=doc
    async def find_one(self,*args):return deepcopy(self.doc)
class Database:
    def __init__(self,doc):self.page_content=Collection(doc)

class PageDesignTests(unittest.TestCase):
    def test_every_default_is_editable_and_valid(self):
        for key,value in DEFAULTS.items():
            parsed=PageDesign.model_validate(value)
            self.assertTrue(parsed.hero.title.en)
    def test_unsafe_links_and_duplicate_sections_are_rejected(self):
        for href in ['javascript:alert(1)','//host.test','/\\host.test','data:text/html,x']:
            doc=deepcopy(DEFAULTS['about']);doc['hero']['primary_url']=href
            with self.assertRaises(ValidationError):PageDesign.model_validate(doc)
        doc=deepcopy(DEFAULTS['about']);doc['sections'].append(doc['sections'][0])
        with self.assertRaises(ValidationError):PageDesign.model_validate(doc)
    def test_legacy_team_blocks_are_preserved_without_mutating_source(self):
        legacy={'status':'published','publication_reviewed':True,'blocks':[{'id':'person','block_type':'team_member','title':{'en':'A named person'},'body':{'en':'A role'}}]}
        original=deepcopy(legacy);converted=design('about',legacy)
        PageDesign.model_validate(converted)
        self.assertIn('A named person',str(converted));self.assertEqual(legacy,original)
    def test_draft_preserves_live_version_and_excludes_hidden_sections(self):
        live=deepcopy(DEFAULTS['about']);live.update(status='published',publication_reviewed=True)
        live['hero']['title']['en']='Published heading';live['sections'][0]['enabled']=False
        draft=deepcopy(live);draft['hero']['title']['en']='Private draft';draft['status']='draft'
        saved=next_document('about',PageDesign.model_validate(draft),live,'time-1')
        saved_again=next_document('about',PageDesign.model_validate(draft),saved,'time-2')
        public=asyncio.run(public_page(Database(saved_again),'about'))
        self.assertEqual(public['hero']['title']['en'],'Published heading')
        self.assertFalse(any(s['id']==live['sections'][0]['id'] for s in public['sections']))
        self.assertNotIn('Private draft',str(public))
    def test_publish_and_unpublish_replace_the_public_version(self):
        doc=deepcopy(DEFAULTS['about']);doc.update(status='published',publication_reviewed=True)
        doc['hero']['title']['en']='New public heading'
        saved=next_document('about',PageDesign.model_validate(doc),None,'time-1')
        self.assertEqual(asyncio.run(public_page(Database(saved),'about'))['hero']['title']['en'],'New public heading')
        doc['status']='archived';archived=next_document('about',PageDesign.model_validate(doc),saved,'time-2')
        self.assertNotIn('published_snapshot',archived)
        self.assertEqual(asyncio.run(public_page(Database(archived),'about'))['hero']['title'],DEFAULTS['about']['hero']['title'])
    def test_search_html_escapes_text_and_omits_disabled_sections(self):
        doc=deepcopy(DEFAULTS['about']);doc['sections']=[{'id':'visible','type':'text','title':{'en':'<script>unsafe</script>'},'body':{'en':'Visible content'},'link_url':'javascript:bad()'},{'id':'hidden','type':'text','enabled':False,'title':{'en':'Private section'}}]
        html=asyncio.run(design_html(Database(None),doc,{}))
        self.assertIn('&lt;script&gt;',html);self.assertNotIn('<script>',html);self.assertNotIn('Private section',html);self.assertNotIn('javascript:',html)

if __name__=='__main__':unittest.main()
