# DailyOS — Pitch site

A standalone, DailyOS-branded marketing/pitch website. It shares nothing with
the main app (no database, no auth) — it's a self-contained Next.js app you can
deploy to its own Vercel project.

## Deploy on Vercel (separate project)

1. Push this repo (the pitch folder lives at `/pitch`).
2. In Vercel → **Add New… → Project** → import the same GitHub repo.
3. Set **Root Directory** to `pitch`.
4. Framework preset: **Next.js** (auto-detected). No environment variables needed.
5. Deploy. You'll get its own URL, separate from the app and the admin.

## Local

```bash
cd pitch
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
```

## Editing the copy

All content lives in `src/app/page.tsx`. Branding (colours, fonts) matches the
main DailyOS app and is defined in `src/app/globals.css` + `tailwind.config.ts`.
