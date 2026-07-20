# DailyOS Support

The feedback inbox — every message from the app's "Send feedback" lands here.
Mark resolved, reopen, or delete.

## Deploy (own Vercel project)
1. Root Directory: `support`.
2. Env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (login)
   - `SUPABASE_SERVICE_ROLE_KEY` (read/manage feedback)
3. Needs the `feedback` table — create it from DailyOS Base → SQL → Apply setup.
4. Add this project's `/auth/callback` to Supabase → Auth → Redirect URLs.
