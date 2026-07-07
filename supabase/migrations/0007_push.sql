-- ============================================================================
-- DailyOS — Web Push notifications
-- Run this in the Supabase SQL editor to enable push notifications.
--
--   push_subscriptions  one row per device/browser the user opted in from.
--                       Deleted automatically when a push is rejected as gone
--                       (410/404) so we never keep sending to dead endpoints.
--   push_log            a de-dupe ledger so a given nudge (a task, an event,
--                       an expiring code) is only ever pushed once. A unique
--                       (user_id, dedupe_key) means the send route can INSERT
--                       first and only send when the insert actually happened.
--
-- Until you run this, push simply stays off — nothing else breaks.
-- ============================================================================

create table if not exists public.push_subscriptions (
  endpoint    text        primary key,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  p256dh      text        not null,
  auth        text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

create table if not exists public.push_log (
  user_id     uuid        not null references auth.users(id) on delete cascade,
  dedupe_key  text        not null,
  sent_at     timestamptz not null default now(),
  primary key (user_id, dedupe_key)
);

alter table public.push_subscriptions enable row level security;
alter table public.push_log           enable row level security;

-- A user may read/insert/delete their OWN subscriptions (the opt-in toggle uses
-- the anon client). The send route uses the service-role client, which bypasses
-- RLS, so push_log has no policies (server-only).
do $$ begin
  create policy "push_subs select own" on public.push_subscriptions
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "push_subs insert own" on public.push_subscriptions
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "push_subs update own" on public.push_subscriptions
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "push_subs delete own" on public.push_subscriptions
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
