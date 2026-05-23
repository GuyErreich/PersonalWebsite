-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create table if not exists public.devops_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  tech_stack text[] not null default '{}',
  github_url text,
  live_url text,
  icon_name text,
  created_at timestamptz not null default now()
);

update public.devops_projects
set tech_stack = '{}'
where tech_stack is null;

alter table public.devops_projects
  alter column tech_stack set default '{}',
  alter column tech_stack set not null;

create index if not exists devops_projects_created_at_idx
  on public.devops_projects (created_at desc);

-- Enable Row Level Security
alter table public.devops_projects enable row level security;

-- Public can read all projects
drop policy if exists "Public can read devops projects" on public.devops_projects;

create policy "Public can read devops projects"
  on public.devops_projects for select
  using (true);

-- Only admins can insert
drop policy if exists "Admins can insert devops projects" on public.devops_projects;

create policy "Admins can insert devops projects"
  on public.devops_projects for insert
  with check (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can update
drop policy if exists "Admins can update devops projects" on public.devops_projects;

create policy "Admins can update devops projects"
  on public.devops_projects for update
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );

-- Only admins can delete
drop policy if exists "Admins can delete devops projects" on public.devops_projects;

create policy "Admins can delete devops projects"
  on public.devops_projects for delete
  using (
    auth.jwt() -> 'app_metadata' ->> 'roles' = 'admin' OR
    auth.jwt() -> 'app_metadata' -> 'roles' @> '"admin"'::jsonb
  );
