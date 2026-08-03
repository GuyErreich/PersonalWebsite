-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Corrective: authenticated (admin JWTs) must retain table SELECT on
-- gamedev_items. RLS cannot restore a revoked privilege; admin clients
-- (.from('gamedev_items').select(...)) need GRANT + "Admins can read all
-- gamedev items". Anon stays revoked; public reads gamedev_items_public.

grant select on table public.gamedev_items to authenticated;
