# Test Credentials — Septa Group CMS

## Admin
- URL: /admin
- Email: admin@septa.group
- Password: septa2024admin

## Google Login (admin)
- "Sign in with Google" on /admin (Emergent-managed Google Auth)
- Allowlist env: ADMIN_ALLOWED_GOOGLE_EMAILS=paul@septa.one,admin@septa.group
- Non-allowlisted Google accounts are rejected (403)

Login endpoint: POST /api/admin/login → returns { access_token }
Use header: Authorization: Bearer <access_token>

## Notes
- Preview: https://septa-cms-preview.preview.emergentagent.com
- Bootstrap admin seeded from backend/.env (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD)
