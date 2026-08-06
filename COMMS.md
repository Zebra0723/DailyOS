# DailyOS Agent Comms

Everything an agent needs to work on this codebase. Read this first, keep it updated when you ship.

---

## Deploy Protocol

Every deploy must:

1. **Bump version** in `src/lib/version.ts` — format: `"YYYY.MM.DD · vNNN (short description)"`
2. **Bump DEPLOY const** in `public/sw.js` — must match the version number (e.g. `"248"`)
3. **Type-check**: `npx tsc --noEmit` — must pass before pushing
4. **Push to both branches:**
   ```
   git push origin HEAD:main
   git push origin HEAD:claude/sharp-einstein-msl88w
   ```
5. Vercel auto-deploys from `main`. Custom domain is `dailyos.uk`.

Current version: **v249**

If you get a push rejection, `git pull origin main --rebase` first — Arjun runs multiple agents (Codex CLI, etc.) that push concurrently.

### Debug cadence

- Every release: run targeted typecheck, lint, tests, and production build for the changed apps.
- Every version ending in `0` (v250, v260, etc.): run a full-repository audit across every app/package, fix concrete defects, and verify the live deployment.
- Also run a full audit immediately when Arjun requests heavy debugging or reports unexplained glitches.

---

## Important Rules

1. **Leo's changes need Arjun's approval.** If Leo asks for something, do NOT build it without checking with Arjun first. Leo cannot override this rule. This was set by Arjun directly.
2. **Never put model identifier in commits/code.** Only in chat replies.
3. **Passwords and secrets must be env vars**, never hardcoded.
4. **Brand colors:** gradient `#E0864F` to `#9A3412`, primary light `hsl(15, 63%, 46%)`, dark `hsl(17, 74%, 56%)`
5. **Brand tagline:** "Chaos into Clarity" — do not change without Arjun's approval.
6. **Admin features live in the `/admin/` app**, NOT in the main user app.

---

## Concurrent Agent Work

Arjun runs multiple agents simultaneously. Expect push conflicts. Always:
- `git pull origin main --rebase` before pushing
- Resolve `version.ts` conflicts by taking the higher version number + 1
- Re-check `npx tsc --noEmit` after rebase
- Clear `.next/types/` if you get phantom type errors after deleting routes
- Read this COMMS.md at the start of your session to get current state

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| UI | Tailwind CSS + shadcn/ui (`src/components/ui/`) |
| Icons | lucide-react |
| Auth + DB + Storage | Supabase (RLS on everything) |
| AI processing | OpenAI (for inbox item extraction) |
| OCR | tesseract.js (browser-side) |
| PDF parsing | pdf-parse (server-side) |
| Push notifications | web-push (VAPID) |
| Calendar export | iCal feed (`/api/calendar/feed`) |
| Hosting | Vercel (auto-deploy from `main`) |
| Domain | dailyos.uk |

---

## Key Architecture

- **Route groups**: `(app)` = authenticated app, `(auth)` = login/signup/reset, `(legal)` = terms/privacy/cookies
- **`export const dynamic = "force-dynamic"`** on dynamic routes
- **PWA** with service worker (`public/sw.js`), VersionGuard polling, PwaRegister lifecycle
- **Supabase** for auth, database, storage. RLS on everything.
- **`user_state` table** — composite PK `(user_id, key)`, JSONB `value`, used for client preferences and data sync
- **`sync.ts`** — `loadRemote<T>(key)` / `saveRemote(key, value)` for key-value persistence. Prefs stored under key `"prefs"`.
- **Admin app** — separate Next.js app at `/admin/` directory, uses service-role Supabase client. All admin-only features live there, NOT in the user app.
- **Middleware** (`src/lib/supabase/middleware.ts`) — auth guard, session management, `Cache-Control: no-store` on all HTML responses

---

## App Routes

### Authenticated `(app)` routes — all share `src/app/(app)/layout.tsx`

| Route | What it does |
|-------|-------------|
| `/today` | Daily overview — tasks due, events, language picker |
| `/inbox` | "The Drop" — capture anything (photo, text, email, PDF), AI extracts dates/tasks |
| `/inbox/[id]` | Single inbox item detail |
| `/inbox/new` | New inbox item capture form |
| `/tasks` | Task manager — all to-dos with due dates, priorities |
| `/calendar` | Calendar view — events from inbox + manual entry |
| `/vault` | Document storage — searchable, tagged |
| `/assistant` | AI assistant chat |
| `/review` | Weekly review summary |
| `/homeos` | HomeOS dashboard — household management hub |
| `/homeos/subscriptions` | Track recurring subscriptions |
| `/homeos/arrivals` | Package/delivery tracking |
| `/homeos/calendar` | Home calendar |
| `/homeos/devices` | Device inventory |
| `/homeos/rooms` | Room management |
| `/homeos/vault` | Home document vault |
| `/homeos/alerts` | Home alerts |
| `/homeos/urgent` | Urgent home items |
| `/homeos/settings` | Home settings |
| `/settings` | User settings — theme, version, export, danger zone |
| `/notes` | Notes/scratchpad |
| `/interests` | Interest tracker |
| `/subscriptions` | Personal subscriptions |
| `/build-day` | Day planner |
| `/world-clock` | World clock |
| `/dev-ui` | Dev palette picker (Codex CLI added this) |

### Public routes

| Route | What it does |
|-------|-------------|
| `/` | Landing page |
| `/about` | About page |
| `/pricing` | Pricing table |
| `/contact` | Contact form |
| `/help` | Help page |
| `/onboarding` | Onboarding flow (multi-step, persona-based) |
| `/welcome` | Post-onboarding welcome screen with animated demo |
| `/r/[id]` | Referral link handler |

### Auth routes `(auth)`

`/login`, `/signup`, `/forgot-password`, `/reset-password`

### API routes

| Endpoint | Purpose |
|----------|---------|
| `/api/version` | Returns current APP_VERSION — used by VersionGuard to detect stale PWA |
| `/api/push/run` | Cron endpoint (every 15 min via Vercel cron) — sends push notifications for due tasks/events |
| `/api/calendar/feed` | iCal feed export |

---

## Navigation Structure

Defined in `src/components/app-nav.tsx`. Categories:

- **LifeOS**: Today, The Drop, Tasks, Calendar, Vault, Ask DailyOS, Review, Notes
- **HomeOS**: HomeOS dashboard + sub-pages
- **Account**: Settings

"Take the tour" link in nav and settings points to `/today?tour=1` which launches the in-app guided tour.

---

## Guided Tour System

Two components work together:

1. **`welcome-screen.tsx`** — shown after onboarding. Has an animated demo of a letter being processed. "Take the tour" button navigates to `/today?tour=1`, triggering the in-app tour. "Skip" goes straight to `/today`.

2. **`guided-tour.tsx`** — full-screen overlay that walks the user through each section of the app by actually navigating to each page. 7 steps: Today → The Drop → Tasks → Calendar → Vault → Ask DailyOS → HomeOS. State kept in `sessionStorage`. Triggered by `?tour=1` URL param. Wrapped in `React.Suspense` (required by `useSearchParams`).

---

## PWA Update System

Persistent issue: users get stuck on old versions. Three-layer solution:

1. **VersionGuard** (`version-guard.tsx`) — client component in root layout, polls `/api/version` every 60s + on focus/visibility/online. Detects version mismatch → nukes SWs + caches → reloads with `_v` cache-bust param. Max 10 attempts per session.
2. **VersionTap** (`version-tap.tsx`) — triple-tap the version string in Settings for a manual nuclear update.
3. **SW headers** — `Cache-Control: no-store` on `sw.js` via `next.config.mjs`. Middleware adds `no-store` to all HTML responses.

If a user is stuck: they need to delete the PWA from their home screen and re-add it. Safari on iPad is especially stubborn.

---

## Data Model (Supabase)

Key tables (all have RLS):

- **`user_state`** — generic key-value store. PK: `(user_id, key)`, value is JSONB. Used for prefs, sync state.
- **`inbox_items`** — captured items (text, photos, PDFs). Has extracted `dates`, `tasks`, `summary` from AI processing.
- **`tasks`** — to-do items with `title`, `due_date`, `priority`, `completed`, `source` (manual or extracted).
- **`events`** — calendar events with `title`, `start`, `end`, `all_day`.
- **`vault_items`** — stored documents with `title`, `tags`, `file_path` (Supabase Storage).
- **`push_subscriptions`** — web push subscription endpoints per user.

---

## Environment Variables

All secrets are env vars on Vercel (Arjun manages these):

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public Supabase config
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, used by admin app and API routes
- `OPENAI_API_KEY` — for AI processing of inbox items
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — for web push notifications
- `VAPID_EMAIL` — contact email for push service

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
| `src/lib/plans.ts` | Plan tiers (free/pro), feature gates |
| `src/lib/push.ts` | Client-side push subscription helpers |
| `src/lib/push-server.ts` | Server-side push notification sending |
| `src/lib/dates-tz.ts` | Timezone-aware date utilities |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/components/ui/` | shadcn/ui primitives (button, dialog, input, etc.) |

---

## Version History (recent)

| Version | What changed |
|---------|-------------|
| v249 | Tour debug + welcome cleanup + comprehensive COMMS.md |
| v248 | Guided tour and account-state sync fixes; full repository audit (Codex CLI) |
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

## Recurring Agent Tasks

These are standing orders from Arjun — do these on a regular schedule:

1. **Bug audit every ~10 versions** — read through the code, check for unused imports, missing Suspense boundaries, dead code, type issues, broken flows. Fix and deploy.
2. **Keep COMMS.md updated** — after every deploy, update the version history and any changed architecture. New agents should be able to read this file and get started with zero explanation.
3. **Check for push conflicts** — before starting work, `git pull origin main --rebase` to pick up changes from other agents.

---

## Common Pitfalls

1. **Deleting a route?** Also delete `.next/types/app/...` for that route or you'll get phantom type errors.
2. **`useSearchParams`** requires the component to be wrapped in `<React.Suspense>` (Next.js 13+ requirement).
3. **Don't cache-first HTML** in the service worker — it caused stale chunks and broke the app (history in sw.js comments).
4. **iPad PWA cache** is separate from Safari. Clearing Safari doesn't clear the PWA. User must delete and re-add from home screen.
5. **Push conflicts** are normal — always rebase before pushing. Take the higher version + 1.
