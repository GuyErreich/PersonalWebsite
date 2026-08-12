-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- App code (findVfxByMediaUrl, admin dedupe) treats media_url as a natural key.
-- Collapse any existing duplicates, then enforce UNIQUE.
-- Canonical row per media_url: prefer show_in_library, then lowest sort_order
-- (nulls last), then newest created_at. Before deleting duplicates, OR any
-- duplicate's show_in_library onto the survivor so a published library row is
-- never lost when an unpublished duplicate would otherwise win on sort/time.

create temporary table gamedev_vfx_media_url_dupes on commit drop as
select
  r.id as duplicate_id,
  c.id as canonical_id
from (
  select
    id,
    media_url,
    row_number() over (
      partition by media_url
      order by show_in_library desc, sort_order asc nulls last, created_at desc, id asc
    ) as rn
  from public.gamedev_vfx
) r
join (
  select
    id,
    media_url,
    row_number() over (
      partition by media_url
      order by show_in_library desc, sort_order asc nulls last, created_at desc, id asc
    ) as rn
  from public.gamedev_vfx
) c on c.media_url = r.media_url and c.rn = 1
where r.rn > 1;

-- Repoint project links from duplicates onto the canonical row when missing.
insert into public.gamedev_project_vfx (gamedev_item_id, gamedev_vfx_id, sort_order)
select
  p.gamedev_item_id,
  d.canonical_id,
  min(p.sort_order)
from public.gamedev_project_vfx p
join gamedev_vfx_media_url_dupes d on d.duplicate_id = p.gamedev_vfx_id
where not exists (
  select 1
  from public.gamedev_project_vfx existing
  where existing.gamedev_item_id = p.gamedev_item_id
    and existing.gamedev_vfx_id = d.canonical_id
)
group by p.gamedev_item_id, d.canonical_id;

-- Drop links that still point at duplicate rows.
delete from public.gamedev_project_vfx p
using gamedev_vfx_media_url_dupes d
where p.gamedev_vfx_id = d.duplicate_id;

-- Preserve library visibility from any duplicate onto the survivor.
update public.gamedev_vfx v
set show_in_library = true
from (
  select distinct d.canonical_id
  from gamedev_vfx_media_url_dupes d
  join public.gamedev_vfx dup on dup.id = d.duplicate_id
  where dup.show_in_library
) src
where v.id = src.canonical_id
  and not v.show_in_library;

-- Remove duplicate VFX rows.
delete from public.gamedev_vfx v
using gamedev_vfx_media_url_dupes d
where v.id = d.duplicate_id;

alter table public.gamedev_vfx
  add constraint gamedev_vfx_media_url_key unique (media_url);
