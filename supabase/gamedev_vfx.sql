-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.gamedev_vfx (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  media_url text not null,
  thumbnail_url text,
  media_type text not null check (media_type in ('image', 'video')),
  tags text[] not null default '{}',
  sort_order integer,
  created_at timestamptz not null default now()
);

create index if not exists gamedev_vfx_sort_order_idx
  on public.gamedev_vfx (sort_order nulls last, created_at desc);

alter table public.gamedev_vfx enable row level security;

drop policy if exists "Public can read gamedev vfx" on public.gamedev_vfx;
create policy "Public can read gamedev vfx"
  on public.gamedev_vfx for select
  using (true);

drop policy if exists "Admins can insert gamedev vfx" on public.gamedev_vfx;
create policy "Admins can insert gamedev vfx"
  on public.gamedev_vfx for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

drop policy if exists "Admins can update gamedev vfx" on public.gamedev_vfx;
create policy "Admins can update gamedev vfx"
  on public.gamedev_vfx for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

drop policy if exists "Admins can delete gamedev vfx" on public.gamedev_vfx;
create policy "Admins can delete gamedev vfx"
  on public.gamedev_vfx for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

create table if not exists public.gamedev_project_vfx (
  gamedev_item_id uuid not null references public.gamedev_items(id) on delete cascade,
  gamedev_vfx_id uuid not null references public.gamedev_vfx(id) on delete cascade,
  sort_order integer,
  primary key (gamedev_item_id, gamedev_vfx_id)
);

create index if not exists gamedev_project_vfx_item_idx
  on public.gamedev_project_vfx (gamedev_item_id, sort_order nulls last);

create index if not exists gamedev_project_vfx_vfx_idx
  on public.gamedev_project_vfx (gamedev_vfx_id);

alter table public.gamedev_project_vfx enable row level security;

drop policy if exists "Public can read gamedev project vfx" on public.gamedev_project_vfx;
create policy "Public can read gamedev project vfx"
  on public.gamedev_project_vfx for select
  using (true);

drop policy if exists "Admins can insert gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can insert gamedev project vfx"
  on public.gamedev_project_vfx for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

drop policy if exists "Admins can update gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can update gamedev project vfx"
  on public.gamedev_project_vfx for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

drop policy if exists "Admins can delete gamedev project vfx" on public.gamedev_project_vfx;
create policy "Admins can delete gamedev project vfx"
  on public.gamedev_project_vfx for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
