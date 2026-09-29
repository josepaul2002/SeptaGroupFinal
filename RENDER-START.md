# Render launch checklist for Septa Group

The domain assumed here is **septa.one** (spoken as “septa dot one”). Confirm its spelling in GoDaddy before changing DNS. Keep the site unindexed while testing.

## Source first

Render deploys code from the linked GitHub branch, not the ZIP on your Mac. The current release branch must be pushed to `josepaul2002/SeptaGroupFinal` before connecting it in Render. Choose that branch in the service settings, or merge it into `main` after reviewing the changes. The repository root contains `Dockerfile` and `render.yaml`; select that root, not the `frontend` folder.

## New Blueprint on Render

1. In Render, select **New → Blueprint**, connect `josepaul2002/SeptaGroupFinal`, select the branch containing this release and confirm the Blueprint file `render.yaml`.
2. It creates one Docker web service called `septa-group` on the Starter plan. Do not create a static site or a second frontend service. The health check is `/api/health`.
3. Supply the `sync: false` values prompted on creation. On later Blueprint updates, add or edit any new secret manually in the service's **Environment** tab.
4. Use the first Render HTTPS address as `SITE_URL`, such as `https://<actual-service>.onrender.com`, and exactly the same address for `CORS_ORIGINS`. `GOOGLE_WORKSPACE_DOMAIN=septa.one`; `BOOTSTRAP_ADMIN_EMAIL=paul@septa.one`; `ALLOW_INDEXING=false`.
5. Create a Google Cloud OAuth **Web application** credential. Add the exact redirect `https://<actual-service>.onrender.com/api/admin/google/callback`. Put its ID and secret in Render. Enable Workspace two-step verification or passkeys for every admin. If migrating the existing Mongo database, make `paul@septa.one` an enabled owner in the local admin first; bootstrap only runs when the database has no admins.
6. Provide a persistent MongoDB Atlas URL for `MONGO_URL`. Configure Cloudflare R2 or compatible S3 for uploads, with `STORAGE_PROVIDER`, bucket, endpoint, key, secret and `PUBLIC_CDN_BASE_URL`. Local Mongo and local uploads on your Mac do not move to Render automatically; export/import records and copy media before cutover.
7. Verify the sending domain with the transactional email provider before setting `FROM_EMAIL=contact@septa.one` and `ADMIN_NOTIFY_EMAIL=paul@septa.one`. Google Workspace handles the mailbox, while the site currently uses Resend for automatic messages. Preserve Google MX records when adding Resend's domain authentication records.
8. Check `/api/health`, `/ecosystem/jacob-binoy`, the Collaborators back link, `/admin` Google sign-in, one approved image upload and a test enquiry. Existing `/uploads/...` links from local media need copying or updating; otherwise they may remain broken even when the page renders.
9. Add `septa.one` and, if desired, `www.septa.one` under the Render service's **Custom Domains**. Copy the *exact* DNS records Render provides into GoDaddy; do not change Google's MX records. Once HTTPS is active, change `SITE_URL` and `CORS_ORIGINS` to the final canonical origin and add that origin's OAuth callback URL in Google Cloud. Test admin login again.
10. After public content, consent and contact routes are reviewed, turn `ALLOW_INDEXING=true`. Review `/robots.txt`, `/sitemap.xml`, canonical URLs and Google Search Console.

Never paste Mongo, OAuth, R2 or Resend credentials in a chat or commit them to GitHub. Add them directly to Render's secret environment settings.

## Addresses to create in Google Workspace

| Address | Use | Destination |
|---|---|---|
| `paul@septa.one` | Primary owner and admin sign-in | Paul account |
| `contact@septa.one` | Public enquiries, outgoing site sender after domain verification | Alias to Paul |
| `support@septa.one` | Site or customer support | Alias to Paul |
| `finance@septa.one` | Billing correspondence | Alias to Paul |

These aliases are suggestions; the code cannot create Google Workspace addresses. Aliases forward into the primary mailbox and are not separate admin sign-in accounts. The website's public email is editable under **Admin → Contact & settings → Contact Info**; existing saved contact settings take priority over source defaults. The newsletter and finance addresses are not automatically shown publicly.
