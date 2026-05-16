-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists updated_at timestamptz;

update public.site_settings
set updated_at = now()
where updated_at is null;

alter table public.site_settings
  alter column updated_at set default now(),
  alter column updated_at set not null;

create index if not exists site_settings_updated_at_idx
  on public.site_settings (updated_at desc);

create or replace function public.touch_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_settings_touch_updated_at on public.site_settings;

create trigger site_settings_touch_updated_at
before update on public.site_settings
for each row
execute function public.touch_site_settings_updated_at();

-- Enable Row Level Security
alter table public.site_settings enable row level security;

-- Public can read only safe client-facing settings
drop policy if exists "Public can read site settings" on public.site_settings;

create policy "Public can read site settings"
  on public.site_settings for select
  using (key in ('showreel_url', 'showreel_default_volume'));

-- Admins can read all settings
create policy "Admins can read site settings"
  on public.site_settings for select
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

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
