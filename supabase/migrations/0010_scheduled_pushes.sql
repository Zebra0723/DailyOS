-- Admin-scheduled broadcast notifications.
--
-- The admin app inserts rows here; the main app's every-minute cron
-- (/api/push/run) sends any that are due and flips `sent` to true.
-- Only the service role touches this table, so RLS is on with no policies.

create table if not exists public.scheduled_pushes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'DailyOS',
  body text not null default '',
  url text not null default '/today',
  -- Comma list of plan tiers to target (free/plus/pro). Empty = everyone.
  audience text not null default '',
  send_at timestamptz not null,
  sent boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

-- If the table already existed from an earlier run, add the column.
alter table public.scheduled_pushes add column if not exists audience text not null default '';

alter table public.scheduled_pushes enable row level security;

create index if not exists scheduled_pushes_due_idx
  on public.scheduled_pushes (sent, send_at);
