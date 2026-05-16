-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

alter table public.gamedev_items
  add column if not exists tags text[] not null default '{}';

update public.gamedev_items
set tags = '{}'
where tags is null;

alter table public.gamedev_items
  alter column tags set default '{}',
  alter column tags set not null;
