-- Copyright (c) 2026 Guy Erreich
-- SPDX-License-Identifier: MIT

create or replace function public.media_library_move_folder_recursive(
  p_source_path text,
  p_target_parent_path text
)
returns void
language plpgsql
as $$
declare
  v_source_path text := trim(both '/' from coalesce(p_source_path, ''));
  v_target_parent_path text := trim(both '/' from coalesce(p_target_parent_path, ''));
  v_source_name text;
  v_destination_path text;
begin
  if v_source_path = '' then
    raise exception 'Source path is required';
  end if;

  if v_target_parent_path = v_source_path or v_target_parent_path like v_source_path || '/%' then
    raise exception 'Cannot move a folder into itself or its descendant';
  end if;

  if not exists (select 1 from public.media_library_folders where path = v_source_path) then
    raise exception 'Source folder does not exist';
  end if;

  if v_target_parent_path <> '' and not exists (
    select 1 from public.media_library_folders where path = v_target_parent_path
  ) then
    raise exception 'Target parent folder does not exist';
  end if;

  v_source_name := split_part(v_source_path, '/', array_length(string_to_array(v_source_path, '/'), 1));
  v_destination_path := case
    when v_target_parent_path = '' then v_source_name
    else v_target_parent_path || '/' || v_source_name
  end;

  if exists (select 1 from public.media_library_folders where path = v_destination_path) then
    raise exception 'A folder with that name already exists in target';
  end if;

  update public.media_library
  set folder_origin =
    v_destination_path || substring(folder_origin from length(v_source_path) + 1)
  where folder_origin = v_source_path
    or folder_origin like v_source_path || '/%';

  update public.media_library_folders
  set
    path = v_destination_path || substring(path from length(v_source_path) + 1),
    parent_path = case
      when path = v_source_path then v_target_parent_path
      else v_destination_path || substring(parent_path from length(v_source_path) + 1)
    end
  where path = v_source_path
    or path like v_source_path || '/%';
end;
$$;

create or replace function public.media_library_rename_folder_recursive(
  p_folder_path text,
  p_new_name text,
  p_new_path_segment text
)
returns void
language plpgsql
as $$
declare
  v_folder_path text := trim(both '/' from coalesce(p_folder_path, ''));
  v_new_name text := trim(coalesce(p_new_name, ''));
  v_new_segment text := trim(both '/' from coalesce(p_new_path_segment, ''));
  v_parent_path text;
  v_new_path text;
begin
  if v_folder_path = '' then
    raise exception 'Folder path is required';
  end if;

  if v_new_name = '' or v_new_segment = '' then
    raise exception 'New folder name is required';
  end if;

  if not exists (select 1 from public.media_library_folders where path = v_folder_path) then
    raise exception 'Folder does not exist';
  end if;

  v_parent_path := case
    when strpos(v_folder_path, '/') = 0 then ''
    else regexp_replace(v_folder_path, '/[^/]+$', '')
  end;

  v_new_path := case
    when v_parent_path = '' then v_new_segment
    else v_parent_path || '/' || v_new_segment
  end;

  if v_new_path <> v_folder_path and exists (
    select 1 from public.media_library_folders where path = v_new_path
  ) then
    raise exception 'A folder with that name already exists';
  end if;

  update public.media_library
  set folder_origin = v_new_path || substring(folder_origin from length(v_folder_path) + 1)
  where folder_origin = v_folder_path
    or folder_origin like v_folder_path || '/%';

  update public.media_library_folders
  set
    name = case when path = v_folder_path then v_new_name else name end,
    path = v_new_path || substring(path from length(v_folder_path) + 1),
    parent_path = case
      when path = v_folder_path then v_parent_path
      else v_new_path || substring(parent_path from length(v_folder_path) + 1)
    end
  where path = v_folder_path
    or path like v_folder_path || '/%';
end;
$$;

create or replace function public.media_library_delete_folder_recursive(
  p_folder_path text
)
returns void
language plpgsql
as $$
declare
  v_folder_path text := trim(both '/' from coalesce(p_folder_path, ''));
begin
  if v_folder_path = '' then
    raise exception 'Folder path is required';
  end if;

  delete from public.media_library
  where folder_origin = v_folder_path
    or folder_origin like v_folder_path || '/%';

  delete from public.media_library_folders
  where path = v_folder_path
    or path like v_folder_path || '/%';
end;
$$;
