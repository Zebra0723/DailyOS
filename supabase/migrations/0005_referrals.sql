-- ============================================================================
-- DailyOS — referrals
-- Run this in the Supabase SQL editor to turn on referral tracking.
--
-- Each referred friend gets one row. It starts life as `pending` (they signed
-- up through someone's link) and flips to `converted` the moment they land on a
-- paid plan — at which point both people are emailed the 10%-off reward code.
--
-- Until you run it, the app keeps working: the referral code fails safely and
-- falls back to a no-op, so nothing breaks. After you run it, referrals are
-- recorded and both parties can be rewarded.
-- ============================================================================

create table if not exists public.referrals (
  id            uuid        primary key default gen_random_uuid(),
  referrer_id   uuid        not null references auth.users(id) on delete cascade,
  referred_id   uuid        not null references auth.users(id) on delete cascade,
  referred_email text,
  status        text        not null default 'pending',   -- pending | converted
  reward_code   text,
  converted_at  timestamptz,
  created_at    timestamptz not null default now(),
  -- One referral record per referred friend.
  unique (referred_id)
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

alter table public.referrals enable row level security;

-- A user may read the referrals they made (to see who converted) and the one
-- pointing at them. All writes go through the service-role server action, which
-- bypasses RLS, so there are deliberately no insert/update policies here.
do $$ begin
  create policy "referrals select own" on public.referrals
    for select using (auth.uid() = referrer_id or auth.uid() = referred_id);
exception when duplicate_object then null; end $$;
