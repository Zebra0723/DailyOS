-- Migration: add the "handled" flag used by the Action Report "Mark as handled".
-- Run this once in the Supabase SQL editor on an existing project.
alter table public.inbox_items
  add column if not exists handled boolean not null default false;
