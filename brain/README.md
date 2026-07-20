# DailyOS Brain

Control the DailyOS assistant: check the AI is reachable, run a test prompt, and
set an instruction the assistant follows on every chat (stored in
app_config.ai_config, which the main app reads).

## Deploy (own Vercel project)
1. Root Directory: `brain`.
2. Env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (login)
   - `SUPABASE_SERVICE_ROLE_KEY` (read/write app_config)
   - `AI_PROVIDER_API_KEY` (same key as the main app)
   - `AI_MODEL`, `AI_PROVIDER_BASE_URL` (optional)
3. Add this project's `/auth/callback` to Supabase → Auth → Redirect URLs.
