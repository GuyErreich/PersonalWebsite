-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Qualify outer gamedev_vfx.id in public SELECT EXISTS (was binding to gamedev_items.id).
-- Align admin write policies with is_admin().

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

drop policy if exists "Admins can insert gamedev vfx" on public.gamedev_vfx;
create policy "Admins can insert gamedev vfx"
  on public.gamedev_vfx for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update gamedev vfx" on public.gamedev_vfx;
create policy "Admins can update gamedev vfx"
  on public.gamedev_vfx for update
  using ((select public.is_admin()));

drop policy if exists "Admins can delete gamedev vfx" on public.gamedev_vfx;
create policy "Admins can delete gamedev vfx"
  on public.gamedev_vfx for delete
  using ((select public.is_admin()));

drop policy if exists "Admins can insert gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can insert gamedev project vfx"
  on public.gamedev_project_vfx for insert
  with check ((select public.is_admin()));

drop policy if exists "Admins can update gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can update gamedev project vfx"
  on public.gamedev_project_vfx for update
  using ((select public.is_admin()));

drop policy if exists "Admins can delete gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can delete gamedev project vfx"
  on public.gamedev_project_vfx for delete
  using ((select public.is_admin()));
