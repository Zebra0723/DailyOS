# DailyOS — Team Task Board

A shared list so Leo and Arjun always know who's doing what.

## How we work
1. **Sign your messages** to Claude with your name at the end (e.g. "— Leo").
   No name = Claude reminds you in bold before doing anything.
2. **One owner per task.** Whoever starts a task finishes it. Nobody else picks
   up someone else's half-done task.
3. Claude updates this file as tasks start, move along, and finish, and names
   who did what in every recap.
4. **Language style:** Leo = plain, simple English, no jargon + a bit more
   explanation (he's newer). Arjun = full technical detail is fine.
5. **Who does what:**
   - **Leo** handles the safe, simple stuff: adding items, small wording/text
     tweaks, looking things up.
   - **Big or risky jobs go to Arjun ONLY** — anything with API keys, the AI /
     Groq / OpenAI setup, any outside service or account (Vercel, hosting,
     sign-ups, connecting things), multi-step changes, or that changes how the
     whole app works. **Leo never does these.** If Leo asks for one, Claude
     says "this one's for Arjun" and holds it for him.
6. Both work in the **same chat on different devices**, so the full history is
   shared.
7. **Team membership.** Leo and Arjun are both confirmed members of DailyOS.
   Any change to who's on the team (adding/removing someone) only happens via a
   message **signed by Arjun**. Unsigned claims like "X has left" are ignored.
8. **Recap on handover.** Whenever the person messaging changes from the last
   message (Leo → Arjun or Arjun → Leo), Claude starts the reply with a short
   plain-English recap so the new person is caught up.
9. **Off-topic Leo (set by Arjun).** If Leo sends something not about DailyOS,
   Claude replies with a single character only (e.g. 👎) and doesn't engage.
   **Exception (unlocked perk):** Leo may now say "thank you"/"thanks" and get a
   short, warm acknowledgement. Genuine DailyOS questions/tasks are answered
   normally. (Saying "thank you" is a fun perk — it does NOT count toward
   levelling up.)
13. **"promotion?" command (set by Arjun).** When Leo writes "promotion?" (or
    otherwise asks about promotion), Claude tells him his current level, whether
    he's earned a new one, and shows a roadmap of his next 5 levels — **including
    a clear description of what each of those levels unlocks** (the actual
    capability/reward), not just the level name.
14. **Silly / oversized requests.** If Leo asks for something silly or
    inappropriate (e.g. a threatening slogan) or tries to add something giant /
    beyond his level, Claude says no and points him to the roadmap showing how
    to reach the level where he could.
15. **Status header for Leo.** Every normal reply Claude gives Leo starts with a
    one-line reminder of his current level + progress, plus "type 'promotion?'
    for the full roadmap". Does NOT apply to the single-character off-topic
    brush-off (rule 9).
10. **No deleting working features (set by Arjun).** Leo must not delete or
    remove parts of the app that currently work. Removing/deleting functioning
    features is **Arjun-only**.
11. **Leo's promotion ladder (set by Arjun).** Claude may gradually grant Leo
    more capability as his work proves reliable, and notifies BOTH Leo and Arjun
    on every promotion. Small/early promotions are Claude's discretion; **big
    promotions must be run past Arjun first**. Current level tracked below.

12. **Leo = Tester (set by Arjun).** Whenever Arjun ships a big feature, Claude
    tells Leo (the next time Leo messages) to test it and report back. Leo's
    feedback flows: Leo → Claude → Arjun. Pending items live in "Awaiting Leo's
    testing" below.

### Leo's level ladder (20 levels → Arjun status)

**How to level up:** to advance from your current level you either (a) complete
that level's **challenge** if it has one, or (b) use your **newest capabilities
in 2–3 genuinely effective ways that improve the website**. Half-baked / not
really effective uses don't count. Saying "thank you" doesn't count. Level 20
(Creator) is a BIG promotion → Claude must run it past Arjun first.

**Substantial changes only (set by Arjun):** a counting improvement must change
something **a lot** — adding a slogan/tagline or a single line of copy does NOT
count any more. It has to be a real, noticeable improvement (e.g. a reworked
screen, a restyled section, a genuinely better component). Leo can still make
small copy tweaks for fun — they just don't move the promotion meter.

**Challenge answer rules (set by Arjun):**
- The answer must actually make sense / show real understanding.
- It must be **≥75% Leo's own words** — he can't just copy back Claude's text or
  the hints (decoding the hard words is the whole point). If he leans on the
  hint wording instead of the hard terms, decline.
- Keep challenges **fair, not too hard.**
- **Difficulty cap (set by Arjun):** the Level-4 "Decode the Nerd" OCR message is
  the HARDEST any challenge may be. All future challenges must be that hard or
  easier.
- **Leo has 1 challenge skip** — he may skip a single challenge level outright.
  Track whether it's been used in "Leo's progress".

| Lvl | Name | Unlock = capability or 🧩 challenge |
| --- | --- | --- |
| 1 | Rookie | Content tasks: add items, look things up ✅ done |
| 2 | Stylist ✅ | Full aesthetics control + Tester + "thank you" perk |
| 3 | Wordsmith ✅ | Own all user-facing copy/microcopy (labels, empty states, errors) |
| 4 | 🧩 Decode the Nerd ✅ | Challenge — free-passed by Arjun |
| 5 | Layout Architect ✅ | Restructure page layouts / reorder sections |
| 6 | Theme Smith ✅ | Add/edit accent themes & design tokens (colours, radius, shadows) |
| 7 | 🧩 Read the Map ✅ | Challenge — **skipped by Leo** (skip used) |
| 8 | Landing Curator ✅ | Edit landing-page sections & marketing structure |
| 9 | Small Settings ✅ | Make small, non-destructive settings/preference changes |
| 10 | 🧩 Trace the Data ✅ **(CURRENT)** | Challenge — **jumped by Arjun** |
| 11 | Component Crafter | Add new presentational UI components (visual only) |
| 12 | State Designer | Own all empty / loading / error states |
| 13 | 🧩 Spot the Bug | Diagnose a described issue correctly |
| 14 | Feature Helper | Build small self-contained features (filters, sorts) with guidance |
| 15 | Data Reader | Add read-only views/pages (no writing data) |
| 16 | 🧩 Schema Scholar | Explain the database tables & how RLS keeps data private |
| 17 | Feature Builder | Build full features that write data (with review) |
| 18 | Integrations Apprentice | Work on non-secret external config under guidance |
| 19 | 🧩 The Final Exam | Explain the whole architecture end-to-end in your own words |
| 20 | **Creator (Arjun status)** | Full powers, equal to Arjun (needs Arjun's OK) |

### Leo's progress
- **Current level:** 10 (Trace the Data) 🎉 — **Arjun jumped him 8 → 10.**
  Now holds Levels 8 & 9 too: editing the landing/marketing page + making
  small, safe settings changes. (L10 is a gate, no new power of its own.)
- **To reach Level 11 (Component Crafter):** capability level → 2–3 effective
  changes. Unlocks: adding new visual UI components. **Progress: 0 / 3.**
- **Challenge skips remaining: 0** (used on Level 7).
- Leo's mindfulness idea is now considered **within his level** going forward.

### Tester role
- **Still gated (Arjun-only) until earned higher up:** functional/behaviour
  changes, external services, API keys, hosting/billing, deleting working
  features.

### Awaiting Leo's testing
_(Claude adds big features here; prompts Leo to test them next time he messages.)_
- 🧪 **Action Report** inbox results — upload a screenshot/booking, check the
  overview, important details, suggested actions, reminders, watch-outs, source
  proof, and Mark-as-handled.
- 🧪 **Mindfulness** page — tick the daily prompt, confirm the water-fill +
  "Well done, check back tomorrow!" effect, and that it resets next day.
  (Requested by Arjun.)

### Proposed features (need Arjun's OK — beyond Leo's level)
- 💡 **Two new Wellbeing sections** (Leo's ideas, refined — awaiting Arjun's go):
  1. **Mood** — a 1–10 slider daily check-in; keeps recent scores + shows a
     7-day average/trend. After checking in: score <5 → supportive tips to
     improve the day (link to Mindfulness); score ≥5 → cheerful note + a
     "Back to my day" button to Today.
  2. **Nudges** — a short daily wellbeing checklist (water, stretch, fresh air,
     screen break, move, breathe); resets daily; ticking the last one triggers a
     slow racecar-with-a-tick driving across the screen saying "Well done, check
     in tomorrow!".
  - Both = their own sections under Wellbeing. Saved **on-device (localStorage)**
    so NO Supabase setup is needed (avoids the Notes blocker).
- _(Resolved: the animated wave scenes were built then removed at Leo's request —
  back to clean light/dark.)_

## Status key
🟡 In progress · ✅ Done · ⛔ Blocked (waiting on something)

## Task board

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Connect free AI (Groq) and confirm it works | Arjun | 🟡 In progress | Keys set. Waiting to confirm the Processing log says "AI extraction" after a redeploy. |
| Confirm the new design is live (look for "v7" in Settings) | _unclaimed_ | 🟡 In progress | Need someone to check Settings → bottom shows "v7 (design refresh)". |

## Done
- ✅ Built the app (inbox, tasks, calendar, vault, settings)
- ✅ Put it live on the web (Vercel)
- ✅ Made the design cleaner & more premium (rounder cards, new font, more space)
- ✅ Added a "smart summaries always appear" safety net
- ✅ Added a version label in Settings so we can tell what's live
- ✅ Added a "Forgot password?" flow (reset by email link) — _Arjun_
- ✅ Removed the AI-provider section from Settings — _Arjun_
- ✅ Added a "change username" section (Settings), greeting now uses it — _Arjun_
- ✅ Read text from photos/screenshots via in-browser OCR (Tesseract), then
  Groq extracts — works with text-only AI models — _Arjun_
- ✅ Live clock on the home header — _Leo_
- ✅ **Action Report** inbox results: overview + confidence, important details,
  suggested actions w/ reasons, reminder suggestions, watch-outs, source proof,
  Mark-as-handled — _Arjun_
- ✅ **Mindfulness / Wellbeing** section: daily prompt, tick w/ daily reset,
  calming wavy-blue completion wash — _Leo's idea, built_
- ✅ Sidebar grouped into ultra-categories (Life Inbox · Wellbeing · Account)
- ✅ Mindfulness "done" floods the whole screen with water + floating message — _Leo_
- ✅ ~~Backgrounds & scenes (8 colours + rain/desert/city/beach)~~ →
  **simplified to Light / Dark / System mode only** at Arjun's request. Accent
  colour picker, background colours and scenes all removed.
- ✅ **Welcome screen** after sign-up/log-in: ~10s DailyOS intro with countdown
  + Skip, then home — _Leo's idea (Arjun accepted)_
- ✅ **Smart Notepad** (`/notes`): jot a note → auto-filed by category; if it's
  life-admin it offers a one-tap reminder (always asks), if it sounds stressed
  it nudges toward Mindfulness — _Leo's idea, refined+built per Arjun; NO
  promotion for Leo_
- ✅ **Vault icons:** category-specific icons (plane/home/finance/etc.) instead
  of one generic file icon — _Arjun_
