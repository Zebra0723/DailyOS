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

## Status key
🟡 In progress · ✅ Done · ⛔ Blocked (waiting on something)

## Task board

| Task | Owner | Status | Notes |
| --- | --- | --- | --- |
| Connect free AI (Groq) and confirm it works | _unclaimed_ | 🟡 In progress | Whoever set up Groq: sign your next message and I'll put your name here. Waiting to confirm the Processing log says "AI extraction". |
| Confirm the new design is live (look for "v7" in Settings) | _unclaimed_ | 🟡 In progress | Need someone to check Settings → bottom shows "v7 (design refresh)". |

## Done
- ✅ Built the app (inbox, tasks, calendar, vault, settings)
- ✅ Put it live on the web (Vercel)
- ✅ Made the design cleaner & more premium (rounder cards, new font, more space)
- ✅ Added a "smart summaries always appear" safety net
- ✅ Added a version label in Settings so we can tell what's live
