-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Overview "Selected Work" only shows is_featured rows. The featured column
-- was added with default false and no backfill, so existing projects vanished
-- from the overview until manually curated. Mark pre-existing rows featured.
update public.gamedev_items
set is_featured = true
where is_featured = false;
