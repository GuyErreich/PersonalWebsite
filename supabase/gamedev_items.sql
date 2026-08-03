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

-- Public readers use gamedev_items_public (coming-soon body/links redacted).
-- Base table SELECT is admin-only so preserved write-ups and URLs do not leak.
drop policy if exists "Public can read gamedev items" on public.gamedev_items;

drop policy if exists "Admins can read all gamedev items" on public.gamedev_items;

create policy "Admins can read all gamedev items"
  on public.gamedev_items for select
  using ((select public.is_admin()));

revoke select on table public.gamedev_items from anon;
-- Authenticated retain table SELECT; RLS still limits rows to admins.
-- Matches 20260803220000_gamedev_items_restore_authenticated_select.sql.
grant select on table public.gamedev_items to authenticated;

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

-- Public catalog view: coming-soon rows expose teaser summary only (no BODY/links).
create or replace function public.gamedev_public_teaser_description(p_description text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_description is null then null
    when position(E'\n\n[//]: # (BODY)\n\n' in p_description) > 0 then
      trim(
        both
        from left(
          p_description,
          position(E'\n\n[//]: # (BODY)\n\n' in p_description) - 1
        )
      )
    else p_description
  end;
$$;

drop view if exists public.gamedev_items_public;

create view public.gamedev_items_public
with (security_invoker = false)
as
select
  i.id,
  i.title,
  case
    when i.is_coming_soon then public.gamedev_public_teaser_description(i.description)
    else i.description
  end as description,
  i.media_url,
  i.thumbnail_url,
  i.header_media_url,
  i.header_thumbnail_url,
  i.icon_name,
  case when i.is_coming_soon then null else i.github_url end as github_url,
  case when i.is_coming_soon then null else i.live_url end as live_url,
  i.tags,
  i.is_featured,
  i.featured_sort,
  i.show_vfx_section,
  i.is_coming_soon,
  i.created_at
from public.gamedev_items i;

revoke all on public.gamedev_items_public from public;
grant select on public.gamedev_items_public to anon, authenticated;
