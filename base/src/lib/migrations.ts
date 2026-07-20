// The DailyOS setup migrations, bundled so Base can apply them in one tap.
// Every statement is idempotent (`if not exists`), so re-running is safe.
// Schemas here match exactly what the app + admin code expect.

export interface Migration {
  key: string;
  label: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    key: "app_config",
    label: "app_config (announcement + maintenance banner)",
    sql: `create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_config enable row level security;
drop policy if exists "app_config public read" on public.app_config;
create policy "app_config public read" on public.app_config for select using (true);`,
  },
  {
    key: "admin_audit",
    label: "admin_audit (admin action log)",
    sql: `create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text,
  detail text,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;`,
  },
  {
    key: "admin_reminders",
    label: "admin_reminders (your admin to-dos)",
    sql: `create table if not exists public.admin_reminders (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  done boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.admin_reminders enable row level security;`,
  },
  {
    key: "scheduled_pushes",
    label: "scheduled_pushes (scheduled broadcast notifications)",
    sql: `create table if not exists public.scheduled_pushes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'DailyOS',
  body text not null default '',
  url text not null default '/today',
  audience text not null default '',
  send_at timestamptz not null,
  sent boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);
alter table public.scheduled_pushes add column if not exists audience text not null default '';
alter table public.scheduled_pushes enable row level security;
create index if not exists scheduled_pushes_due_idx on public.scheduled_pushes (sent, send_at);`,
  },
  {
    key: "inbox_handled",
    label: "inbox_items.handled column",
    sql: `alter table public.inbox_items add column if not exists handled boolean not null default false;`,
  },
  {
    key: "user_state",
    label: "user_state (cross-device sync: timezone, prefs, avatar)",
    sql: `create table if not exists public.user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.user_state enable row level security;
drop policy if exists "user_state own rows" on public.user_state;
create policy "user_state own rows" on public.user_state
  using (auth.uid() = user_id) with check (auth.uid() = user_id);`,
  },
  {
    key: "push_log",
    label: "push_log (dedup ledger for reminders)",
    sql: `create table if not exists public.push_log (
  user_id uuid not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);
alter table public.push_log enable row level security;`,
  },
  {
    key: "feedback",
    label: "feedback (user feedback → DailyOS Support)",
    sql: `create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;`,
  },
];

/** Every migration joined into one script. */
export const SETUP_SQL = MIGRATIONS.map(
  (m) => `-- ${m.label}\n${m.sql}`,
).join("\n\n");

/** Tables Base checks for on the dashboard "setup health" panel. */
export const HEALTH_TABLES = [
  "inbox_items",
  "extracted_tasks",
  "calendar_events",
  "notes",
  "vault_items",
  "push_subscriptions",
  "reward_codes",
  "user_state",
  "app_config",
  "admin_audit",
  "admin_reminders",
  "scheduled_pushes",
  "push_log",
];
