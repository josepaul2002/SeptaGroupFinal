# Test Credentials

## Admin Panel (`/admin`) — password only (Google login removed June 2026)
- Email: `admin@septa.group`
- Password: `septa2024admin`

Password can now be changed in-app: Admin Panel → Account → Change Password
(min 8 characters, requires current password).

## Notes
- Google sign-in for admin has been REMOVED (frontend button, hook, and `/api/admin/google-session` endpoint).
- Resend email is LIVE. Sender is currently `onboarding@resend.dev`; switch `FROM_EMAIL` in
  `/app/backend/.env` to `noreply@septa.one` once the `septa.one` domain is verified in Resend.
- Admin notifications go to `paul@septa.one` (`ADMIN_NOTIFY_EMAIL`).
