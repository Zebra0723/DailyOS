-- ============================================================================
-- DailyOS — bookmark (pin) inbox items so they show on Today.
-- Run this in the Supabase SQL editor.
-- ============================================================================
alter table public.inbox_items
  add column if not exists bookmarked boolean not null default false;

create index if not exists inbox_items_bookmarked_idx
  on public.inbox_items (user_id, bookmarked)
  where bookmarked = true;
