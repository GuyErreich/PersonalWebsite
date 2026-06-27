-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

alter table public.gamedev_vfx
  add column if not exists show_in_library boolean not null default false;

-- Preserve visibility for effects already in the global pool
update public.gamedev_vfx
set show_in_library = true;

-- Effects linked to a project are always eligible for the public library
update public.gamedev_vfx v
set show_in_library = true
where exists (
  select 1
  from public.gamedev_project_vfx p
  where p.gamedev_vfx_id = v.id
);

create index if not exists gamedev_vfx_show_in_library_idx
  on public.gamedev_vfx (show_in_library, sort_order nulls last, created_at desc);
