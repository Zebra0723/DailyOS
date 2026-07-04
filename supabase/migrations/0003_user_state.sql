-- ============================================================================
-- DailyOS — cross-device sync store
-- Run this in the Supabase SQL editor to turn on cross-device sync for the
-- browser-stored features (HomeOS, Interests, and future ones).
--
-- Until you run it, the app keeps working from local storage — the sync code
-- fails safely and falls back. After you run it, the same account's data
-- follows the user across devices.
-- ============================================================================

create table if not exists public.user_state (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

-- Users may only read/write their own state rows.
do $$ begin
  create policy "user_state select own" on public.user_state
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_state insert own" on public.user_state
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_state update own" on public.user_state
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_state delete own" on public.user_state
    for delete using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
