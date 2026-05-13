-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

alter table public.gamedev_items
  add column if not exists tags text[] not null default '{}';
