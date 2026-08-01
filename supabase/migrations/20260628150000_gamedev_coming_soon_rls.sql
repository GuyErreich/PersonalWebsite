-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Restrict public reads of coming-soon projects; admins retain full access.
drop policy if exists "Public can read gamedev items" on public.gamedev_items;

create policy "Public can read gamedev items"
  on public.gamedev_items for select
  using (is_coming_soon = false);

drop policy if exists "Admins can read all gamedev items" on public.gamedev_items;

create policy "Admins can read all gamedev items"
  on public.gamedev_items for select
  using ((select public.is_admin()));

-- Scope project-linked VFX reads to published (non-coming-soon) projects only.
drop policy if exists "Public can read gamedev vfx" on public.gamedev_vfx;

create policy "Public can read gamedev vfx"
  on public.gamedev_vfx for select
  using (
    show_in_library = true
    or exists (
      select 1
      from public.gamedev_project_vfx p
      join public.gamedev_items i on i.id = p.gamedev_item_id
      where p.gamedev_vfx_id = public.gamedev_vfx.id
        and i.is_coming_soon = false
    )
  );
