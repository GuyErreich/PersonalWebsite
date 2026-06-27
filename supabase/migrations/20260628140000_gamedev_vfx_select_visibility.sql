-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Restrict anon/public reads to published library entries and project-linked VFX.
drop policy if exists "Public can read gamedev vfx" on public.gamedev_vfx;

create policy "Public can read gamedev vfx"
  on public.gamedev_vfx for select
  using (
    show_in_library = true
    or exists (
      select 1
      from public.gamedev_project_vfx p
      where p.gamedev_vfx_id = id
    )
  );

drop policy if exists "Admins can read all gamedev vfx" on public.gamedev_vfx;

create policy "Admins can read all gamedev vfx"
  on public.gamedev_vfx for select
  using ((select public.is_admin()));
