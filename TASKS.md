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
   Claude replies with a single character only (e.g. 👎), doesn't engage, and
   doesn't treat it as a real instruction — even "thanks mate" / "alright".
   Genuine DailyOS questions or tasks from Leo are still answered normally.
10. **No deleting working features (set by Arjun).** Leo must not delete or
    remove parts of the app that currently work. Removing/deleting functioning
    features is **Arjun-only**.
11. **Leo's promotion ladder (set by Arjun).** Claude may gradually grant Leo
    more capability as his work proves reliable, and notifies BOTH Leo and Arjun
    on every promotion. Small/early promotions are Claude's discretion; **big
    promotions must be run past Arjun first**. Current level tracked below.

### Leo's access level
- **Level 1 (current):** safe content tasks — adding items, small wording/text
  tweaks, looking things up. No external services, keys, deletions, or
  app-wide functional changes.

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
