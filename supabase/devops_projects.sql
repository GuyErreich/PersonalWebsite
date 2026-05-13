-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.devops_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tech_stack text[] default '{}',
  github_url text,
  live_url text,
  icon_name text,
  created_at timestamptz not null default now()
);

create index if not exists devops_projects_created_at_idx
  on public.devops_projects (created_at desc);

-- Enable Row Level Security
alter table public.devops_projects enable row level security;

-- Public can read all projects
create policy "Public can read devops projects"
  on public.devops_projects for select
  using (true);

-- Only admins can insert
create policy "Admins can insert devops projects"
  on public.devops_projects for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can update
create policy "Admins can update devops projects"
  on public.devops_projects for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can delete
create policy "Admins can delete devops projects"
  on public.devops_projects for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
