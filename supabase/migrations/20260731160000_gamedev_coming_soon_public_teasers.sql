-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Coming soon is a public teaser flag, not a draft lock.
-- Restore anon reads of all gamedev_items; keep VFX/link reads scoped to
-- published (non-coming-soon) projects so teaser-only rows do not leak VFX.

drop policy if exists "Public can read gamedev items" on public.gamedev_items;

create policy "Public can read gamedev items"
  on public.gamedev_items for select
  using (true);

drop policy if exists "Admins can read all gamedev items" on public.gamedev_items;

create policy "Admins can read all gamedev items"
  on public.gamedev_items for select
  using ((select public.is_admin()));

drop policy if exists "Public can read gamedev project vfx" on public.gamedev_project_vfx;

create policy "Public can read gamedev project vfx"
  on public.gamedev_project_vfx for select
  using (
    exists (
      select 1
      from public.gamedev_items i
      where i.id = gamedev_item_id
        and i.is_coming_soon = false
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
    )
  );
