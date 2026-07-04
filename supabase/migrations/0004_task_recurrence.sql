-- ============================================================================
-- DailyOS — recurring tasks
-- Run this in the Supabase SQL editor to enable repeating tasks.
-- Until you run it, the app keeps working: new tasks are just one-offs (the
-- code adds the recurrence safely and skips it if this column isn't there).
-- ============================================================================

alter table public.extracted_tasks
  add column if not exists recurrence text not null default 'none';
