# DailyOS Deploy

A Vercel management PWA — see your latest deployments, their status, and
trigger a redeploy. Email-gated to the DailyOS admins.

## Deploy (own Vercel project)
1. Vercel → Add New… → Project → import `zebra0723/dailyos`.
2. Root Directory: `deploy`.
3. Env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (login)
   - `VERCEL_TOKEN` — a Vercel API token (vercel.com/account/tokens)
   - `VERCEL_PROJECT_ID` (optional) — limit to one project
   - `VERCEL_TEAM_ID` (optional) — if the project is under a team
   - `VERCEL_DEPLOY_HOOK_URL` (optional) — for the "Trigger deploy" button
     (Vercel project → Settings → Git → Deploy Hooks)
4. Add this project's `/auth/callback` to Supabase → Auth → Redirect URLs.
