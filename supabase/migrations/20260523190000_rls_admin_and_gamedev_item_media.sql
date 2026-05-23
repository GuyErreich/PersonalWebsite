-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- This migration captures remote changes already applied via MCP:
-- 1) RLS admin-check initplan optimization
-- 2) trigger function search_path hardening
-- 3) creation of public.gamedev_item_media

create or replace function public.touch_media_library_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_media_library_folders_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.touch_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin')
    or (auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb),
    false
  );
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devops_projects' AND policyname = 'Admins can insert devops projects'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can insert devops projects" ON public.devops_projects WITH CHECK ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devops_projects' AND policyname = 'Admins can update devops projects'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update devops projects" ON public.devops_projects USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'devops_projects' AND policyname = 'Admins can delete devops projects'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete devops projects" ON public.devops_projects USING ((select public.is_admin()))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gamedev_items' AND policyname = 'Admins can insert gamedev items'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can insert gamedev items" ON public.gamedev_items WITH CHECK ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gamedev_items' AND policyname = 'Admins can update gamedev items'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update gamedev items" ON public.gamedev_items USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'gamedev_items' AND policyname = 'Admins can delete gamedev items'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete gamedev items" ON public.gamedev_items USING ((select public.is_admin()))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library' AND policyname = 'Admins can read media library'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can read media library" ON public.media_library USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library' AND policyname = 'Admins can insert media library'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can insert media library" ON public.media_library WITH CHECK ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library' AND policyname = 'Admins can update media library'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update media library" ON public.media_library USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library' AND policyname = 'Admins can delete media library'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete media library" ON public.media_library USING ((select public.is_admin()))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library_folders' AND policyname = 'Admins can read media library folders'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can read media library folders" ON public.media_library_folders USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library_folders' AND policyname = 'Admins can insert media library folders'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can insert media library folders" ON public.media_library_folders WITH CHECK ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library_folders' AND policyname = 'Admins can update media library folders'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update media library folders" ON public.media_library_folders USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_library_folders' AND policyname = 'Admins can delete media library folders'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete media library folders" ON public.media_library_folders USING ((select public.is_admin()))';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can read site settings'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can read site settings" ON public.site_settings USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can insert site settings'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can insert site settings" ON public.site_settings WITH CHECK ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can update site settings'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update site settings" ON public.site_settings USING ((select public.is_admin()))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_settings' AND policyname = 'Admins can delete site settings'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete site settings" ON public.site_settings USING ((select public.is_admin()))';
  END IF;
END $$;

create table if not exists public.gamedev_item_media (
  id uuid primary key default gen_random_uuid(),
  gamedev_item_id uuid not null references public.gamedev_items(id) on delete cascade,
  media_url text not null,
  thumbnail_url text,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  sort_order integer,
  created_at timestamptz not null default now()
);

create index if not exists gamedev_item_media_gamedev_item_id_idx
  on public.gamedev_item_media (gamedev_item_id);

create index if not exists gamedev_item_media_sort_order_idx
  on public.gamedev_item_media (gamedev_item_id, sort_order nulls last, created_at asc);

alter table public.gamedev_item_media enable row level security;

drop policy if exists "Public can read gamedev item media" on public.gamedev_item_media;
create policy "Public can read gamedev item media"
  on public.gamedev_item_media for select
  using (true);

drop policy if exists "Admins can insert gamedev item media" on public.gamedev_item_media;
create policy "Admins can insert gamedev item media"
  on public.gamedev_item_media for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update gamedev item media" on public.gamedev_item_media;
create policy "Admins can update gamedev item media"
  on public.gamedev_item_media for update
  using ((select public.is_admin()));

drop policy if exists "Admins can delete gamedev item media" on public.gamedev_item_media;
create policy "Admins can delete gamedev item media"
  on public.gamedev_item_media for delete
  using ((select public.is_admin()));
