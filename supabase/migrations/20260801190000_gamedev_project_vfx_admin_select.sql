-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Admins must SELECT project VFX links even when the item is coming soon,
-- otherwise sync/hydrate after flipping is_coming_soon cannot see existing rows.

drop policy if exists "Admins can read all gamedev project vfx" on public.gamedev_project_vfx;

create policy "Admins can read all gamedev project vfx"
  on public.gamedev_project_vfx for select
  using ((select public.is_admin()));
