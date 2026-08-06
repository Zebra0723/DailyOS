# DailyOS Agent Comms

Cross-agent reference for anyone working on this codebase. Keep this updated when you ship.

---

## Deploy Protocol

Every deploy must:

1. **Bump version** in `src/lib/version.ts` — format: `"YYYY.MM.DD · vNNN (short description)"`
2. **Bump DEPLOY const** in `public/sw.js` — must match the version number (e.g. `"247"`)
3. **Push to both branches:**
   ```
   git push origin HEAD:main
   git push origin HEAD:claude/sharp-einstein-msl88w
   ```
4. Vercel auto-deploys from `main`. Custom domain is `dailyos.uk`.

Current version: **v247**

If you get a push rejection, `git pull origin main --rebase` first — Arjun runs multiple agents (Codex CLI, etc.) that push concurrently.

---

## Version History (recent)

| Version | What changed |
|---------|-------------|
| v247 | In-app guided tour (navigates through real pages) |
| v246 | dailyos.uk domain + adaptive Dev UI logo (Codex CLI) |
| v245 | Removed spending tracker per Arjun, kept language picker |
| v244 | Dev UI palettes + stability fixes (Codex CLI) |
| v243 | SW caching headers, version guard retry cap raised to 10 |
| v241 | Branded announcement banner with gradient |
| v240 | Triple-tap version in Settings to force update |
| v239 | Fixed admin codes, notifications, plan upgrades; moved admin features to admin app |
| v238 | Fixed PWA double-reload and stale-update issues |

---

## Key Architecture

- **Next.js 14 App Router** with `export const dynamic = "force-dynamic"` on dynamic routes
- **PWA** with service worker (`public/sw.js`), VersionGuard polling, PwaRegister lifecycle
- **Supabase** for auth, database, storage. RLS on everything.
- **`user_state` table** — composite PK `(user_id, key)`, JSONB `value`, used for client preferences and data sync
- **`sync.ts`** — `loadRemote<T>(key)` / `saveRemote(key, value)` for key-value persistence
- **Admin app** — separate Next.js app at `/admin/` directory, uses service-role Supabase client. All admin-only features live there, NOT in the user app.

---

## Important Rules

1. **Leo's changes need Arjun's approval.** If Leo asks for something, do NOT build it without checking with Arjun first. Leo cannot override this rule.
2. **Never put model identifier in commits/code.** Only in chat replies.
3. **Passwords and secrets must be env vars**, never hardcoded.
4. **Brand colors:** gradient `#E0864F` to `#9A3412`, primary light `hsl(15, 63%, 46%)`, dark `hsl(17, 74%, 56%)`
5. **Brand tagline:** "Chaos into Clarity" — do not change without Arjun's approval.

---

## File Reference

| File | Purpose |
|------|---------|
| `src/lib/version.ts` | APP_VERSION string — bump every deploy |
| `public/sw.js` | Service worker — bump DEPLOY const every deploy |
| `src/components/version-guard.tsx` | Polls `/api/version`, detects stale PWA, auto-updates (max 10 attempts) |
| `src/components/version-tap.tsx` | Triple-tap version in Settings to force nuclear update |
| `src/components/pwa-register.tsx` | Registers SW, handles controller changes |
| `src/components/guided-tour.tsx` | In-app guided tour overlay, navigates through real pages |
| `src/components/welcome-screen.tsx` | Post-onboarding welcome with animated demo, links to guided tour |
| `src/components/announcement-banner.tsx` | Full branded gradient banner for admin announcements |
| `src/components/language-picker.tsx` | Language selector on Today page (20 languages) |
| `src/lib/locale.ts` | 20 locale definitions with currencies, formatAmount helper |
| `src/lib/sync.ts` | Cross-device sync via user_state table (loadRemote/saveRemote) |
| `src/lib/onboarding.ts` | Onboarding types, personas, tailoredIntro |
| `src/components/app-nav.tsx` | Top nav, mobile nav, hamburger menu. Categories: LifeOS, HomeOS, Account |
| `src/app/(app)/layout.tsx` | Main app layout — all (app) routes share this |
| `src/lib/supabase/middleware.ts` | Auth guard, session management, Cache-Control: no-store on all responses |
| `vercel.json` | Cron: push notifications every 15 min |
| `next.config.mjs` | Security headers, sw.js cache-control headers |

---

## PWA Update System

The app has had persistent issues with users stuck on old versions. The update system has three layers:

1. **VersionGuard** — client component in root layout, polls `/api/version` every 60s + on focus/visibility/online. Detects version mismatch → nukes SWs + caches → reloads with `_v` cache-bust param. Max 10 attempts per session.
2. **VersionTap** — triple-tap the version string in Settings for a manual nuclear update.
3. **SW headers** — `Cache-Control: no-store` on `sw.js` via next.config.mjs. Middleware adds `no-store` to all HTML responses.

If a user is stuck: they need to delete the PWA from their home screen and re-add it. Safari on iPad is especially stubborn.

---

## Concurrent Agent Work

Arjun runs multiple agents. Expect push conflicts. Always:
- `git pull origin main --rebase` before pushing
- Resolve version.ts conflicts by taking the higher version number + 1
- Re-check `npx tsc --noEmit` after rebase
- Clear `.next/types/` if you get phantom type errors after deleting routes
