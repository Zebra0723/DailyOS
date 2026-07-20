# DailyOS Base

A mobile control panel for the DailyOS Supabase database — dashboard + setup
health, table browser (view/delete rows), and a SQL console with one-tap
"Apply DailyOS setup" migrations. Email-gated to the DailyOS admins.

## Deploy (own Vercel project)
1. Vercel → Add New… → Project → import the `zebra0723/dailyos` repo.
2. Set **Root Directory** to `base`.
3. Environment variables (Production):
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (for login)
   - `SUPABASE_SERVICE_ROLE_KEY` — service role key (row browse/delete)
   - `SUPABASE_PROJECT_REF` — the project ref (the `xxxx` in the dashboard URL)
   - `SUPABASE_ACCESS_TOKEN` — a Supabase personal access token
     (create at supabase.com/dashboard/account/tokens) — powers the SQL runner
4. In Supabase → Authentication → URL Configuration, add this project's
   `/auth/callback` to the allowed redirect URLs (for the magic-link login).
5. Deploy.

Only `arjunvirjain@icloud.com` and `leonardo.mcnicol@icloud.com` can sign in
(see `src/lib/admin.ts`).
