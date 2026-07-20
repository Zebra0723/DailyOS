# DailyOS Pulse

Live health + ops for DailyOS: version, DB, push, reminders-fired, plus controls
to run the cron, toggle maintenance mode, and set the announcement banner.

## Deploy (own Vercel project)
1. Root Directory: `pulse`.
2. Env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (login)
   - `SUPABASE_SERVICE_ROLE_KEY` (read stats, write app_config)
   - `MAIN_APP_URL` (optional, default https://daily-os-lac.vercel.app)
   - `CRON_SECRET` (optional) — if your /api/push/run is protected
3. Add this project's `/auth/callback` to Supabase → Auth → Redirect URLs.
