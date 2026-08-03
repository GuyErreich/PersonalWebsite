-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Coming-soon teasers stay publicly listed, but write-up body + repo/live URLs
-- must not leak through anon SELECT on the base table. Public clients read the
-- redacting view. Authenticated (admin JWTs) keep SELECT on gamedev_items;
-- the admin RLS policy gates full-row access — table GRANT is required for RLS.

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

comment on function public.gamedev_public_teaser_description(text) is
  'Strips structured GameDev BODY markdown; marker must match GAMEDEV_BODY_MARKER in src/lib/gamedev.ts.';

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

comment on view public.gamedev_items_public is
  'Public GameDev catalog with coming-soon body/links redacted. Admins use gamedev_items (GRANT + admin RLS).';

revoke all on public.gamedev_items_public from public;
grant select on public.gamedev_items_public to anon, authenticated;

drop policy if exists "Public can read gamedev items" on public.gamedev_items;

drop policy if exists "Admins can read all gamedev items" on public.gamedev_items;

create policy "Admins can read all gamedev items"
  on public.gamedev_items for select
  using ((select public.is_admin()));

revoke select on table public.gamedev_items from anon;
