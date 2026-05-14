-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.gamedev_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  media_url text not null,
  thumbnail_url text,
  icon_name text,
  github_url text,
  live_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists gamedev_items_created_at_idx
  on public.gamedev_items (created_at desc);

-- Enable Row Level Security
alter table public.gamedev_items enable row level security;

-- Public can read all items
create policy "Public can read gamedev items"
  on public.gamedev_items for select
  using (true);

-- Only admins can insert
create policy "Admins can insert gamedev items"
  on public.gamedev_items for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can update
create policy "Admins can update gamedev items"
  on public.gamedev_items for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can delete
create policy "Admins can delete gamedev items"
  on public.gamedev_items for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
