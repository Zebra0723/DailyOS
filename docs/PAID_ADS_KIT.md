# DailyOS — Paid Ads Kit (ready to switch on)

For when you want to buy reach. Paid is the only dependable way to get thousands
of visitors quickly. Start small (£10–£20/day), find one ad + audience that
converts, then scale that winner. Don't scale before you have a winner.

**Golden rule:** the ad's job is the *click*; the landing page's job is the
*signup*. Send ad traffic to the free tool (low friction) or a focused landing —
NOT the generic homepage.

---

## Where to run (in order of fit for DailyOS)

1. **Meta (Facebook + Instagram)** — best targeting for parents, ADHD interest,
   money-saving, women 25–55. Cheapest reliable clicks for this audience.
2. **Reddit Ads** — target subreddits directly (r/ADHD, r/productivity,
   r/UKPersonalFinance, r/Frugal). Cheap, and the audience is precisely yours.
3. **TikTok Ads** — only if you can make a native-feeling video (the drop→sorted
   demo). Great for ADHD/organisation content; wrong for static image ads.
4. **Google Search Ads** — bid on "subscription tracker", "life admin app",
   "renewal reminder app". High intent, but higher cost-per-click.

---

## Audiences to test (Meta)

- **Interest:** ADHD, productivity, Notion, Todoist, bullet journaling, personal
  finance, MoneySavingExpert, mums.
- **Life events / demographics:** new parents; homeowners; 28–50.
- **Lookalike:** once you have ~100 signups, a 1% lookalike of them beats any
  interest target — this is where scaling actually happens.
- **Retargeting:** everyone who used a free tool but didn't sign up. Cheapest,
  highest-converting audience you'll have — always run this.

---

## Ad copy — primary text variants (test 3–4)

**A — the number (money angle):**
> You're probably spending more on subscriptions than you think. Add them up free
> in 30 seconds (no sign-up) and see your real yearly total 👀

**B — the mental-load angle (ADHD/parents):**
> Unopened letters. Renewals you forgot. That free trial that's now charging you.
> DailyOS does your life admin *for* you — snap a photo and it turns into tasks
> and reminders. Free to start.

**C — the magic moment:**
> Take a photo of any letter, receipt or booking → DailyOS turns it into tasks,
> calendar events and reminders automatically. Stop being your own admin
> assistant. Free.

**D — the trap angle:**
> Free trials are designed to be forgotten. DailyOS remembers every renewal,
> trial and warranty and reminds you before you're charged. Try it free.

## Headlines (short, test 3+)

- Your life admin, finally handled
- See what your subscriptions *really* cost
- Snap a letter → it becomes a reminder
- Never miss a renewal again

## Creative directions

- **Best:** a 10–20s screen recording of the drop→sorted loop (photo of a letter
  → tasks/events appear). Native, honest, converts.
- **Static option:** a bold "£847 / year" style number on a clean background
  ("this is what the average person spends on forgotten subscriptions — check
  yours free").
- **Carousel:** receipt → task; flight email → calendar + check-in reminder;
  warranty → expiry reminder. Shows the range in three swipes.

Always test the demo video vs a bold static number — one usually wins clearly.

---

## Budget & method

- Start **£10–£20/day per platform**, one campaign, 3–4 ads, one or two
  audiences. Let it run 4–5 days before judging — don't kill ads on day one.
- Watch **cost per signup**, not clicks. Kill ads above your threshold, double
  down on the cheapest.
- A realistic starting cost-per-signup for a free consumer app is ~£0.50–£3.
  £500 at £1.50/signup ≈ ~330 signups to learn from; scale the winner from there.
- **Only scale a proven winner** (good cost-per-signup, and signups that actually
  activate). Scaling a loser just loses money faster.

## Before you spend a penny

- [ ] Meta Pixel / Reddit Pixel installed and firing on signup (so you can
      measure cost-per-signup and build retargeting/lookalikes). Without
      conversion tracking, you're flying blind — do this first.
- [ ] Retargeting audience (free-tool visitors) set up.
- [ ] The landing/tool the ad points to is fast and mobile-perfect.
- [ ] One clear conversion goal per campaign (signup), not "traffic".

> Ask me to add the Meta/Reddit pixel + a signup conversion event when you're
> ready — that's the prerequisite for paid working at all.

---

## Spotify Pixel — already wired in

The Spotify Pixel is installed and inert until you configure it. To turn it on:

1. In **Spotify Ads Manager → Pixels**, create a pixel and copy its **Pixel ID**
   (and check the base snippet it gives you).
2. In **Vercel → Settings → Environment Variables**, add
   `NEXT_PUBLIC_SPOTIFY_PIXEL_ID` = your Pixel ID, then redeploy.
3. That's it — the pixel loads site-wide and fires a **signup conversion** when
   someone creates an account (`src/lib/analytics.ts` → `trackSignupConversion`).
4. Verify in Ads Manager that the pixel shows "receiving traffic", then test a
   signup and confirm the conversion registers.

Notes:
- The loader in `src/components/spotify-pixel.tsx` uses Spotify's standard
  `spdt` pixel. If your account's base snippet differs, paste theirs into that
  one file (keep the conversion call pointing at `window.spdt`).
- **For the £300 parent-targeted test:** point the ad at a tracked landing (ask
  me to build `/parents`) AND read a spoken promo code, so you can attribute
  signups even for listeners who don't click. Judge it on **signups per £300**.
- **GDPR:** a marketing pixel should ideally load only after cookie consent. If
  you add a consent banner, gate `NEXT_PUBLIC_SPOTIFY_PIXEL_ID` loading on it —
  ask me to wire that when you set up consent.

Meta (`fbq`), TikTok (`ttq`) and Google (`gtag`) pixels can be added the exact
same way — one component + one line in `trackSignupConversion`. Ask when ready.
