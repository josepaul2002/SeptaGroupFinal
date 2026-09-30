# Septa CMS connection

This release provides an authenticated Streamable HTTP MCP endpoint at
`SITE_URL/api/mcp`, hosted by the existing Render application. No database or
R2 credentials are exposed to ChatGPT. It requires deployment before connecting.

## Setup

1. Set Render `SITE_URL` to the exact canonical origin used for sign-in.
2. In the existing Google OAuth web client, register that origin plus
   `/api/admin/google/callback` as an authorised redirect URI.
3. Deploy this branch. Verify `/.well-known/oauth-authorization-server` returns
   the same origin. Do not change database or storage settings.
4. Add a custom MCP connection using `https://YOUR-CANONICAL-DOMAIN/api/mcp`
   in a client that supports Streamable HTTP and OAuth dynamic registration.
5. Sign in with an existing authorised Septa Google Workspace admin.
6. Review client name, callback address and permissions. Read, draft and media
   permissions are selected by default; publishing is not.
7. Run `cms_list` and `cms_schema` before any content writes.

Live client compatibility and Google consent must be verified after deployment.
The endpoint is not automatically installed merely by pushing code to GitHub.

## Permissions and content workflow

- `cms:read`: schemas and content, including unpublished records.
- `cms:draft`: validate/stage changes, apply drafts.
- `cms:media`: upload publicly hosted images/small files using existing validation.
- `cms:publish`: explicit `cms_apply(publish=true)` by owners/publishers only.

Use `cms_stage` with a full document conforming to `cms_schema` (it is a full
replacement, not a patch). No website content changes during staging. The tool
returns the exact proposed content and an ID. Use `cms_apply` to save a draft or
publish after explicit approval. Existing live projects/profiles cannot be
silently unpublished by draft access: their edits remain staged until approved.
Page Studio supports draft snapshots without replacing its live version.

The integration checks the current record against its staged snapshot. If an
editor changed it, restage after reading the new record. This check is not a
cross-application database transaction: avoid simultaneous editing of the same
record during application. An interrupted/failed apply is never retried blindly;
read current content and restage. Existing CMS publication validation still
applies, including collaborator approval.

Media uploads accept base64 up to 5 MiB decoded and enforce the same media role,
format and ratio rules as the admin portal. Use the portal for larger video
uploads. All uploaded media is public even if its content record is a draft.
A generated image must be explicitly uploaded and assigned to a field.

Tokens expire after eight hours (no refresh tokens in this first release).
Reconnect after expiry. Admin → Account → Connected assistants revokes access.
Disabled accounts, auth-version changes and Google identity changes also
invalidate access. Scope is rechecked on each call; token audiences are bound
to the MCP endpoint. Integrations cannot use admin login cookies as MCP tokens.

No access to leads, account management, arbitrary database queries, deletion,
remote URL fetching, source code editing or secret settings is exposed. New
section types still require a GitHub code change. Sections supported by
Page Studio can be managed through the `pages` collection.

## Deployment checks

- Unauthenticated POST `/api/mcp` responds 401 with resource metadata.
- OAuth consent requires an existing admin session and trusted form origin.
- PKCE and exact redirect URI/resource matching are enforced.
- Authorisation codes and consent tickets are single-use and expire quickly.
- Publishing without the publishing scope is rejected.
- Revocation immediately blocks subsequent requests.
- Google login starts on SITE_URL before setting its state cookie, preventing
  the custom-domain/onrender-domain cookie mismatch.

Do not paste OAuth callback query strings or tokens into logs or support chats.

## Verification performed

`pytest backend/tests/test_cms_mcp.py backend/tests/test_deployment_contract.py --asyncio-mode=auto -q`
passes 26 tests with the optional official `mcp` Python client installed. These
cover consent/PKCE and replay prevention, scope enforcement, revocation, account
changes, draft/live separation, stale proposals, publication validation,
image-ratio enforcement, and an official-client initialize/list/call round trip.
`npm run build` also completes successfully. The MCP SDK is only a test client;
it is not a new runtime dependency.
