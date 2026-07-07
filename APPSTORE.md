# DailyOS — getting into the app stores

DailyOS is a web app / PWA. It doesn't need a rewrite to be in the stores — we
wrap the live site. 🔶 = needs Arjun (paid account / submission / signing).

## The plan (fastest first)
1. **Google Play (easy, cheap).** Use **PWABuilder** (pwabuilder.com) → enter the
   live URL → download the **Android package** (a Trusted Web Activity). Needs a
   one-time **Google Play developer account (~$25)** and the app signed. Play is
   PWA-friendly; approval is usually smooth.
2. **Apple App Store (harder).** Apple rejects apps that are "just a website", so
   the wrapper must feel native. Two options:
   - **PWABuilder iOS package** — quickest; a thin wrapper. Higher rejection risk.
   - **Capacitor** — wrap the site in a real native shell with native features
     (push, share, camera). Best chance of approval, more setup.
   Needs an **Apple Developer account ($99/yr)** + a Mac/Xcode (or a CI service).

## What Leo has done to make it store-ready ✅
- `manifest.ts`: standalone display, theme/background colours, maskable icon,
  categories, `id`/`lang`/`dir`, and app-icon **shortcuts** (Add to Inbox / Today
  / Ask DailyOS).
- Installable PWA, no-store HTML caching so updates land, timezone-correct dates.

## What still helps approval (Leo can do — flag build risk) ⚠️
- **Offline support** (a service worker) so the app opens without a connection —
  makes it feel native and helps Apple approval. (Adds a dependency + config;
  do carefully so it doesn't break the deploy.)
- **Real screenshots** for the listings (need actual images — 🔶 or generated).
- **Push notifications** — native-only on iOS; ties into the parked "reminders"
  idea. Needs the native shell (Capacitor) + APNs/FCM keys (🔶).

## What only Arjun can do 🔶
- Create the **Google Play** ($25) and **Apple Developer** ($99/yr) accounts.
- Run PWABuilder / Capacitor to generate + **sign** the packages, and submit.
- Provide store assets: screenshots, feature graphic, and confirm the listing.
- Handle review responses.

## Store listing — draft copy (ready to paste)
- **Name:** DailyOS — Life admin, handled
- **Subtitle (iOS, ≤30):** Your personal chief of staff
- **Short description (Play, ≤80):** Snap receipts, bookings & letters — DailyOS turns them into tasks & reminders.
- **Keywords (iOS, ≤100):** life admin,tasks,reminders,calendar,receipts,organiser,planner,family,vault,to-do
- **Category:** Productivity
- **Full description:**
  > Life admin, finally handled.
  >
  > Drop in a receipt, booking, school letter or screenshot and DailyOS reads it
  > and turns it into tasks, calendar events and a tidy, searchable vault — so
  > nothing slips through the cracks.
  >
  > • Life Inbox — snap or paste anything; AI pulls out the dates and to-dos.
  > • Tasks, Today & Calendar — everything you need to handle, in one calm place.
  > • Searchable Vault — receipts, warranties and bookings, filed automatically.
  > • Ask DailyOS — your AI chief of staff, on Pro.
  > • Wellbeing — a daily mindful moment, mood check-ins and gentle nudges.
  >
  > Private by design: your data is locked to your account and yours to delete
  > any time. Free to start — no card needed.

## Reminders (added to TASKS.md)
- 🔶 Google Play account ($25) + Apple Developer account ($99/yr).
- 🔶 Generate + sign the packages (PWABuilder / Capacitor) and submit.
- 🔶 Store screenshots + feature graphic.
