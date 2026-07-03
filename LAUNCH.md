# DailyOS — path to launch

A practical checklist to take DailyOS from "working MVP" to "ready to charge
money and market." Items are tagged **[you]** (needs an account/secret only you
can create) or **[code]** (I can build it in the repo).

The product itself is feature-complete. What's left is commercial plumbing.

---

## 1. Domain & email

- **[you] Buy the domain** (e.g. `dailyos.app`). Cloudflare Registrar is cheap
  and includes free email forwarding.
- **[you] Point Vercel at it** — add the domain in Vercel → Project → Domains,
  and set `NEXT_PUBLIC_SITE_URL` to `https://dailyos.app`.
- **[you] Email forwarding** — forward `support@dailyos.app` to your inbox so
  the address on the legal pages is real (receive-only, free).
- **[you] (optional) A real mailbox** — Zoho (free tier) or Google Workspace
  (~£5/mo) if you want to *send* from `support@`.
- **[you] Transactional email** — create a **Resend** (or Postmark) account and
  set it as the custom SMTP in Supabase → Auth → SMTP, so signup/reset emails
  come from your domain and don't land in spam. This also helps the slow/flaky
  signup experience.

Buying a domain does **not** include email — forwarding/mailbox/transactional
are three separate things (see above).

## 2. Turn on real AI

- **[you]** Get an API key from an OpenAI-compatible provider (OpenAI, Groq…)
  and add `AI_PROVIDER_API_KEY`, `AI_PROVIDER_BASE_URL`, `AI_MODEL` to Vercel
  env vars, then redeploy. Without this the AI features use built-in fallbacks.
  This is the single biggest quality jump.

## 3. Payments (Stripe)

- **[you]** Create a Stripe account; add **Plus** and **Pro** products with
  monthly + annual prices; copy the secret key, publishable key and webhook
  signing secret.
- **[code]** `supabase/migrations/0002_subscriptions.sql` is ready to run — it
  adds a `subscriptions` table (plan, status, Stripe IDs, admin) with RLS.
- **[code]** When you've got Stripe keys, I'll add: the Stripe SDK, a
  `/checkout` server action, a `/api/stripe/webhook` route that writes to that
  table, and switch the plan gate to read status **from the server** instead of
  localStorage (this also fixes cross-device plans).
- **[you]** Paste the Stripe keys into Vercel env vars and set the webhook URL
  in the Stripe dashboard.

Order: run the migration → I wire the code → you add keys. Then it's live.

## 4. Cross-device sync (recommended before scale)

Today, HomeOS data, Interests, and plan status live in the browser's
localStorage, so they don't follow a user across devices. **[code]** Moving
these to Supabase tables (same RLS pattern as the rest of the app) makes the
product feel "real." The subscriptions table above is the first piece.

## 5. Before you flip it public

- **[code]** Remove/hide the **owner-unlock** link on the paywall so it's
  actually enforced for the public.
- **[you + code]** Add error monitoring (Sentry) — needs your account, I wire
  it in.
- **[you]** Make sure `support@dailyos.app` receives mail.

## 6. Marketing readiness

Already shipped **[code]**:
- Installable PWA (Add to Home Screen) + app icons.
- `robots.txt`, `sitemap.xml`, and a branded social-share image
  (`/opengraph-image`) so shared links preview well.
- Privacy Policy & Terms pages.

Still to do:
- **[you]** A real domain (see §1) — looks far more credible than `*.vercel.app`.
- **[you + code]** Privacy-friendly analytics (Vercel Analytics or Plausible) to
  see signups and usage — I can wire it, you enable it.
- **[code]** A pre-launch waitlist / "notify me" email capture to build an
  audience.
- **[you]** App Store: see `APP_STORE.md` (needs Apple Developer + Xcode).

## 7. Quality safety net (done)

- **[code]** A Vitest test suite (`npm test`) covers the date helpers, plan
  logic and HomeOS calculations, so future changes can't silently break these.
  Run it before every deploy alongside `npm run typecheck` and `npm run build`.

---

### The shortest path to "taking money"
1. Buy the domain, point Vercel at it. **[you]**
2. Add the AI key to Vercel. **[you]**
3. Run `0002_subscriptions.sql` in Supabase. **[you]**
4. I wire Stripe checkout + webhook + server-side plan gate. **[code]**
5. Add Stripe keys to Vercel. **[you]**

Everything on the **[code]** side that doesn't need your accounts is already
done — the rest is waiting on those accounts.
