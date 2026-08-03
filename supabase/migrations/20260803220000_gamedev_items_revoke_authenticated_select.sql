-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Defense-in-depth: align authenticated with anon for base-table SELECT.
-- Public clients read gamedev_items_public; admins keep access via the
-- "Admins can read all gamedev items" SELECT policy (and elevated roles).

revoke select on table public.gamedev_items from authenticated;
