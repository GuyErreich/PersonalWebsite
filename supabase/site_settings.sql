-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create index if not exists site_settings_updated_at_idx
  on public.site_settings (updated_at desc);

-- Enable Row Level Security
alter table public.site_settings enable row level security;

-- Public can read all settings
create policy "Public can read site settings"
  on public.site_settings for select
  using (true);

-- Only admins can insert
create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can update
create policy "Admins can update site settings"
  on public.site_settings for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can delete
create policy "Admins can delete site settings"
  on public.site_settings for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
