# Septa: layout, testimonials and admin update

## Install this cumulative update on your Mac

1. Stop the running site with Control-C in its terminal.
2. Extract `septa-discovery-update.zip` in Downloads.
3. Run `bash ~/Downloads/septa-discovery-update/apply-update.sh`.
4. If asked, enter the folder you currently run. The installer prints the exact restart command.
5. Restart and open http://localhost:8000/admin. Refresh the browser.

The installer backs up replaced files and preserves your environment settings, Python virtual environment, uploaded files, MongoDB data and existing login. The compiled React build is included; you do not need to run npm. This package has not been installed on your Mac or deployed remotely.

## What changed and where to edit it

- **Website studio:** dynamic homepage project, services, Septa team, collaborator, coverage and testimonial sections. Existing published content is reused. Empty sections stay hidden. Existing custom page content is preserved; the default homepage upgrades when read/saved. You can reorder, disable and select records.
- **Settings → Brand & navigation:** separate desktop/menu/footer links, editable footer groups, Off/Subtle/Expressive motion, header glass, globe animation and mobile contact actions. OS reduced-motion preferences override site motion.
- **Projects:** visible photographs and continuous content with jump links, keyboard/swipe gallery, prominent Septa responsibility, separate Septa delivery team and external collaborator cards. Optional 3D/video/drawings load further down.
- **Credits:** select a published/reviewed profile, or see unready profiles in a separate dropdown group. Verify its project role separately. Choose the selected profile name or company represented only; add an optional company website. “Company represented on this project” replaces “At the time”. Publication errors now tell you which check failed. Drafts can still be saved.
- **Partners:** person/company identity, portrait, professional role and firm. Image uploads keep their local paths. Upload approved MP4/WebM profile videos up to 50 MB; save afterward. Saving is disabled while an upload is in progress. Errors remain visible in the editor.
- **Testimonials:** client portrait and cover upload, completed-project checkbox, optional published-project selector. Selecting a project creates a public link and displays the testimonial on that project. A completed-project testimonial can link only to a project marked Completed. Linking is optional. Only reviewed, published testimonials appear publicly.
- **Settings → Enquiry form:** edit standard field labels and add/remove text, long-text and dropdown questions; mark them required if necessary. Name/phone remain required for callbacks. Required questions are visible immediately; optional ones stay collapsed. Server validation and saved question/answer snapshots preserve what the visitor answered. Answers also appear in the lead message for existing admin/email workflows.

## Email-code login: configure before enabling

This build supports password followed by a six-digit email code for all admin accounts. It is **off by default** to avoid locking out an installation without working email.

Use the existing Resend integration: set a real `RESEND_API_KEY`, a verified `FROM_EMAIL`, and a unique `SECRET_KEY` in your existing environment. Ensure every admin address can receive mail. Test password-recovery delivery first. Then set `ADMIN_EMAIL_OTP=true` and restart. Do not replace your existing environment with the example file.

Codes expire after five minutes, allow five attempts, are single-use, and have a 60-second resend cooldown. Only keyed hashes are stored; changing account access/password invalidates pending codes. If delivery fails, login stops with a configuration error rather than bypassing verification. As the local owner, you can set `ADMIN_EMAIL_OTP=false` and restart to recover from a broken email-provider configuration.

This verifies the **admin mailbox** during login. It does not add an OTP barrier to customer enquiries. Email codes depend on mailbox security and are not phishing-resistant authentication.

## Google Workspace and provider options

- Protect staff mailboxes with enforced Google Workspace 2-Step Verification, preferably passkeys/security keys: https://support.google.com/a/answer/175197
- Google sign-in can be integrated later for explicitly approved Septa admins. A Workspace subscription does not automatically authenticate this custom application; validate Google tokens and the hosted-domain claim, and retain the admin allowlist: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- Google Calendar booking pages can be linked from an editable navigation/CTA for consultations. Premium booking features depend on the precise Workspace edition: https://support.google.com/calendar/answer/11608416
- Workspace SMTP relay can send application email after configuration, but it is not an OTP verification service: https://support.google.com/a/answer/176600
- Twilio Verify offers managed email verification through SendGrid: https://www.twilio.com/docs/verify/email . This build uses Resend delivery with verification handled by the application, so no second provider is needed initially. No provider accounts or Google Admin settings were changed.

## Upload troubleshooting

Use JPG/PNG/WebP/GIF images; export iPhone HEIC images as JPG first. Files must be under 50 MB. Uploading fills the address automatically; saving the record retains it. Locally the server must be able to write to backend/uploads; in production configure persistent R2/S3 storage and its public CDN URL. The supplied screenshots show credit/layout problems, not an upload failure response, so the exact failure on your Mac remains unconfirmed. If it persists after this update, copy the full error shown by the editor and the server terminal.

## Verification

Production frontend build, 22 isolated backend tests, 19 production-bundle DOM scenarios and media-link checks passed. Checks cover OTP expiry/replay/attempt limits, profile/testimonial schema retention, publishing errors, uploads and retry behavior, linked content, gallery keyboard navigation, custom enquiry questions, two-stage login and malformed API fallbacks.

These checks use controlled data and DOM simulation, not a full visual browser or live MongoDB, Resend, Google Workspace or R2 service. Live email delivery, cloud storage credentials and the Mac installation require environment validation.

---

## Previous cumulative update details

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
