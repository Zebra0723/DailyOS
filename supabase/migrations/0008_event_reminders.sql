-- ============================================================================
-- DailyOS — per-event reminders
-- Adds an absolute reminder instant to calendar events. The client computes it
-- (event start minus the chosen lead time) in the user's real timezone and
-- stores it as a plain UTC timestamp, so the push cron can fire it by a simple
-- "remind_at <= now" check — no timezone maths needed server-side.
--
-- Null = no reminder. Run this in the Supabase SQL editor.
-- ============================================================================

alter table public.calendar_events
  add column if not exists remind_at timestamptz;

-- Helps the cron find events due a reminder without scanning everything.
create index if not exists events_remind_idx
  on public.calendar_events (remind_at)
  where remind_at is not null;
