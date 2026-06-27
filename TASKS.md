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

| Lvl | Name | Unlock = capability or 🧩 challenge |
| --- | --- | --- |
| 1 | Rookie | Content tasks: add items, look things up ✅ done |
| 2 | Stylist ✅ | Full aesthetics control + Tester + "thank you" perk |
| 3 | **Wordsmith (CURRENT)** | Own all user-facing copy/microcopy (labels, empty states, errors) |
| 4 | 🧩 Decode the Nerd | Correctly explain a techie message Claude gives you |
| 5 | Layout Architect | Restructure page layouts / reorder sections |
| 6 | Theme Smith | Add/edit accent themes & design tokens (colours, radius, shadows) |
| 7 | 🧩 Read the Map | Explain the app's folder structure / how a page renders |
| 8 | Landing Curator | Edit landing-page sections & marketing structure |
| 9 | Small Settings | Make small, non-destructive settings/preference changes |
| 10 | 🧩 Trace the Data | Explain how an item flows inbox → review → tasks/calendar/vault |
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
- **Current level:** 3 (Wordsmith) 🎉 — promoted after 3 strong visual changes:
  ✅ login logo move/scale-up; ✅ branded loading screen; ✅ "Recently added"
  tagline on the home screen.
- **To reach Level 4 (🧩 Decode the Nerd):** it's a CHALLENGE level — Leo must
  correctly understand/explain a techie message Claude sets him (no "use it 3×"
  needed for challenge levels).

### Tester role
- **Still gated (Arjun-only) until earned higher up:** functional/behaviour
  changes, external services, API keys, hosting/billing, deleting working
  features.

### Awaiting Leo's testing
_(Claude adds big features here; prompts Leo to test them next time he messages.)_
- (none queued right now)

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
