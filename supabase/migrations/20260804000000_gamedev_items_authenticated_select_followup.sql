-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Follow-up for remotes that already applied an earlier body of
-- 20260803220000 which REVOKE'd authenticated SELECT on gamedev_items.
-- That version id will not re-run after an in-place rewrite to GRANT;
-- this later migration re-applies the privilege idempotently.
-- Anon stays revoked; public reads gamedev_items_public; RLS still
-- limits base-table rows to admins.

grant select on table public.gamedev_items to authenticated;
