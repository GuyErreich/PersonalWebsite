-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.gamedev_item_media (
  id uuid primary key default gen_random_uuid(),
  gamedev_item_id uuid not null references public.gamedev_items(id) on delete cascade,
  media_url text not null,
  thumbnail_url text,
  media_type text not null check (media_type in ('image', 'video')),
  caption text,
  sort_order integer,
  created_at timestamptz not null default now()
);

create index if not exists gamedev_item_media_gamedev_item_id_idx
  on public.gamedev_item_media (gamedev_item_id);

create index if not exists gamedev_item_media_sort_order_idx
  on public.gamedev_item_media (gamedev_item_id, sort_order nulls last, created_at asc);

alter table public.gamedev_item_media enable row level security;

create policy "Public can read gamedev item media"
  on public.gamedev_item_media for select
  using (true);

create policy "Admins can insert gamedev item media"
  on public.gamedev_item_media for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

create policy "Admins can update gamedev item media"
  on public.gamedev_item_media for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

create policy "Admins can delete gamedev item media"
  on public.gamedev_item_media for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
