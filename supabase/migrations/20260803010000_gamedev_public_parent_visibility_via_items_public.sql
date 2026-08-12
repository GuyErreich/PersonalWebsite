-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Public SELECT on gamedev_items is admin-only (coming-soon redaction). RLS
-- EXISTS joins from child tables must use gamedev_items_public
-- (security_invoker = false) so anon/auth can still resolve parent visibility
-- without reading redacted base-table columns.

drop policy if exists "Public can read gamedev project vfx" on public.gamedev_project_vfx;

create policy "Public can read gamedev project vfx"
  on public.gamedev_project_vfx for select
  using (
    exists (
      select 1
      from public.gamedev_items_public i
      where i.id = gamedev_item_id
        and i.is_coming_soon = false
        and i.show_vfx_section = true
    )
  );

drop policy if exists "Public can read gamedev vfx" on public.gamedev_vfx;

create policy "Public can read gamedev vfx"
  on public.gamedev_vfx for select
  using (
    show_in_library = true
    or exists (
      select 1
      from public.gamedev_project_vfx p
      join public.gamedev_items_public i on i.id = p.gamedev_item_id
      where p.gamedev_vfx_id = public.gamedev_vfx.id
        and i.is_coming_soon = false
        and i.show_vfx_section = true
    )
  );

drop policy if exists "Public can read gamedev item media" on public.gamedev_item_media;

create policy "Public can read gamedev item media"
  on public.gamedev_item_media for select
  using (
    exists (
      select 1
      from public.gamedev_items_public i
      where i.id = public.gamedev_item_media.gamedev_item_id
        and i.is_coming_soon = false
    )
  );
