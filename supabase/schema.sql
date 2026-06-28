-- ============================================================================
-- DailyOS — database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- It is idempotent-ish: safe to re-run on a fresh project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type inbox_status as enum ('pending','processing','review','approved','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type input_type as enum ('file','text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending','completed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- inbox_items
-- ---------------------------------------------------------------------------
create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  input_type input_type not null default 'text',
  original_text text,
  file_url text,
  file_name text,
  file_type text,
  status inbox_status not null default 'pending',
  item_type text,
  summary text,
  raw_ai_json jsonb,
  needs_text_extraction boolean not null default false,
  handled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For projects created before the "handled" column existed:
alter table public.inbox_items
  add column if not exists handled boolean not null default false;

create index if not exists inbox_items_user_idx on public.inbox_items(user_id, created_at desc);
create index if not exists inbox_items_status_idx on public.inbox_items(user_id, status);

drop trigger if exists trg_inbox_items_updated on public.inbox_items;
create trigger trg_inbox_items_updated before update on public.inbox_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- extracted_tasks
-- ---------------------------------------------------------------------------
create table if not exists public.extracted_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inbox_item_id uuid references public.inbox_items(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority task_priority not null default 'medium',
  status task_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_idx on public.extracted_tasks(user_id, due_date);

drop trigger if exists trg_tasks_updated on public.extracted_tasks;
create trigger trg_tasks_updated before update on public.extracted_tasks
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- calendar_events
-- ---------------------------------------------------------------------------
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inbox_item_id uuid references public.inbox_items(id) on delete set null,
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_user_idx on public.calendar_events(user_id, start_time);

drop trigger if exists trg_events_updated on public.calendar_events;
create trigger trg_events_updated before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- vault_items
-- ---------------------------------------------------------------------------
create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inbox_item_id uuid not null references public.inbox_items(id) on delete cascade,
  category text not null default 'general',
  title text not null,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vault_user_idx on public.vault_items(user_id, category);

drop trigger if exists trg_vault_updated on public.vault_items;
create trigger trg_vault_updated before update on public.vault_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- processing_logs
-- ---------------------------------------------------------------------------
create table if not exists public.processing_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inbox_item_id uuid not null references public.inbox_items(id) on delete cascade,
  status text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists logs_item_idx on public.processing_logs(inbox_item_id, created_at);

-- ---------------------------------------------------------------------------
-- notes (Smart Notepad)
-- ---------------------------------------------------------------------------
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

-- ============================================================================
-- Row Level Security — users may only ever touch their own rows.
-- ============================================================================
alter table public.inbox_items     enable row level security;
alter table public.extracted_tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.vault_items     enable row level security;
alter table public.processing_logs enable row level security;
alter table public.notes           enable row level security;

-- A reusable pattern: owner can do everything, nobody else can do anything.
do $$
declare t text;
begin
  foreach t in array array[
    'inbox_items','extracted_tasks','calendar_events','vault_items','processing_logs','notes'
  ]
  loop
    execute format('drop policy if exists "owner_select" on public.%I;', t);
    execute format('drop policy if exists "owner_insert" on public.%I;', t);
    execute format('drop policy if exists "owner_update" on public.%I;', t);
    execute format('drop policy if exists "owner_delete" on public.%I;', t);

    execute format(
      'create policy "owner_select" on public.%I for select using (auth.uid() = user_id);', t);
    execute format(
      'create policy "owner_insert" on public.%I for insert with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "owner_update" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format(
      'create policy "owner_delete" on public.%I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- ============================================================================
-- Storage bucket for uploaded files (private; access via signed URLs).
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('inbox-files', 'inbox-files', false)
on conflict (id) do nothing;

-- Users may only read/write files under a folder named after their user id:
--   inbox-files/<user_id>/<file>
drop policy if exists "own files read" on storage.objects;
drop policy if exists "own files write" on storage.objects;
drop policy if exists "own files delete" on storage.objects;

create policy "own files read" on storage.objects
  for select using (
    bucket_id = 'inbox-files' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own files write" on storage.objects
  for insert with check (
    bucket_id = 'inbox-files' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "own files delete" on storage.objects
  for delete using (
    bucket_id = 'inbox-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
