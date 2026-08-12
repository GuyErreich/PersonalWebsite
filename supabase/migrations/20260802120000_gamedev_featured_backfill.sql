-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

-- Overview "Selected Work" only shows is_featured rows. The featured column
-- was added with default false and no backfill, so existing projects vanished
-- from the overview until manually curated.
--
-- Guard: only backfill when no row is featured yet. If any is_featured=true
-- already exists, admins have started Selected Work curation — leave their
-- intentional unfeatured rows alone.
do $$
begin
  if not exists (
    select 1
    from public.gamedev_items
    where is_featured = true
  ) then
    update public.gamedev_items
    set is_featured = true
    where is_featured = false;
  end if;
end $$;
