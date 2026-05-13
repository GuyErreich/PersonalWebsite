-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.media_library_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,
  parent_path text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_library_folders_parent_path_idx
  on public.media_library_folders (parent_path);

create index if not exists media_library_folders_created_at_idx
  on public.media_library_folders (created_at desc);

create index if not exists media_library_folders_updated_at_idx
  on public.media_library_folders (updated_at desc);

create or replace function public.touch_media_library_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists media_library_folders_touch_updated_at on public.media_library_folders;

create trigger media_library_folders_touch_updated_at
before update on public.media_library_folders
for each row
execute function public.touch_media_library_folders_updated_at();

alter table public.media_library_folders enable row level security;

create policy "Public can read media library folders"
  on public.media_library_folders for select
  using (true);

create policy "Admins can insert media library folders"
  on public.media_library_folders for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

create policy "Admins can update media library folders"
  on public.media_library_folders for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

create policy "Admins can delete media library folders"
  on public.media_library_folders for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );