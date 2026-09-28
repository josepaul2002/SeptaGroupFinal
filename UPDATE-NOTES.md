# Septa: contact, media and account recovery update

## Apply on your Mac

1. Stop the running site with Control-C in its terminal.
2. Extract `septa-contact-media-update.zip` in Downloads.
3. Run `bash ~/Downloads/septa-update/apply-update.sh`.
4. The updater prints the command to restart your existing site. Open http://localhost:8000/admin and refresh the page.

The updater backs up the files it replaces and preserves `.env`, `backend/.env`, `.venv`, `backend/uploads`, other uploaded data and MongoDB. The existing admin password stays the same. It includes the compiled website, so no npm build is needed on your Mac. If your site is in another folder, pass its path to the updater as the first argument.

## What changed

- Partners: Facebook URL alongside website/Instagram; public profile shows the link. Business Facebook and Instagram links live in Settings → Contact Info and appear in the footer.
- Uploaded image addresses can be relative (`/uploads/...`). Partner image fields previously used browser URL validation, which rejected these local upload addresses. Uploading now provides actionable errors, rejects unsupported formats early, and retains filename extensions. Supported images: JPG, PNG, WebP, GIF; export HEIC to JPG. Maximum upload: 50 MB.
- Projects: upload cover, gallery, approved plans, or self-contained GLB. Upload completion reminds you to save. Errors identify validation, connectivity, permissions or server/database trouble. A legacy record without `id` no longer crashes the audit step after a project update. Invalid API HTML responses are rejected rather than reported as a successful save. The exact cause of the failure on your Mac cannot be confirmed without its API response/server log.
- 3D: the old component was an unconnected placeholder. Sketchfab model-page and embed links now open a real embed. Direct GLB/GLTF files use Google's model-viewer, loaded only on demand. A poster appears immediately; heavy external models cannot be instant. There are retry/open-directly fallbacks. Private or embedding-disabled models may remain unavailable. GLTF may require separately hosted textures; use a self-contained GLB for uploads. External model files need appropriate CORS settings.
- Contact: direct Call, WhatsApp and Email actions, with contextual architect introduction messages. Callback requires only name and phone; other details are optional. Callback requests enter Leads; direct messages/calls use the selected app and do not create CRM records automatically.
- About: an illustrative animated globe focuses on Kerala and highlights configured operating areas. District names are mapped automatically; custom locations support optional latitude/longitude in Website Studio. No operating locations are invented. Reduced-motion preferences are respected; rotation can be paused. A custom uploaded graphic still overrides the globe.
- Login: Forgot your password → email recovery. 20-minute single-use tokens are stored as hashes, requests are throttled, disabled accounts cannot recover, and password changes revoke existing sessions. Reset links do not go into access logs. This adds email recovery, not Google login or MFA.

## Configure in Admin

**Settings → Contact Info:** business telephone, WhatsApp number (with country code), business email, Facebook page and operating districts. Empty channels remain hidden. Partners → edit → Basic Info: collaborator social links. Public enquiries always go through Septa; private collaborator contact fields are not exposed.

**Website Studio → About → Where We Work:** add the areas you actually serve, descriptions and related project matches. Clear the section's custom image if you want to use the globe. Review and publish the page.

**Admin accounts:** create an owner account using an email you can receive before relying on recovery. An address such as `you@example.com` cannot receive your recovery mail. Test the new account in a separate browser before disabling an old placeholder account. Bootstrap environment variables only create the first admin on an empty database; they do not change existing accounts.

## Configure email recovery

Use the existing Resend integration. Add these in the root `.env` locally, or in hosting environment settings:

```
SITE_URL=http://localhost:8000
RESEND_API_KEY=your-provider-key
FROM_EMAIL=Septa <admin@your-verified-domain>
ADMIN_NOTIFY_EMAIL=your-real-owner-email
```

Use your actual HTTPS origin for SITE_URL in production. Verify your sending domain's DNS in Resend. Restart after changing environment settings. Keep the key and credentials private. Then test Forgot your password using a real active admin account. Local emails contain localhost links, which must be opened on the computer running the site. A successful generic reset request deliberately does not confirm that an account exists or that email delivery succeeded. Provider failures are recorded by error type in server logs; the local `reset-admin.py` remains a fallback.

## Hosting recommendation

For this existing stack: **one paid Render Docker web service + MongoDB Atlas + Cloudflare R2 + Resend**. React is built into the FastAPI Docker image, so both share one domain. `render.yaml` supplies a reviewable deployment template; nothing has been deployed or purchased.

1. Create an Atlas database user and restrict Atlas network access to the hosting service's outbound addresses. Store its connection string in MONGO_URL. Choose DB_NAME intentionally.
2. Create the Render Docker service from your repository. Set SITE_URL to its confirmed HTTPS origin initially, and set CORS_ORIGINS to that exact origin. The Docker command honors Render's PORT.
3. Set R2 credentials, BUCKET_NAME, R2_ENDPOINT_URL and PUBLIC_CDN_BASE_URL. For production public media, connect a custom CDN domain to the R2 bucket. Local uploads are not accepted in production because this service uses replaceable container storage. Existing local `/uploads/` files must be migrated to R2 with content addresses updated before production.
4. Verify the Resend domain, set the email variables, and set a unique SECRET_KEY. Bootstrap credentials are needed only for an empty database. Remove the bootstrap password after the first owner is created.
5. Migrate your local database deliberately (backup first), or add reviewed content to the new database. Updating code does not copy local MongoDB to Atlas.
6. Connect your domain, update SITE_URL/CORS_ORIGINS, test admin login, upload/save, project preview, phone/WhatsApp/email, real lead delivery and password recovery. Run Launch readiness. Then set ALLOW_INDEXING=true after confirming only reviewed public content is visible.

A paid always-on service avoids a free service waking up for each cold visit. Select plans after checking current pricing and backup requirements. This update has not been tested against live Atlas, R2 or Resend credentials.

Official setup references:
- https://render.com/docs/docker
- https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
- https://developers.cloudflare.com/r2/buckets/public-buckets/
- https://resend.com/docs/dashboard/domains/introduction
- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html

## Verification in this workspace

- Production React build passes with CI warnings treated as errors.
- 15 isolated backend tests pass, including one-use recovery, expiry, disabled accounts, session revocation and the legacy project save regression.
- 16 production-bundle UI scenarios pass against controlled API fixtures in JSDOM, including upload/save/retry, introduction contact actions, Facebook profiles and reset form submission.
- Model URL validation, contact-link encoding and unsafe provider rejection pass.
- Updater tested in a temporary installation: backup created and `.env`, virtual environment and uploads preserved.
- Live FastAPI/MongoDB integration, real email delivery, cloud storage and WebGL rendering have not been exercised here. Those require the running installation/provider credentials and a real browser before launch.
