-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.media_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  content_hash text not null,
  folder_origin text,
  file_size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists media_library_content_hash_key
  on public.media_library (content_hash);

create index if not exists media_library_created_at_idx
  on public.media_library (created_at desc);

create index if not exists media_library_updated_at_idx
  on public.media_library (updated_at desc);

create index if not exists media_library_folder_origin_idx
  on public.media_library (folder_origin);

create or replace function public.touch_media_library_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_library_touch_updated_at on public.media_library;

create trigger media_library_touch_updated_at
before update on public.media_library
for each row
execute function public.touch_media_library_updated_at();

-- Enable Row Level Security
alter table public.media_library enable row level security;

-- Only admins can read media library items
drop policy if exists "Admins can read media library" on public.media_library;

create policy "Admins can read media library"
  on public.media_library for select
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can insert
drop policy if exists "Admins can insert media library" on public.media_library;

create policy "Admins can insert media library"
  on public.media_library for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can update
drop policy if exists "Admins can update media library" on public.media_library;

create policy "Admins can update media library"
  on public.media_library for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can delete
drop policy if exists "Admins can delete media library" on public.media_library;

create policy "Admins can delete media library"
  on public.media_library for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );