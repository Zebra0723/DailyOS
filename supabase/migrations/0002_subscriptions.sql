-- ============================================================================
-- DailyOS — subscriptions / billing table (prep for Stripe)
-- Run this in the Supabase SQL editor when you're ready to wire up payments.
-- Until then it's harmless: the app keeps using the local plan flag and this
-- table simply stays empty.
--
-- Once populated by the Stripe webhook, move the plan gate to read `plan` from
-- here (server-side) instead of localStorage — that also gives cross-device
-- plans for free.
-- ============================================================================

do $$ begin
  create type plan_tier as enum ('free','plus','pro');
exception when duplicate_object then null; end $$;

create table if not exists public.subscriptions (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  plan                    plan_tier   not null default 'free',
  status                  text        not null default 'inactive', -- active | trialing | past_due | canceled | inactive
  stripe_customer_id      text,
  stripe_subscription_id  text,
  current_period_end      timestamptz,
  admin                   boolean     not null default false,
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Users may read their own subscription row; only the server (service role,
-- which bypasses RLS) writes to it from the Stripe webhook.
do $$ begin
  create policy "read own subscription"
    on public.subscriptions for select
    using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

create index if not exists subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id);
