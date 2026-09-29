import pytest
from backend.tests.test_deployment_contract import client, db


@pytest.mark.asyncio
async def test_draft_review_link_approval_is_private_and_single_response(client, db, monkeypatch, tmp_path):
    import public_site
    monkeypatch.setattr(public_site, 'BUILD_DIR', tmp_path)
    (tmp_path / 'index.html').write_text('<html><head><title>App</title></head><body><div id="root"></div></body></html>')
    await db.partners.insert_one({
        'id': 'review-person', 'slug': 'review-person', 'name': {'en': 'Review Person'},
        'category': 'Architect', 'bio_short': {'en': 'Draft description'},
        'status': 'draft', 'updated_at': 'version-1',
        'contact_email': 'private@example.com', 'media': {'card_image': '/uploads/images/photo.jpg'},
    })
    assert (await client.get('/api/partners/review-person')).status_code == 404
    login = await client.post('/api/admin/login', json={'email': 'owner@example.com', 'password': 'local-test-password-123'})
    headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
    created = await client.post('/api/admin/partners/review-person/review-links', json={'expires_days': 7}, headers=headers)
    assert created.status_code == 201
    link = created.json()['url']
    token = link.rsplit('/', 1)[-1]
    assert len(token) > 35
    html = await client.get('/review/collaborator/' + token)
    assert html.status_code == 200 and html.headers['x-robots-tag'].startswith('noindex')
    assert html.headers['cache-control'] == 'no-store' and 'Draft description' not in html.text
    view = await client.get('/api/collaborator-review/' + token)
    assert view.status_code == 200 and view.json()['profile']['name']['en'] == 'Review Person'
    assert 'contact_email' not in view.json()['profile']
    listing = await client.get('/api/admin/partner-reviews', headers=headers)
    assert listing.status_code == 200 and token not in listing.text and 'token_hash' not in listing.text
    blocked = await client.put('/api/partners/review-person', json={'status': 'published', 'publication_reviewed': True}, headers=headers)
    assert blocked.status_code == 422
    refused = await client.post('/api/collaborator-review/' + token + '/respond', json={'decision': 'approved', 'name': 'Review Person'})
    assert refused.status_code == 422
    accepted = await client.post('/api/collaborator-review/' + token + '/respond', json={'decision': 'approved', 'name': 'Review Person', 'permission_confirmed': True})
    assert accepted.status_code == 200
    assert (await client.post('/api/collaborator-review/' + token + '/respond', json={'decision': 'approved', 'name': 'Other Person', 'permission_confirmed': True})).status_code == 409
    assert (await client.get('/api/partners/review-person')).status_code == 404
    altered = await client.put('/api/partners/review-person', json={'status': 'published', 'publication_reviewed': True, 'bio_short': {'en': 'Different text'}}, headers=headers)
    assert altered.status_code == 422
    published = await client.put('/api/partners/review-person', json={'status': 'published', 'publication_reviewed': True}, headers=headers)
    assert published.status_code == 200
    assert (await client.get('/api/partners/review-person')).status_code == 200


@pytest.mark.asyncio
async def test_edit_invalidates_link_and_revocation_blocks_access(client, db):
    await db.partners.insert_one({'id': 'review-2', 'slug': 'review-2', 'name': {'en': 'Private'}, 'category': 'Designer', 'status': 'draft', 'updated_at': 'v1'})
    login = await client.post('/api/admin/login', json={'email': 'owner@example.com', 'password': 'local-test-password-123'})
    headers = {'Authorization': 'Bearer ' + login.json()['access_token']}
    first = (await client.post('/api/admin/partners/review-2/review-links', json={}, headers=headers)).json()
    token = first['url'].rsplit('/', 1)[-1]
    await db.partners.update_one({'slug': 'review-2'}, {'$set': {'updated_at': 'v2'}})
    assert (await client.get('/api/collaborator-review/' + token)).status_code == 410
    second = (await client.post('/api/admin/partners/review-2/review-links', json={}, headers=headers)).json()
    assert (await client.post('/api/admin/partner-reviews/' + second['review']['id'] + '/revoke', headers=headers)).status_code == 200
    assert (await client.get('/api/collaborator-review/' + second['url'].rsplit('/', 1)[-1])).status_code == 410
