from io import BytesIO
import unittest
from PIL import Image
from models.schemas import PartnerUpdate, ProjectUpdate
from services.media_rules import validate_image
from services.pages import design


def picture(size, mode='RGB', color='white'):
    stream = BytesIO()
    Image.new(mode, size, color).save(stream, format='PNG')
    return stream.getvalue()


def test_highlights_and_homepage_settings_survive_updates():
    payload = PartnerUpdate(highlights=[{'value':'20,000+', 'label':'sq ft delivered', 'visible':True}]).model_dump(exclude_unset=True)
    assert payload['highlights'][0]['value'] == '20,000+'
    assert PartnerUpdate(highlights=[]).model_dump(exclude_unset=True)['highlights'] == []
    feature = ProjectUpdate(homepage_feature={'enabled':True, 'order':3, 'use_video':True})
    assert feature.model_dump(exclude_unset=True)['homepage_feature']['order'] == 3
    with unittest.TestCase().assertRaises(ValueError):
        ProjectUpdate(homepage_feature={'order':-1})


def test_real_image_dimensions_and_logo_transparency():
    assert not validate_image(picture((1600,900)), 'testimonial_cover')
    assert '16:9 required' in validate_image(picture((900,900)), 'testimonial_cover')
    assert not validate_image(picture((800,1000)), 'portrait_image')
    assert '600px' in validate_image(picture((320,180)), 'project_cover')
    assert 'transparent' in validate_image(picture((512,512)), 'logo_image')
    assert not validate_image(picture((512,512),'RGBA',(255,255,255,0)), 'logo_image')
    assert 'decoded' in validate_image(b'not really a photo', 'project_cover')
    assert 'supported' in validate_image(picture((1600,900)), 'unknown')


def test_coverage_removed_from_new_and_existing_pages():
    for page in ('home','about'):
        assert all(s['type'] != 'locations' for s in design(page)['sections'])
        old = {'version':2,'layout_revision':2,'sections':[{'id':'coverage','type':'locations'},{'id':'keep','type':'text'}]}
        updated = design(page, old)
        assert [s['id'] for s in updated['sections']] == (['keep', 'about-story', 'about-journey'] if page == 'about' else ['keep'])
        assert old['sections'][0]['id'] == 'coverage'
    legacy_about = {'version':2,'hero':{'title':design('services')['hero']['title']},'sections':[{'id':'services','type':'cards','title':{'en':'Construction, shaped to fit.'}}]}
    editorial = design('about', legacy_about)
    assert editorial['hero']['title'] == design('about')['hero']['title']
    assert all(section['id'] != 'services' for section in editorial['sections'])
    assert {'about-story','about-journey'} <= {section['id'] for section in editorial['sections']}

if __name__ == "__main__":
    suite = unittest.TestSuite(unittest.FunctionTestCase(fn) for name,fn in list(globals().items()) if name.startswith("test_"))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(not result.wasSuccessful())
