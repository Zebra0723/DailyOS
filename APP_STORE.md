# Getting DailyOS onto the App Store

DailyOS is a **web app** (Next.js on Vercel). The App Store only accepts native
apps, so the realistic route is to **wrap the existing web app in a thin native
shell with [Capacitor](https://capacitorjs.com)** and submit that. This keeps
one codebase — the shell just loads the app and adds native niceties.

This document tracks what's already done in the code and the steps that need a
Mac, Xcode and an Apple Developer account (which only you can set up).

---

## Done in the codebase (no accounts needed)

- **Installable PWA** — `src/app/manifest.ts` (name, icons, theme colour,
  standalone display) so the app can be added to a phone home screen today.
- **App icons** — `public/icon.svg` (maskable) and `src/app/apple-icon.tsx`
  (iOS home-screen PNG), in the warm brand colours.
- **iOS web-app metadata** — `apple-mobile-web-app-capable`, status-bar style,
  theme colour, and `format-detection` set in `src/app/layout.tsx`.
- **Security headers** — `next.config.mjs` sets `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` and HSTS.
- **Legal pages** — `/privacy` and `/terms` (Apple **requires** a reachable
  privacy policy URL), linked from the landing page, auth screens and Settings.
- **Friendly error / 404 pages** and route loading states.

## Try it now without the App Store

On an iPhone, open the site in Safari → Share → **Add to Home Screen**. It
launches full-screen with the DailyOS icon — no store needed. This is the
fastest way to "have the app on your phone" while the store route is set up.

---

## Steps that need your accounts (I can't do these from here)

1. **Apple Developer Program** — enrol at developer.apple.com (£79/$99 a year).
2. **A Mac with Xcode** — required to build and submit an iOS app.
3. **Add Capacitor** to the repo:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/ios
   npx cap init DailyOS app.dailyos --web-dir=out
   npx cap add ios
   ```
   (For a wrapper that loads the live site, point the Capacitor config
   `server.url` at https://daily-os-lac.vercel.app; for a bundled build,
   export the app instead.)
4. **App Store Connect** — create the app record, screenshots, description,
   category, age rating, and the privacy "nutrition label" (point the privacy
   URL at `/privacy`).
5. **Build, sign and upload** from Xcode, then submit for review.

## Honest note on review

Apple can reject apps that are *only* a website wrapper with no native value.
To pass comfortably, plan to add at least one genuinely native touch — push
notifications, share-sheet capture (drop a receipt straight from Photos), or
offline support. Say the word and I'll build the web-side hooks for those.

## Before a public launch (recommended)

- Set the **AI provider key** in Vercel so features use the real model.
- Wire up **real billing** (Stripe) if you want paid plans.
- Remove or hide the **owner-unlock** link so the paywall is enforced.
- Add **error monitoring** (e.g. Sentry) and a support email that exists.
