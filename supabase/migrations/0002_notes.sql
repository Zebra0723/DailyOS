-- Migration: Smart Notepad — the `notes` table.
-- Run this once in the Supabase SQL editor on an existing project.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_idx on public.notes(user_id, created_at desc);

drop trigger if exists trg_notes_updated on public.notes;
create trigger trg_notes_updated before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

drop policy if exists "owner_select" on public.notes;
drop policy if exists "owner_insert" on public.notes;
drop policy if exists "owner_update" on public.notes;
drop policy if exists "owner_delete" on public.notes;

create policy "owner_select" on public.notes for select using (auth.uid() = user_id);
create policy "owner_insert" on public.notes for insert with check (auth.uid() = user_id);
create policy "owner_update" on public.notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_delete" on public.notes for delete using (auth.uid() = user_id);
