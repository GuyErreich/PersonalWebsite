-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Applied remotely via Supabase MCP; recorded here to align CLI migration history.

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
