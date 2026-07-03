# DailyOS

**Your life admin, finally handled.**

**Live app:** https://daily-os-lac.vercel.app

DailyOS is a personal "chief of staff" for life admin. Drop in receipts,
bookings, school letters, screenshots, PDFs and reminders — and DailyOS reads
them, extracts the useful details, and turns them into **tasks**, **calendar
events** and a **searchable vault**. Nothing is saved until you review and
approve it. Around that core sit a handful of focused "OS" modules for the rest
of life admin.

> DailyOS turns life admin into handled.

---

## Features

**LifeOS — the core**

- **Today ("The Daily Brief")** — an editorial dashboard of what matters now:
  tasks due, upcoming events, items needing review and recent activity.
- **Life Inbox** — paste text or upload a PDF/PNG/JPG/TXT; AI extracts the item
  type, a summary, key dates, suggested tasks and events, and a vault category.
- **Review & approve** — edit everything before it reaches Tasks / Calendar /
  Vault. Nothing is saved until you confirm.
- **Build My Day** — turn your hours, fixed commitments and goals into a calm,
  productive schedule you can then rearrange, retime and edit block by block.
- **Interests** — name an interest and get a specific, tiered mini-plan
  (today → this week → go deeper → level up → community → spend wisely).
- **World Clock**, **Notes**, **Tasks**, **Calendar** and a categorised,
  searchable **Vault** with original-file download.

**HomeOS** — run your whole home: subscriptions, deliveries, rooms, devices and
documents, with a Home Control Score, alerts and a combined calendar. *(Pro.)*

**Wellbeing** — Mindfulness, Mood and Nudges.

- **Settings** — account, username, appearance (light/dark), plan & billing,
  full data/account deletion, and a dev-only AI provider status panel.
- **Private by design** — Supabase Row Level Security, private file storage,
  server-only API keys.

---

## Plans

Three tiers — **Free**, **Plus** and **Pro** — gate the heavier modules (Vault,
Build My Day, HomeOS). Real billing isn't wired up yet; plans are switched with
promo codes on the Settings page and remembered per account. Pro unlocks
everything including HomeOS.

---

## Tech stack

| Area      | Choice                                                |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript                  |
| Styling   | Tailwind CSS + shadcn-style components, CSS-var theme |
| Auth/DB   | Supabase (Postgres, Auth, Storage)                    |
| AI        | Any **OpenAI-compatible** chat API (swappable)        |
| Hosting   | Vercel                                                |

The UI is a warm "Almanac" editorial theme: paper/ink palette, a burnt-clay
accent, a serif display face, and a two-tier top navigation bar.

---

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (20+ recommended)
- A free [Supabase](https://supabase.com) project
- An OpenAI-compatible API key (OpenAI, Groq, Together, OpenRouter, Ollama…)

### 2. Install

```bash
npm install
```

### 3. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
   This creates all tables, enums, triggers, **Row Level Security policies**
   and the private `inbox-files` storage bucket.
3. In **Settings → API**, copy your **Project URL**, **anon key** and
   **service role key**.

### 4. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # server-only

AI_PROVIDER_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_API_KEY=sk-your-key                      # server-only, never exposed
AI_MODEL=gpt-4o-mini

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` and `AI_PROVIDER_API_KEY` are **only ever read on
> the server**. They are never sent to the browser. When no AI key is set, the
> AI-backed features fall back to solid built-in logic so the app still works.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>, sign up, and add your first item.

---

## Swapping the AI provider

The LLM layer ([`src/lib/ai/provider.ts`](src/lib/ai/provider.ts)) targets the
OpenAI-compatible `/chat/completions` endpoint, so switching providers is just
changing environment variables:

| Provider   | `AI_PROVIDER_BASE_URL`              | Example `AI_MODEL`        |
| ---------- | ----------------------------------- | ------------------------- |
| OpenAI     | `https://api.openai.com/v1`         | `gpt-4o-mini`             |
| Groq       | `https://api.groq.com/openai/v1`    | `llama-3.3-70b-versatile` |
| OpenRouter | `https://openrouter.ai/api/v1`      | `openai/gpt-4o-mini`      |
| Ollama     | `http://localhost:11434/v1`         | `llama3.1`                |

If extraction fails or no text is available (e.g. an image/PDF before OCR), the
item is saved safely with a **"Needs review"** state instead of being lost.

---

## Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in
   **Project → Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL`
   to your production URL).
4. In Supabase **Authentication → URL Configuration**, add your Vercel URL to
   the allowed redirect URLs.
5. Deploy.

The app runs AI extraction, auth and data access **on the server** so your API
keys are never exposed in the browser — a static-only host can't provide that,
so Vercel (or any Node host) is the right home.

---

## Security & privacy

- **Row Level Security** on every table — users only read/write their own rows
  (`auth.uid() = user_id`).
- **Private storage** — files live under `inbox-files/<user_id>/…`, reachable
  only by their owner via short-lived signed URLs.
- **Server-only secrets** — the service-role key and AI key are read in Server
  Components / Server Actions only.
- **Data control** — delete all data, or your whole account, from Settings.

---

## Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the dev server             |
| `npm run build`     | Production build                 |
| `npm run start`     | Run the production build         |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | TypeScript type checking         |

---

Built with care. Life admin, handled.
