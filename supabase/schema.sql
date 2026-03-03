-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.meetings (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  start_utc timestamptz not null,
  end_utc timestamptz not null,
  location text not null default '',
  notes text not null default '',
  color text not null default '#2563eb',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetings_time_check check (end_utc > start_utc)
);

create index if not exists meetings_user_start_idx on public.meetings (user_id, start_utc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_meetings_updated_at on public.meetings;
create trigger trg_meetings_updated_at
before update on public.meetings
for each row
execute function public.set_updated_at();

alter table public.meetings enable row level security;

drop policy if exists meetings_select_own on public.meetings;
create policy meetings_select_own on public.meetings
for select to authenticated
using (auth.uid() = user_id);

drop policy if exists meetings_insert_own on public.meetings;
create policy meetings_insert_own on public.meetings
for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists meetings_update_own on public.meetings;
create policy meetings_update_own on public.meetings
for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists meetings_delete_own on public.meetings;
create policy meetings_delete_own on public.meetings
for delete to authenticated
using (auth.uid() = user_id);

create table if not exists public.cat_activity (
  date date primary key,
  wet_food_times text[] not null default '{}',
  dry_food_times text[] not null default '{}',
  slept_hours numeric(4,1) not null default 0,
  played boolean not null default false,
  pooped boolean not null default false,
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint cat_activity_sleep_check check (slept_hours >= 0 and slept_hours <= 24)
);

drop trigger if exists trg_cat_activity_updated_at on public.cat_activity;
create trigger trg_cat_activity_updated_at
before update on public.cat_activity
for each row
execute function public.set_updated_at();

alter table public.cat_activity enable row level security;

drop policy if exists cat_activity_select_all_auth on public.cat_activity;
create policy cat_activity_select_all_auth on public.cat_activity
for select to authenticated
using (true);

drop policy if exists cat_activity_write_all_auth on public.cat_activity;
create policy cat_activity_write_all_auth on public.cat_activity
for all to authenticated
using (true)
with check (true);
