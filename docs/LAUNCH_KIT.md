# DailyOS Launch Kit

Ready-to-use copy and a step-by-step plan to launch DailyOS and pull in an
audience from scratch. Nothing here needs an existing following.

Core rule: **lead with the magic moment** — *snap a photo of a letter/receipt →
it becomes tasks, calendar events and a searchable vault.* Everything else is
detail.

---

## 0. Positioning one-liners (reuse everywhere)

- **Tagline:** Your life admin, finally handled.
- **One sentence:** Drop in receipts, letters, bookings and screenshots — DailyOS
  reads them and sorts everything into tasks, calendar events and a searchable
  vault.
- **For ADHD/overwhelm audiences:** The app that does your life admin *for* you,
  so the pile of letters and half-remembered renewals stops living in your head.
- **For the money-conscious:** See every subscription and renewal in one place,
  and never pay for something you forgot to cancel again.

---

## 1. The traffic engine (do this first — it needs no audience)

You already have two free, no-sign-up tools built to rank on Google and funnel
to signup:

- `/tools/subscription-tracker` — "how much do I spend on subscriptions"
- `/tools/renewal-tracker` — "renewal reminder / warranty tracker / free trial reminder"

**These are your most shareable assets** — people share free tools far more than
they share apps. Steps:

1. **Google Search Console** → add `dailyos.uk`, verify, submit `sitemap.xml`.
   Without this, Google is slow to find the tools.
2. **Seed the tools** (not the app) in the communities below.
3. Give SEO 4–12 weeks; it compounds.

---

## 2. Product Hunt

**Name:** DailyOS
**Tagline (max 60 chars):** Your life admin, finally handled
**Alt taglines:**
- Snap a letter, it becomes tasks and reminders
- The AI that does your life admin for you

**Description:**
> DailyOS turns the chaos of life admin into a calm, sorted system. Forward an
> email, paste text, or snap a photo of a receipt, letter or booking — DailyOS
> reads it and pulls out the tasks, dates and details, then files everything into
> your calendar, task list and a searchable vault. It tracks your subscriptions,
> renewals, warranties and deliveries, reminds you before things are due, and has
> an AI assistant that knows everything you've saved. Free to start, works on your
> phone, private by design.

**First comment (as maker):**
> Hi Product Hunt 👋
>
> I built DailyOS because my life admin lived in a mess of screenshots, unopened
> letters and half-remembered renewal dates. Existing to-do apps assume you'll do
> the typing. I wanted something that reads the receipt/letter/email itself and
> just sorts it.
>
> So DailyOS's core loop is: drop *anything* in → it extracts the tasks, dates and
> details → you approve → it's in your calendar, tasks and vault, with reminders
> before anything's due. It also runs the "operations" side of a home —
> subscriptions, renewals, warranties, deliveries — and has an AI assistant that
> can actually act on your stuff.
>
> It's free to start. I'd genuinely love feedback on the drop-and-sort flow —
> what did you throw at it and did it get it right?
>
> Two free tools if you don't want to sign up yet: [subscription tracker] and
> [renewal tracker].

**Tips:** launch 00:01 PT; line up 5–10 people to comment (not just upvote —
comments matter); reply to every comment fast; add a 30s demo GIF of the drop→sorted loop as the first gallery image.

---

## 3. Show HN (Hacker News)

**Title:** `Show HN: DailyOS – snap a letter or receipt and it becomes tasks and reminders`

**Body:**
> I got tired of my life admin living as a pile of screenshots and unopened post,
> so I built DailyOS. You forward an email or photograph a letter/receipt/booking,
> and it extracts the tasks, dates and key details and files them into a calendar,
> task list and searchable vault — nothing is added until you approve it.
>
> Stack: Next.js 14 (App Router) PWA, Supabase (Postgres + RLS + storage), an
> OpenAI-compatible model layer for the extraction, client-side OCR for images so
> even text-only models work. It's offline-capable via a service worker and
> installable to the home screen.
>
> Free to start. Happy to go into the extraction/repair pipeline, the RLS setup,
> or the PWA/service-worker deploy-safety stuff in the comments.
>
> There are also two no-login tools if you want to poke without an account:
> a subscription cost tracker and a renewal/warranty tracker.

**Tips:** post Tue–Thu ~8–10am ET; be present in comments for the first 2 hours;
HN rewards technical honesty and hates marketing language — keep it plain.

---

## 4. Reddit

Reddit is your single best free channel — but it punishes anything that smells
like an ad. Rule: **be genuinely helpful, share the free TOOL (not the app),
disclose you made it.** Read each subreddit's self-promo rules first, and build
a little comment karma before posting.

### r/UKPersonalFinance / r/Frugal / r/UKPersonalFinanceOver30
Post the **subscription tracker**.
> **Title:** I made a free tool to see what you're *actually* spending on subscriptions (no sign-up)
>
> I kept underestimating my subscriptions, so I built a little free tool that adds
> them up into one monthly + yearly figure and flags the priciest. No account, no
> card — it just runs in your browser. Sharing in case it's useful. (I built it;
> it's the free tool from a life-admin app I'm working on, but the tracker itself
> is free and standalone.)

### r/ADHD / r/adhdwomen
Post the **app**, but framed as personal, not promotional. (Check rules — some
require a flair or mod approval for tools.)
> **Title:** Built an app that does the "life admin" my brain refuses to — snap a letter and it becomes tasks/reminders
>
> The executive-function tax on life admin (opening post, noting renewal dates,
> turning a school letter into a calendar entry) was destroying me. I made a thing
> where you just photograph the letter/receipt/email and it pulls out the tasks and
> dates and reminds you before they're due. Not trying to spam — happy to give
> free access to anyone here who wants to try it and tell me where it falls short.

### r/productivity / r/organization
> **Title:** The problem with to-do apps: they still make *you* do the data entry
>
> Started a discussion + mention: most tools assume you'll type everything in. I
> wanted one that reads the receipt/letter itself. Ask what people currently use to
> capture the physical/PDF side of life admin, then mention DailyOS as what I built.

**General Reddit tips:** one subreddit per day (not a blast), respond to every
comment, never drop the same copy-paste twice, lead with the helpful thing.

---

## 5. X / Twitter launch thread

1/ I was drowning in life admin — screenshots, unopened letters, renewal dates I
only remembered *after* being charged. So I built DailyOS. 🧵

2/ The idea: stop making you type. Snap a photo of a letter, receipt or booking —
or forward an email — and it reads it and turns it into tasks, calendar events
and a searchable vault. [demo GIF]

3/ It also runs the ops side of a home: subscriptions, renewals, warranties,
deliveries — with reminders before anything's due.

4/ And there's an assistant that actually knows your stuff — ask "what's on this
week?" and it reads your tasks, events and notes to answer.

5/ Free to start, works on your phone, private by design (row-level security,
private files, one-tap delete-everything).

6/ Two free tools if you just want to poke without signing up:
• subscription cost tracker
• renewal/warranty tracker
Links 👇 — would love your feedback on the drop→sorted flow.

**Tip:** the demo GIF in tweet 2 is the whole thing. Pin the thread.

---

## 6. Facebook groups (underrated, huge)

Parenting groups, ADHD groups, "budgeting UK", "money saving" groups. Share the
**free tool** with a genuine note, following each group's self-promo day/rules:
> Made a free no-sign-up tool to see what you're really spending on subscriptions
> each year — sharing in case it helps anyone else do a clear-out. [link]

---

## 7. Directories (submit once, lasting backlinks + trickle traffic)

Product Hunt · BetaList · Indie Hackers (Products) · SaaSHub · AlternativeTo ·
There's An AI For That · Futurepedia · Uneed · Fazier · Startup Stash ·
SaaS Directory · Toolify · Peerlist. Submit the same tagline + description each
time; the backlinks help SEO even if traffic is small.

---

## 8. Micro-influencers / newsletters (cheap or free)

Don't chase big accounts. DM small ADHD coaches, "organised home" / productivity
Instagram & TikTok creators, and niche newsletters. Offer free lifetime access in
exchange for an honest look. One creator whose audience *is* your audience beats
a big generic shoutout.

---

## 9. Launch-day checklist

**Before:**
- [ ] Google Search Console set up, sitemap submitted
- [ ] 30s demo GIF/video of the drop→sorted loop (this is every post's hero)
- [ ] Both free tools live and shared once each to warm them up
- [ ] Signup tested end-to-end on mobile
- [ ] 5–10 friends briefed to comment (not just upvote) on PH launch morning

**Launch day:**
- [ ] Product Hunt live 00:01 PT + maker first comment
- [ ] Show HN posted (Tue–Thu morning ET)
- [ ] X thread posted + pinned
- [ ] 1 Reddit post (highest-fit subreddit), tool-first
- [ ] Reply to every comment within minutes for the first few hours

**Week of:**
- [ ] One Reddit / Facebook community per day (spread out, never blast)
- [ ] Submit to 3–4 directories per day
- [ ] DM 5 micro-creators

**Ongoing:**
- [ ] Watch Search Console for which tool keywords land; build the next free tool
      around the best one
- [ ] Turn every happy user into a referral via the built-in reward ladder

---

## 10. What NOT to do

- Don't spend early effort on organic TikTok/IG from zero — it rarely pays off
  fast. Free tools + Reddit + SEO compound better for a solo/tiny team.
- Don't post the same copy to five subreddits in a day — that's how you get
  shadow-banned.
- Don't lead with features. Lead with the one visible magic moment.
