-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Gate public project-linked VFX reads on show_vfx_section so hidden sections
-- are not anon-enumerable. Library rows (show_in_library = true) stay public.

drop policy if exists "Public can read gamedev project vfx" on public.gamedev_project_vfx;

create policy "Public can read gamedev project vfx"
  on public.gamedev_project_vfx for select
  using (
    exists (
      select 1
      from public.gamedev_items i
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
      join public.gamedev_items i on i.id = p.gamedev_item_id
      where p.gamedev_vfx_id = public.gamedev_vfx.id
        and i.is_coming_soon = false
        and i.show_vfx_section = true
    )
  );
