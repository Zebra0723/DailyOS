# DailyOS Admin

A separate, email-gated management console for DailyOS. Its own Next.js app and
its own deployment, but it talks to the SAME Supabase database as DailyOS, so it
can manage all users and data.

## Who can get in
Edit the allow-list in `src/lib/admin.ts`. Only those emails can sign in;
everyone else is shown a "no access" message. No env var needed for the emails.

## Deploy (separate Vercel project)
1. New Vercel project from this repo, **Root Directory = `admin`**.
2. Env vars (copy from the DailyOS Supabase project -> Settings -> API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secret; full DB access)
   - `NEXT_PUBLIC_SITE_URL` (this admin site's URL)
3. Supabase -> Authentication -> URL Configuration -> Redirect URLs: add
   `https://<your-admin-domain>/auth/callback`.
4. Deploy. Visit the site -> you land on /verify.

## How access works
- `/admin/*` is gated in middleware.
- `/verify` emails a magic link only to allow-listed emails; others get the
  "no admin access" message and nothing is sent.
- The allow-list is re-checked in the admin layout and every server action.
