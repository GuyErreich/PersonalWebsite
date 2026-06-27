-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

alter table public.gamedev_items
  add column if not exists is_coming_soon boolean not null default false;

create index if not exists gamedev_items_coming_soon_idx
  on public.gamedev_items (is_coming_soon, created_at desc);
