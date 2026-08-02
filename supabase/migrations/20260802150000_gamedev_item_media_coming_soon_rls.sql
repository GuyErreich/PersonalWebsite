-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Scope public gallery-media reads to non-coming-soon parent projects.
-- Admins retain full SELECT; write policies already use is_admin().

drop policy if exists "Public can read gamedev item media" on public.gamedev_item_media;

create policy "Public can read gamedev item media"
  on public.gamedev_item_media for select
  using (
    exists (
      select 1
      from public.gamedev_items i
      where i.id = public.gamedev_item_media.gamedev_item_id
        and i.is_coming_soon = false
    )
  );

drop policy if exists "Admins can read all gamedev item media" on public.gamedev_item_media;

create policy "Admins can read all gamedev item media"
  on public.gamedev_item_media for select
  using ((select public.is_admin()));
