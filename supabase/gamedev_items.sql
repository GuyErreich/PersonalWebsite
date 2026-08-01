-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.gamedev_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  media_url text,
  thumbnail_url text,
  header_media_url text,
  header_thumbnail_url text,
  icon_name text,
  github_url text,
  live_url text,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  featured_sort integer,
  show_vfx_section boolean not null default true,
  is_coming_soon boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists gamedev_items_created_at_idx
  on public.gamedev_items (created_at desc);

create index if not exists gamedev_items_featured_idx
  on public.gamedev_items (is_featured, featured_sort nulls last, created_at desc);

-- Enable Row Level Security
alter table public.gamedev_items enable row level security;

-- Public can read all items (coming soon is a teaser flag, not a draft lock)
drop policy if exists "Public can read gamedev items" on public.gamedev_items;

create policy "Public can read gamedev items"
  on public.gamedev_items for select
  using (true);

drop policy if exists "Admins can read all gamedev items" on public.gamedev_items;

create policy "Admins can read all gamedev items"
  on public.gamedev_items for select
  using ((select public.is_admin()));

-- Only admins can insert
drop policy if exists "Admins can insert gamedev items" on public.gamedev_items;

create policy "Admins can insert gamedev items"
  on public.gamedev_items for insert
  with check ((select public.is_admin()));

-- Only admins can update
drop policy if exists "Admins can update gamedev items" on public.gamedev_items;

create policy "Admins can update gamedev items"
  on public.gamedev_items for update
  using ((select public.is_admin()));

-- Only admins can delete
drop policy if exists "Admins can delete gamedev items" on public.gamedev_items;

create policy "Admins can delete gamedev items"
  on public.gamedev_items for delete
  using ((select public.is_admin()));
