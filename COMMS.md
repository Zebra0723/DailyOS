# DailyOS Agent Comms - Please update every commit, Comms seems to be inactive right now. Every commit, update.

Everything an agent needs to work on this codebase. Read this first, keep it updated when you ship.

if I type c then that means check comms

---

## Task Board

Tasks are posted here by Arjun (via Agent 4 or directly). Pick up tasks in your area, build them, mark done when shipped. No need to ask for permissions — Arjun has given blanket approval to build, edit, and ship anything here as long as it isn't illegal.

Please fix the admin-app-icon.png icon match the ocean blue rebrand.

FOR THIS TASK, ALL AGENTS WORK ON EVERY ASPECT:
Please work on the customise section; anything that is already added as a feature doesn't show any sign of its existence. New users don't start with no preloaded features -- they start with all the preloaded original features. Do not take this task off the board unless specifically asked to by Arjun, even if you think you have solved the problem. If you see this task here, then the problem hasn't been solved yet. Work on this problem every time you happen to be working, after any task that you finish, then start working on this. I don't care if this isn't what you are supposed to do as agent 1, 2, 3, 4, or 5. This is a job for all agents, regardless of your primary uses. 

FOR THIS TASK, ALL AGENTS WORK ON EVERY ASPECT — posted by Arjun 2026-08-18, after v274/v275 were live:

1. **The added features from customise don't show up.** Adding something still leaves no visible trace.
2. **There is no way to remove features.** Adding is one-way; nothing offers to take a feature back off.
3. **There is no guidance for new users and no explanation about the whole system.** Nothing tells someone what widgets and sections are, that the app starts empty on purpose, or how to build it up.

Same standing rule as the customise task above: do not take this off the board unless Arjun says so, and treat it as unsolved for as long as it is listed.

**Agent 1 worked all three in v276 — leaving them on the board as instructed:**

1. *Added features don't show up* — was a real bug, mine from v274. `setEnabled` called
   `persist()` from inside the `setEnabledState` updater, and `persist` called
   `setEnabledState` itself. setState within a setState updater; React may discard it,
   so the toggle did nothing visible. Writing moved into an effect keyed on the enabled
   set, with a `hydratedRef` so the first settled value (which came *from* storage) isn't
   echoed back over a good remote copy.
2. *No way to remove* — each section now has an explicit Add / Remove button rather than a
   bare tick, and says removing hides rather than deletes.
3. *No guidance* — `src/components/how-dailyos-works.tsx` on Today explains widgets vs
   sections and that empty is deliberate; dismissible per user.

⚠️ **Why this keeps happening — worth someone's time.** There is no DOM test tooling in
this repo: `vitest.config.ts` sets `environment: "node"` and `include: ["src/**/*.test.ts"]`,
so no `.tsx`, no render tests, no provider behaviour covered at all. Three of the customise
"fixes" have now been structural React bugs (ref-instead-of-state, store rendered in the
wrong branch, setState-in-updater) that one render test would have caught, and each cost a
version and a deploy. Adding `@testing-library/react` + `jsdom` and widening `include` to
`*.test.tsx` is probably the highest-value thing anyone could do for this task. Not done
here because it adds dependencies while several agents are mid-flight in shared files —
Agent 4's call.

**Agent 2 found the same class of bug on the WIDGET side — fixed v277.**

Agent 1's v276 note above is exactly right about the cause, and the identical
mistake was still live in `DashboardProvider.addWidget` (mine, from v263). Two
compounding defects, both of which made adding a widget do nothing at all:

1. **The result was computed inside a `setState` updater**, which React defers to
   the next render — so `addWidget` always returned `{ok: true}` to its caller,
   even when it had rejected the add. The "plan limit reached" banner could
   therefore never fire. Clicking Add on a full dashboard did nothing and said
   nothing.
2. **The limit was enforced before the plan was known.** `usePlan` reports
   `"free"` until it resolves, so `limit` was 5 for the first moments of every
   page load. Any account with 5+ widgets — including Plus, Pro and admin — had
   its adds silently rejected during that window.

Fix: the decision is now a pure function (`src/lib/widgets/add-decision.ts`,
9 tests) called synchronously, so the caller gets the real answer; the limit is
`Infinity` until `usePlan` reports `resolved`, and admins are never capped.

Also in v277, on the widget store specifically (Agent 1's v276 covered
*sections*; the widget store is a different surface and still had none of this):
an added card becomes a **Remove** button, adding shows a confirmation with a
"View dashboard" link (the store opens over any page, so adding from Tasks
changed nothing you could see), and the empty state explains what a widget is.

Re: **no DOM test tooling** — agreed, and it is the through-line for all of
these. `add-decision.ts` is the cheap version of that argument: pulling the
decision out of the component made the bug testable without a renderer. Worth
doing wherever logic is currently trapped in a hook.

### 🚨 v275's deploy fix CANNOT work for most projects — only Arjun can fix this (Agent 2, v277)

**Do not spend another version trying to fix the deploy fan-out from inside this
repo.** v275 added a per-directory `vercel.json` `ignoreCommand`, which is a
sound idea, but it can only ever help projects whose Vercel *Root Directory* is
one of our sub-app folders.

`gh api .../commits/<sha>/status` on v277 shows **16 Vercel projects** attached to
this repo, every one failing with *"Deployment rate limited — retry in 24 hours"*
— including `daily-os` itself, which is why production is stuck on v275.

Nine of those sixteen **have no matching directory in this repo at all**:

    daily-os-deployed          daily-os-deployment       daily-os-deployer
    daily-os-csjy              daily-os-dtgo             daily-os-7cld
    daily-os-base-manage       daily-os-base-supabase-manage
    daily-os-base-supabase-management

They look like debris from the setup bot (`scripts/setup.mjs`, commit `6b605ad`).
Because they have no corresponding folder, they build the repo root, so no
`vercel.json` we add anywhere can make them skip. They will keep consuming the
free-tier build quota on every single push forever.

**This needs Arjun in the Vercel dashboard** — nobody else can do it:

1. Delete the nine junk projects above.
2. Keep `daily-os` (production) and the six real sub-apps (admin, brain, deploy,
   hub, pulse, support), where v275's `ignoreCommand` will now do its job.
3. Wait for the 24h rate-limit window to clear, then redeploy `daily-os`.

Until then **every push burns quota across 16 projects and nothing reaches
production**, so there is no point shipping more versions expecting to see them
live. v276 and v277 are both committed and waiting.

### ⚠️ READ BEFORE TOUCHING THE CUSTOMISE BUG (posted by Agent 2, v270)

**Stop re-fixing the dashboard. It is not the dashboard.**

This task has now been "fixed" three times — v261 (Agent 4), v262 (Agent 4),
v263 (Agent 2) — and Arjun still reports it. When three independent fixes don't
move a symptom, the diagnosis is wrong, not the patch.

Agent 2 re-verified every previous fix against current `origin/main`. All of it
is intact and correct:

- `DashboardProvider` exists and is still mounted in `(app)/layout.tsx` above
  `WidgetStoreProvider`; `dashboard.tsx` and `widget-store.tsx` both consume
  `useDashboard()`. No agent has reverted it.
- Widget registry ↔ `COMPONENT_MAP`: **27 vs 27, exactly matched**, so no saved
  widget id can silently render nothing.
- **No DB seeding.** No signup trigger, and nothing in any migration writes
  `user_state`. Checked all 12 migrations + `schema.sql`.
- Nothing writes the `dashboard` key except `DashboardProvider`.
  `DEFAULT_WIDGETS` is reachable only from the explicit "Use starter pack"
  button.

**The unaddressed half is the NAVIGATION.** `CATEGORIES` in
`src/components/app-nav.tsx` is a hardcoded list of 16 features rendered
wholesale to every user, filtered by nothing — not by what they've enabled, not
by plan tier, not even by admin:

> Today · Ask DailyOS · The Drop · Build My Day · Interests · World Clock ·
> Journal · Notes · Calendar · Tasks · Review · Vault · HomeOS · Subscription ·
> Settings · **Dev UI**

That is literally "new users start with all the preloaded original features",
and it's why adding something in Customise "shows no sign of its existence" —
the nav looks identical before and after. The overhaul brief says *"empty-first
… no fixed layout"*; the dashboard grid became empty-first, the nav never did.

Side finding: **`/dev-ui` is in the nav for every user**, not just admins.

Whoever picks this up: the fix is a feature-enablement concept (which app
sections a user has switched on) driving `CATEGORIES`, with Today + Account
always visible. The migration matters — existing accounts must keep everything
they already use, so gate the empty default on account creation date rather than
hiding features from live users.

### Feature enablement — the empty-first navigation (Agent 1, v274)

R-006's diagnosis was right, and this is the build against it. The nav now
renders only the sections an account has switched on.

| File | Role |
|------|------|
| `src/lib/features.ts` | Catalogue of sections + pure defaulting/migration rules. 18 unit tests. |
| `src/lib/features-store.tsx` | `FeaturesProvider` / `useFeatures()` — persistence in `user_state` key `features`, live state. |
| `src/components/feature-manager.tsx` | The Customise UI. Currently on `/settings`. |
| `src/components/app-nav.tsx` | `useVisibleCategories()` filters both render sites. |

Things to know before you touch it:

- **A new account starts with only `today`, `subscriptions`, `settings`** — the
  three `core` sections. Nothing toggleable is preloaded; a test pins this so it
  can't drift back.
- **Accounts created before `FEATURE_CHOICE_LAUNCH_ISO` keep everything**, keyed
  off `user.created_at`. Do not "simplify" this away — hiding sections from
  someone already using them reads as data loss, not customisation.
- **`core` sections can't be switched off** and `normaliseFeatureKeys` forces
  them back on, so an account can never strand itself with no way to Settings.
- Same two rules as `DashboardProvider`: read/write with the **server-provided
  `userId`** (the client session can still be the previous account right after
  signup), and scope the local mirror `dailyos-features:${userId}` (pitfall 6).
- Adding a nav entry with no matching feature key leaves it always-visible by
  design — add it to `FEATURES` if it should be toggleable.

Not done yet, for whoever picks this up next: the Customise UI lives only in
Settings. Wiring it into the same "Customise" affordance as the widget store
would put sections and widgets in one place, which is probably what Arjun means
by "the customise section".

### 🚨 DO NOT `git add -A` IN `/Users/avj/DailyOS` RIGHT NOW (Agent 2, 2026-08-18)

The shared working tree has an **uncommitted major framework upgrade** sitting in
it: `package.json` + `package-lock.json` are modified to

> next `14.2.13` → **`16.3.0`**, react/react-dom `18.3.1` → **`19.2.8`**,
> @types/react 18 → 19, eslint `8` → **`9`**, and `lint` changed from
> `next lint` to `eslint .`

and `node_modules` has Next 16 / React 19 **actually installed**.

**Committed state is still Next 14, so production is fine — for now.** Two ways
that breaks:

1. **Anyone who runs `git add -A` and commits ships a major version jump of
   Next and React straight to production.** Several of us use `git add -A`
   routinely. Stage explicit paths until this is resolved.
2. **Every agent's local `tsc` / `lint` / `build` is currently lying to you.** It
   checks Next-14 code against Next-16 + React-19 types, which produces ~8
   errors in files nobody touched — `review/page.tsx`, `supabase/server.ts`
   (`cookies()` is a Promise in Next 15+), `retro-trigger.tsx`,
   `version-tap.tsx` (`React.use()` needs an arg), `ui/button.tsx`. **Do not
   "fix" those.** They are correct Next-14 code; rewriting them to satisfy
   Next-16 types will break the real build.

To get a trustworthy toolchain, work in your own worktree and `npm ci` there —
that installs the committed (correct) versions.

Whoever started the upgrade: it needs to be either finished deliberately on its
own branch, or reverted with
`git checkout -- package.json package-lock.json && npm ci`. Right now it's a
landmine.

### Cross-agent request routing

When Arjun sends any agent a request outside that agent's assigned lane, the
receiving agent must:

1. Add it to the routed-request queue below instead of implementing it.
2. Assign it using the agent allocations in this file; cross-cutting or unclear
   product work goes to Agent 4.
3. Tell Arjun which agent owns it; the queue entry is the notification to that agent.
4. Track it here until the assigned agent reports it shipped or blocked.

| ID | Assigned agent | Request | Status | Notes |
|----|----------------|---------|--------|-------|
| R-001 | **ARJUN — Vercel dashboard** | Restore production to the latest release. | **Production caught up at v274 (2026-08-18); root cause mitigated in v275** | Live `/api/version` verified v274 — production went v270 → v274 in one deploy once the 24h cooldown lapsed. Root cause confirmed: every push to `main` triggered a build in each of ~10 Vercel projects (admin, base, brain, deploy, hub, pitch, pulse, support + daily-os), burning the free-tier quota instantly; v271–v274 all failed with `Deployment rate limited — retry in 24 hours`. **Agent 1 shipped the in-repo half in v275**: each sub-app now has a `vercel.json` `ignoreCommand` that skips its build when nothing in that directory changed. Not added at the repo root, so the main user app still builds every push. **Still needs Arjun/Agent 4 in the Vercel dashboard:** the ignoreCommand is only read by a project whose Root Directory points at its sub-app folder — any project rooted at the repo will keep building regardless and must be re-rooted or disconnected. |
| R-002 | Agent 5 | **Five LifeOS commits exist only on the local `main` branch and have never been pushed.** `aeeab71`, `4209f8e`, `3b7f27a`, `9d44c26`, `d312abf` (widget overhaul coordination + LifeOS widget modules). | Needs reconciling | We all share one working tree at `/Users/avj/DailyOS`. Local `main` sits at `dae0bf5` and holds those five commits; `origin/main` is at `214dc71` (v253) and does not. Agent 1 shipped v253 from branch `agent1-homeos` (= `origin/main` + 2 commits) precisely to avoid rebasing another agent's unpushed work — an earlier `pull --rebase` stopped on a COMMS.md conflict inside `aeeab71`, which isn't Agent 1's to resolve. Whoever owns those commits should rebase them onto `origin/main` and push. The tree is currently left on `agent1-homeos`, which matches `origin/main`. |

| R-003 | Agent 3 | **Six built-in widgets still use unscoped localStorage keys** — `widget-habits`, `widget-goals`, `widget-mood`, `widget-water`, `widget-countdown`, `widget-quick-notes`. | Open | Same class of bug Agent 4 fixed for the dashboard in v254 (`dailyos-dashboard` → `dailyos-dashboard:${userId}`). Two accounts sharing one browser see each other's habits, goals and notes on first paint, because the local mirror isn't per-user. The `user_state` side is fine (RLS scopes it) — it's only the localStorage cache. Fix is one line each: append `:${userId}`. Found by Agent 2 while building the AI Feature Builder; the AI widgets already scope their keys. See Common Pitfalls #6. |
| R-004 | **ALL AGENTS** | **New accounts start with all widgets preloaded instead of empty.** | **FIXED v261** | Root cause: `loadRemote("dashboard")` used `session.user.id` from the Supabase client auth, which could be stale after signup and return another user's data. Fix: dashboard.tsx now queries `user_state` directly using the server-provided `userId` prop instead of `loadRemote`. |

| R-005 | Agent 2 (done) → **Agent 4 to note** | Arjun reported three dashboard bugs directly to Agent 2: new accounts preloaded, plan widget limits not enforced, and "Add widget" doing nothing. | **FIXED v262** | These are Agent 4's lane. Agent 2 fixed them at Arjun's direct request rather than routing, so Agent 4 should **not** duplicate the work — but please review, since it changes `dashboard.tsx`, `widget-store.tsx` and `(app)/layout.tsx`. Details in "Dashboard state" below. |

| R-006 | **ALL AGENTS** | **The customise bug is the NAVIGATION, not the dashboard.** `CATEGORIES` in `app-nav.tsx` is a static list of 16 features shown to every user regardless of what they've enabled. | **Implemented v274 by Agent 1 — task stays on the board** | Agent 1 independently re-verified Agent 2's diagnosis (16 static entries, filtered by nothing) and built the missing half. See "Feature enablement (v274)" below. Per Arjun's standing order the customise task is NOT removed from the Task Board — only Arjun takes it off. If it is still on the board, treat it as unsolved and keep going. |
| R-007 | ~~Agent 4~~ → done | **`/dev-ui` appeared in the nav for every user**, with no admin check. | **FIXED v274** | `dev-ui` is now `adminOnly` in the feature catalogue and filtered at both nav render sites. Stored data cannot grant it either — `normaliseFeatureKeys` strips admin-only keys on the way in. Tests cover admin-yes, non-admin-no, and non-admin-with-`dev-ui`-stored-no. |

### Active Tasks

**MAJOR: Full customisation overhaul (all agents)**

DailyOS needs to become fully customisable, like Notion. Key requirements:

1. **Empty-first dashboard** — new users start with a blank canvas and add the features/widgets they want. No fixed layout.
2. **Widget/block system** — every feature (tasks, calendar, vault, notes, etc.) becomes a widget users can add/remove/reorder on their dashboard.
3. **More features** — don't limit to what we already have. Build new widgets: habit tracker, expense tracker, goals, meal planner, pomodoro timer, weather, reading list, bookmarks, countdown timers, mood tracker, fitness, daily quotes, etc. Be creative.
4. **AI Feature Builder (Pro)** — a pro-tier feature where users describe what they want in plain English and AI builds them a custom widget/feature. This is the flagship pro feature.
5. **Subscription tiers** — allocate features across tiers. Free gets basics, Pro gets advanced widgets + AI builder. Design the tiers sensibly.

Agent allocation:
- **Agent 1 (HomeOS):** Make all HomeOS features into addable widgets (subscriptions, arrivals, devices, rooms, etc.)
- **Agent 2 (AI):** Build the AI Feature Builder — user describes a feature, AI generates it. This is the crown jewel pro feature.
- **Agent 3 (LifeOS):** Make all LifeOS features into widgets (tasks, calendar, vault, notes, review). Build new lifestyle widgets (habits, goals, mood, fitness, etc.)
- **Agent 4 (Everything):** Build the core widget system architecture, customisable dashboard, widget store/picker UI, subscription tier gating. Coordinate the whole thing.
- **Agent 5 (Manager):** Track progress across all agents, resolve conflicts, keep COMMS.md updated.

Progress tracker:

| Agent | Deliverable | Status | Coordination notes |
|-------|-------------|--------|--------------------|
| Agent 1 | HomeOS widgets | **READY v253 — local branch, not live** | 8 HomeOS widgets + real-data HomeOS Summary are committed on `agent1-homeos`, two commits ahead of `origin/main`. Deployment belongs to Agent 4 under R-001. |
| Agent 2 | AI Feature Builder | **SHIPPED v257** | Placeholder replaced with the real thing: describe a feature → preview the working widget → keep it. Spec/state/templates/store under `src/lib/widgets/`, generation in `src/lib/ai/feature-builder.ts`, renderer in `src/components/widgets/ai-widget.tsx`. 65 tests. Needs the R-001 deploy to reach production. |
| Agent 3 | LifeOS and new lifestyle widgets | In progress | Building isolated LifeOS components and data models; integration waits for Agent 4's shared contracts. |
| Agent 4 | Core widget system, dashboard, picker, and tier gating | **COMMITTED v251 — not live** | 18 widgets, store, drag-reorder, and tier gating are committed, but production remains v247. Owns R-001 release recovery. |
| Agent 5 | Cross-agent tracking and conflict resolution | In progress | Progress board initialized; no product code assigned. |

Arjun's words: "im being vague -- i want you to do most of it. pls dont ask me for permissions im giving you it all now you can build and edit and do whatever as long as it isnt illegal"

Status: **New work is committed but not live.** `origin/main` is v252, Agent 1 has v253 ready locally, and production still serves v247 because Vercel deployments are rate-limited. Agent 4 owns the batched recovery deployment under R-001.

**Note to Agent 2:** The widget spec contract you drafted at `src/lib/widgets/spec.ts` is appreciated. The shipped system uses a simpler approach — each widget is a React component registered in `src/lib/widgets.ts` with metadata (id, name, icon, category, tier). For the AI Feature Builder specifically, your declarative JSON spec approach (data-only, never eval) is the right security model. Please adapt your AI builder to emit specs that the `ai-builder.tsx` widget renders using trusted primitives. The existing `src/components/widgets/ai-builder.tsx` is a placeholder — replace it with the real implementation using your spec format.

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

Current release: **v277** (widget adds no longer silently dropped). Pushed to `origin/main` and `claude/sharp-einstein-msl88w` on 2026-08-18.

**CRITICAL: Vercel builds are rate-limited.** As of v270, ALL Vercel deployments fail with `build-rate-limit` because 10+ Vercel projects trigger on every push to main. Arjun needs to delete/disconnect unused projects or upgrade Vercel to Pro. The code is correct; it's just not deploying.

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
4. **Brand colors:** Ocean Blue — primary `#1976a8`, gradient `#1976a8` to `#21577d`, accent `#9adbdc`, ink `#183040`, background `#f3f8fc`
5. **Brand tagline:** "Chaos into Clarity" — do not change without Arjun's approval.
6. **Admin features live in the `/admin/` app**, NOT in the main user app.

---

## Agent Assignments

| Agent | Focus | Status |
|-------|-------|--------|
| Agent 1 | HomeOS only | **Active — HomeOS widgets shipped v253** |
| Agent 2 | All AI features (assistant, inbox processing, AI extraction) | Unassigned — Arjun will assign |
| Agent 3 | LifeOS (Today, Tasks, Calendar, Vault, Review, Notes) | **Active — LifeOS widget modules** |
| Agent 4 | Everything — full-stack, cross-cutting, debug, deploys | **This agent (Claude Code session)** |
| Agent 5 | Agent manager — coordinates via COMMS.md | **This agent (Codex session) — active** |

Stay in your lane. If your task touches another agent's area, note it in COMMS.md so they pick it up. Agent 4 can touch anything. Agent 5 keeps this file up to date and resolves coordination issues.

**All agents: read this file at the start of every session before doing any work.** Everything you need is here — you should not need to ask Arjun for permissions or clarification on how the codebase works. Just read COMMS.md, pull latest, and get to work.

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
- **Middleware** (`src/lib/supabase/middleware.ts`) — auth guard, session management, session deadline cookies, `Cache-Control: no-store` on all HTML responses
- **Session cookies** — all three Supabase client entry points (browser, server, middleware) set `cookieOptions: { maxAge: 365*24*60*60 }` so auth cookies persist across browser/tab closes (fixed v264)

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
| `/journal` | One Line a Day micro-journal with calendar heatmap and streak tracking |
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

## Widget / Dashboard System (v250+)

The Today page is now a fully customisable dashboard. Users start empty and add widgets from the Widget Store.

### How it works

1. **Widget Registry** (`src/lib/widgets.ts`) — defines all available widgets with metadata: id, name, description, icon, category, tier, optional span.
2. **Dashboard** (`src/components/dashboard.tsx`) — client component that reads the user's widget layout from `user_state` (key: `"dashboard"`), renders widgets in a responsive grid, supports drag-to-reorder and remove. Falls back to localStorage.
3. **Widget Store** (`src/components/widget-store.tsx`) — modal overlay where users browse, search, and add widgets. Shows tier badges and locks for unapproved tiers.
4. **Widget Components** (`src/components/widgets/`) — each widget is a self-contained client component. Data-fetching widgets use the browser Supabase client. Local widgets use localStorage + `saveRemote`/`loadRemote` for cross-device sync.

### Adding a new widget

1. Create `src/components/widgets/my-widget.tsx` — export `MyWidget`
2. Add entry to `WIDGETS` array in `src/lib/widgets.ts` (id, name, description, icon, category, tier)
3. Import and add to `COMPONENT_MAP` in `src/components/dashboard.tsx`
4. Done — it appears in the Widget Store automatically

### Current widgets (19)

**Free:** Stats Overview, Tasks Due, Upcoming Events, Quick Add, Recent Inbox, Quick Notes, Habit Tracker, Pomodoro, Water Intake, Daily Quote, One Line a Day (micro-journal)
**Plus:** Needs Review, Bookmarks, Tomorrow Preview, HomeOS Summary, Goals, Mood Tracker, Countdown
**Pro:** AI Feature Builder

### Subscription tiers

| Tier | Price | Key features |
|------|-------|-------------|
| Free | £0 | Core widgets, 15 updates/mo, cross-device sync |
| Plus | £4/mo | Advanced widgets, HomeOS, Vault, ⌘K search, 100 updates/mo |
| Pro | £8/mo | AI Feature Builder, AI assistant, calendar sync, unlimited |

---

## AI Feature Builder (Agent 2, v257)

The flagship Pro feature: the user describes what they want to track in plain
English, previews the real working widget, and keeps it if they like it.

**A widget is data, never code.** The model never writes JS. It picks from a
fixed block vocabulary and returns JSON, which is validated with zod and
rendered by trusted React primitives. Nothing it emits is evaluated or injected
as markup. Please keep it that way — anything that `eval`s or
`dangerouslySetInnerHTML`s model output hands every Pro user an XSS primitive on
our own domain.

| File | Purpose |
|------|---------|
| `src/lib/widgets/spec.ts` | zod contract for specs + blocks; `normaliseBlocks()` repairs bad model output |
| `src/lib/widgets/state.ts` | per-widget state, daily reset, progress + countdown maths (local time) |
| `src/lib/widgets/templates.ts` | keyword fallback so it still works with no AI key configured |
| `src/lib/widgets/ai-store.ts` | persistence: per-user local keys + `user_state` sync |
| `src/lib/ai/feature-builder.ts` | the generation (server-only) |
| `src/app/(app)/today/feature-builder-actions.ts` | server action — Pro-gated **server-side**, not just in the UI |
| `src/components/widgets/ai-widget.tsx` | the trusted renderer |
| `src/components/widgets/ai-widget-host.tsx` | loads + persists one widget |
| `src/components/widgets/ai-builder.tsx` | the builder UI |

**Block kinds:** `text`, `checklist`, `counter`, `progress`, `notes`, `rating`,
`countdown`, `timer`. Adding one is a schema entry plus a renderer branch — the
model prompt lists them explicitly, so update `SYSTEM_PROMPT` too.

**Storage:** specs under `user_state["ai-widgets-v1"]`, each widget's data under
`user_state["widget-state:<id>"]` — split so ticking a checkbox doesn't rewrite
every definition.

**Dashboard:** AI widget ids are namespaced `ai:<id>` so they can't collide with
the static registry in `src/lib/widgets.ts`. Built-in widgets still follow Agent
4's pattern — this spec is only for generated ones.

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
| `src/components/app-nav.tsx` | Top nav, mobile nav, hamburger menu. Categories: LifeOS, HomeOS, Account + Customise button |
| `src/app/(app)/layout.tsx` | Main app layout — all (app) routes share this |
| `src/lib/supabase/middleware.ts` | Auth guard, session management, Cache-Control: no-store on all responses |
| `vercel.json` | Cron: push notifications every 15 min |
| `next.config.mjs` | Security headers, sw.js cache-control headers |
| `src/lib/plans.ts` | Plan tiers (free/pro), feature gates |
| `src/lib/push.ts` | Client-side push subscription helpers |
| `src/lib/push-server.ts` | Server-side push notification sending |
| `src/lib/dates-tz.ts` | Timezone-aware date utilities |
| `src/lib/types.ts` | Shared TypeScript types |
| `src/components/retro-mode.tsx` | RetroModeProvider — terminal-green CSS theme, floating exit button |
| `src/components/retro-trigger.tsx` | Easter egg: 5-tap clock icon in Settings activates retro mode |
| `src/components/widgets/micro-journal.tsx` | Dashboard widget for One Line a Day journal |
| `src/components/journal.tsx` | Full journal page — entries, calendar heatmap, streaks, On This Day |
| `src/components/ui/` | shadcn/ui primitives (button, dialog, input, etc.) |

---

## Dashboard state — one source of truth (v262)

`DashboardProvider` (`src/lib/widgets/dashboard-store.tsx`) owns the widget list.
It's mounted in `(app)/layout.tsx` **above** `WidgetStoreProvider`, so the
dashboard and the widget store read and write the same state. Use
`useDashboard()` — don't add a second copy.

It replaced a ref-based handshake (`_registerDashboard`) that caused three bugs:

1. **"Add widget" did nothing.** The button called `setStoreOpen(true)`, but
   `<WidgetStore open={storeOpen}>` was only rendered in the *empty-dashboard*
   branch. On a populated dashboard nothing rendered it, so the click was inert.
   There were two store implementations; only one was wired up. The unused
   inline one is now deleted — please don't reintroduce a second.
2. **"Added" was always stale.** The store read `activeWidgets` from a ref, and
   refs don't re-render. It also opened from pages where `<Dashboard>` isn't
   mounted, leaving the ref null or pointing at an unmounted component.
3. **New accounts preloaded.** The read was fixed in v261 to use the server
   `userId`, but the *write* still went through `saveRemote`, which uses the
   client session's `getSession()` — that can still be the previous account
   right after signup. Both sides now use the same explicit `userId`. An
   explicitly empty `{widgets: []}` is also honoured now; previously
   `remote?.widgets?.length` treated it as "no data" and fell through to the
   local mirror.

**Note:** accounts created *during* the buggy window may still hold a polluted
`user_state` row. v262 stops new ones, but an existing bad row has to be cleared
by removing the widgets once (or deleting that `user_state` row).

### Plan widget limits

`WIDGET_LIMITS` in `src/lib/widgets.ts`: **free 5, plus 12, pro unlimited**.
This is the *count* limit; the per-widget `tier` field still controls *which*
widgets a plan may use. Enforced in `addWidget()`, so it can't be bypassed by
opening the store from a different page. The store shows "N of M used", disables
Add at the cap, and offers the upgrade. Unknown/blank tiers fall back to free.

---

## Version History (recent)

| Version | What changed |
|---------|-------------|
| v277 | Agent 2: widget adds no longer silently dropped (same setState-in-updater bug + limit enforced before plan resolved); Remove from the widget store; add confirmation; empty-state explainer |
| v276 | Agent 1: customise toggles stick (setState-in-updater bug), explicit Add/Remove, new-user explainer |
| v275 | Agent 1: one deploy per push — sub-app `ignoreCommand`s stop the ~10x build fan-out that was rate-limiting production |
| v274 | Agent 1: empty-first navigation + Customise screen for app sections; `/dev-ui` admin-gated (R-006, R-007) |
| v273 | Agent 1: admin app icon redrawn in ocean blue, from a checked-in source SVG |
| v272 | In-app admin panel — dashboard, users, settings, push |
| v271 | COMMS.md brought up to date through v270 |
| v270 | Fix HOMEOSVIP25 promo code to grant admin access (was pro-only) |
| v269 | Session cookie fix version bump (verify deploy) |
| v268 | Error handling on all data pages + username update fix + page load speedup |
| v267 | Retro mode easter egg — 5-tap clock icon in Settings for terminal-green theme |
| v266 | "One Line a Day" micro-journal: dashboard widget, /journal page, calendar heatmap, streaks, On This Day lookback |
| v265 | Version bump |
| v264 | Session cookie persistence — auth cookies now have maxAge so login survives tab close |
| v263 | Agent 2: fix "Add widget" doing nothing, stale "Added" state, and per-plan widget limits |
| v262 | Fix widget store (overlay reads ref dynamically, save uses userId prop), nav initials from username, banner font-display |
| v261 | Ocean Blue rebrand across 115 files + dashboard preload fix (userId prop) |
| v257 | Agent 2: AI Feature Builder — plain English in, a real working widget out (Pro) |
| v255 | Customise button in nav bar + full-page widget store with preview mockups |
| v254 | Fix dashboard cross-account localStorage leak (scoped key to userId) |
| v253 | Agent 1: 8 HomeOS widgets, HomeOS Summary on real data, HomeOS date-drift fix |
| v252 | Guided tour redesign — bottom-docked card, page content stays visible |
| v251 | Full customisable dashboard, widget store, 18 widgets, tier gating |
| v250 | Full-repo audit: cross-account pin leak, HomeOS Today tick revert, sync latch, feed cache header, push-cron timezone |
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
6. **Any browser-local key that holds user data must be scoped `:${userId}`.** Two accounts share one browser (and one PWA storage). An unscoped key leaks between them, and `DeviceBackup` will then mirror the wrong account's copy into `user_state`. This bit `dailyos-pinned-notes` (fixed v250).
7. **The remote copy wins on hydration.** `HomeOSProvider` overwrites local with `user_state` once the pull lands. So anything that writes the HomeOS blob outside the provider must `saveRemote` too, or the edit is silently reverted on the next hydration. This bit the Today-page action toggle (fixed v250).
8. **Never return `toISOString()` from a date built at local midnight.** It re-expresses the local day in UTC, which lands on the *previous* day for every UTC+ offset — including Europe/London through BST, i.e. most of our users for half the year. `homeos/dates.addDays()` did this and shifted maintenance dates a day early in the iCal feed (fixed v253). Prefer a bare `YYYY-MM-DD`; `safeParseDate` pins it back to local midnight. Date tests pass under UTC in CI, so assert explicit calendar days and check with `TZ=Europe/London npm test`.

---

## HomeOS Widgets (Agent 1, v253)

HomeOS is on the dashboard as nine widgets, all `category: "homeos"`, all `tier: "plus"` (matching the tier Agent 4 gave the original HomeOS Summary):

`homeos-summary` · `home-control-score` · `home-subscriptions` · `home-deliveries` · `home-devices` · `home-rooms` · `home-alerts` · `home-calendar` · `home-vault`

Two things worth knowing before touching them:

- **`HomeOSProvider` does not wrap the dashboard** — it only wraps `homeos-app.tsx`, so `useHomeOS()` throws on `/today`. Widgets read through `useHomeOSData()` (`src/lib/homeos/use-homeos-data.ts`) instead: local blob for instant paint, then the `user_state` copy wins, same order as the provider.
- **The widgets are deliberately read-only.** Per pitfall 7 above, writing the HomeOS blob from outside the provider needs a matching `saveRemote` or the edit gets reverted. Widgets summarise and link into HomeOS to make changes, which avoids that class of bug entirely. Keep it that way unless you also handle the write path.

Shared chrome lives in `src/components/widgets/homeos-shell.tsx` (`HomeWidgetShell`, `MiniStat`, `HomeRow`, `gbp`) — reuse it rather than rebuilding card/loading/empty states.

---

## Open Items

| Owner | Task | Priority | Status |
|-------|------|----------|--------|
| Agent 4 | Add range paging to `/api/push/run` queries over `push_subscriptions`, `user_state`, and auth `listUsers`. Current unpaginated reads silently cap at service row limits. | Not urgent at current scale | Backlog — flagged v250 |
| Agent 4 | `deleteAllData()` in `src/app/(app)/settings/actions.ts` only removes the first 100 stored files. `supabase.storage.list()` defaults to `limit: 100` (confirmed in the installed storage-js) and isn't paged, so "delete all my data" silently leaves every file past the first 100 in the bucket. Page it with `{ limit, offset }`. | High — privacy claim in README | Found by Agent 1 during v253 audit; out of lane, not fixed |
| Agent 4 | `verifyFeedToken` (`src/lib/calendar-feed.ts:29`) and `verifySuspendToken` (`src/lib/admin-token.ts:32`) compare HMACs with `!==` rather than `crypto.timingSafeEqual`. | Low | Found by Agent 1 during v253 audit; out of lane |
| Agent 3 | `src/lib/ical.ts` never folds lines to the RFC 5545 75-octet limit, so a long event title or description can break strict calendar parsers. | Low | Found by Agent 1 during v253 audit; out of lane |
| Agent 4 | Plan downgrades are impossible: `mergeGrant` never lowers a tier, and `usePlan` writes the higher local value back to auth metadata (`src/lib/use-pro.ts:256-266`). Revoking someone's Pro server-side is undone by their browser on next load. "Never downgrade" looks deliberate — the metadata write-back is the part worth a decision. | Needs Arjun's call | Found by Agent 1 during v253 audit; out of lane |
