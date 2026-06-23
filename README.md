# DailyOS

**Your life admin, finally handled.**

DailyOS is a personal “chief of staff” for life admin. Drop in receipts,
bookings, school letters, screenshots, PDFs and reminders — and DailyOS reads
them, extracts the useful details, and turns them into **tasks**, **calendar
events** and a **searchable vault**. Nothing is saved until you review and
approve it.

> DailyOS turns life admin into handled.

---

## ✨ Features

- **Life Inbox** — paste text or upload a PDF/PNG/JPG/TXT.
- **AI extraction** — pulls out item type, a summary, key dates, suggested
  tasks, suggested calendar events, key entities and a vault category as
  strict JSON.
- **Review & approve** — edit everything on a review screen. Nothing reaches
  Tasks / Calendar / Vault until you confirm.
- **Today** — tasks due today, upcoming events, recent items and a “needs
  review” banner.
- **Tasks** — add, edit, complete, delete and filter by due date & priority.
- **Calendar** — a clean internal month view with add/edit/delete.
- **Vault** — categorised, searchable home for everything processed, with
  original-file download.
- **Settings** — account info, full data/account deletion, a billing
  placeholder, and a dev-only AI provider status panel.
- **Private by design** — Supabase Row Level Security, private file storage,
  server-only API keys.

---

## 🧱 Tech stack

| Area      | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | Next.js 14 (App Router) + TypeScript                |
| Styling   | Tailwind CSS + shadcn-style components              |
| Auth/DB   | Supabase (Postgres, Auth, Storage)                  |
| AI        | Any **OpenAI-compatible** chat API (swappable)      |
| Hosting   | Vercel (recommended)                                |

---

## 🚀 Getting started

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
2. Open **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
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

> 🔐 `SUPABASE_SERVICE_ROLE_KEY` and `AI_PROVIDER_API_KEY` are **only ever read
> on the server**. They are never sent to the browser.

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>, sign up, and add your first item.

### 6. (Optional) Seed demo data

After signing up once, run [`supabase/seed.sql`](supabase/seed.sql) in the
Supabase SQL editor. It inserts a realistic set of demo items, tasks and events
for your most recent user so the app feels lived-in.

---

## 🔌 Swapping the AI provider

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
item is saved safely with a **“Needs review”** state instead of being lost.

> **Note on PDFs/images:** text extraction (OCR) is a planned milestone. Today,
> uploaded PDFs/images are stored and marked *“needs text”* — you paste the key
> text on the item screen and DailyOS extracts the rest. Pasted text and `.txt`
> uploads are fully automatic.

---

## 🗂 Project structure

```
src/
  app/
    page.tsx                 Landing page
    (auth)/login, signup     Auth pages
    auth/callback            Email-confirmation handler
    (app)/                   Authenticated shell + nav
      today/                 Dashboard
      inbox/                 Life Inbox, capture, review/detail
      calendar/              Calendar
      tasks/                 Tasks
      vault/                 Vault
      settings/              Settings
  components/                UI + feature components
  lib/
    ai/                      Provider, prompt, Zod validation
    supabase/                Browser/server/middleware clients
    process.ts               processInboxItem() extraction pipeline
    types.ts                 Shared domain types
  middleware.ts              Session refresh + route guards
supabase/
  schema.sql                 Tables, RLS, storage bucket
  seed.sql                   Demo data
```

The core pipeline, `processInboxItem()`, lives in
[`src/lib/process.ts`](src/lib/process.ts): it loads the item, resolves text,
calls the LLM for strict JSON, validates it, stores it in
`inbox_items.raw_ai_json`, and sets the status to `review`.

---

## ☁️ Deployment (Vercel)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in
   **Project → Settings → Environment Variables** (set `NEXT_PUBLIC_SITE_URL`
   to your production URL).
4. In Supabase **Authentication → URL Configuration**, add your Vercel URL to
   the allowed redirect URLs.
5. Deploy.

### Why not GitHub Pages?

GitHub Pages only serves **static files** and can’t run server code. DailyOS
deliberately runs AI extraction, auth and data access **on the server** so your
API keys are never exposed in the browser. A static-only host can’t provide
that, so Vercel (or any Node host) is the right home for the full app. A static
marketing build could be published to Pages later, but the app itself needs a
server runtime.

---

## 🔒 Security & privacy

- **Row Level Security** on every table — users can only read/write their own
  rows (`auth.uid() = user_id`).
- **Private storage** — files live under `inbox-files/<user_id>/…` and are only
  accessible to their owner via short-lived signed URLs.
- **Server-only secrets** — the service-role key and AI key are read in Server
  Components / Server Actions only.
- **Data control** — delete all data, or your whole account, from Settings.

---

## 📜 Scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the dev server             |
| `npm run build`     | Production build                 |
| `npm run start`     | Run the production build         |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | TypeScript type checking         |

---

Built with care. Life admin, handled.
