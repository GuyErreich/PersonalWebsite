-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Fail closed: when the BODY marker is missing, do not return the full
-- description to anon via gamedev_items_public (coming-soon redaction).
-- Marker must match GAMEDEV_BODY_MARKER in src/lib/gamedev.ts.

create or replace function public.gamedev_public_teaser_description(p_description text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_description is null then null
    when position(E'\n\n[//]: # (BODY)\n\n' in p_description) > 0 then
      trim(
        both
        from left(
          p_description,
          position(E'\n\n[//]: # (BODY)\n\n' in p_description) - 1
        )
      )
    else null
  end;
$$;

comment on function public.gamedev_public_teaser_description(text) is
  'Fail-closed teaser for coming-soon: returns text before GAMEDEV_BODY_MARKER, or null when the marker is absent. Marker must match src/lib/gamedev.ts.';
