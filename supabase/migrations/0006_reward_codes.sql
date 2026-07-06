-- ============================================================================
-- DailyOS — single-use referral reward codes (with a prize ladder)
-- Run this in the Supabase SQL editor to switch referral rewards to a unique
-- code per person, each redeemable exactly once, ever, across all accounts.
--
-- Rewards scale with how many friends you convert:
--   1  friend  → 10% off your next plan   (discount)
--   5  friends → 3 months of Plus         (plan grant, 90 days)
--   7  friends → 1 year of Pro            (plan grant, 365 days)
--   10 friends → lifetime Plus            (plan grant, 0 = forever)
--   25 friends → lifetime Pro             (plan grant, 0 = forever)
--
-- Redeeming flips `used` in a single conditional UPDATE, so a code can never be
-- claimed twice — even by two people at once. Until you run it, redeeming falls
-- back safely ("not active yet") and nothing breaks.
-- ============================================================================

create table if not exists public.reward_codes (
  code            text        primary key,
  recipient_id    uuid        references auth.users(id) on delete set null,
  recipient_email text,
  kind            text        not null default 'discount',  -- discount | plan
  percent         int         not null default 10,          -- for kind = discount
  plan_tier       text,                                     -- plus | pro (kind = plan)
  plan_days       int,                                      -- 0 = lifetime (kind = plan)
  milestone       int,                                      -- friends count that earned it
  used            boolean     not null default false,
  used_by         uuid        references auth.users(id) on delete set null,
  used_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists reward_codes_recipient_idx
  on public.reward_codes (recipient_id);

alter table public.reward_codes enable row level security;

-- A user may read the codes issued to them (to see their rewards). Issuing and
-- redeeming both go through service-role server actions, which bypass RLS, so
-- there are deliberately no insert/update policies here.
do $$ begin
  create policy "reward_codes select own" on public.reward_codes
    for select using (auth.uid() = recipient_id);
exception when duplicate_object then null; end $$;
