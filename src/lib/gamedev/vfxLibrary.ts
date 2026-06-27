/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { dedupeGameDevVfxByMediaUrl } from "../gamedev";
import { supabase } from "../supabase";

export const markVfxShownInLibrary = async (vfxIds: string[]): Promise<void> => {
  const uniqueIds = [...new Set(vfxIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("gamedev_vfx")
    .update({ show_in_library: true })
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }
};

export const findVfxByMediaUrl = async (
  mediaUrl: string,
): Promise<{ id: string } | null> => {
  const normalized = mediaUrl.trim();
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("gamedev_vfx")
    .select("id")
    .eq("media_url", normalized)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const loadPublicVfxLibraryItems = async <
  T extends {
    id: string;
    media_url: string;
    sort_order?: number | null;
    created_at?: string;
    show_in_library?: boolean;
  },
>(): Promise<T[]> => {
  const { data, error } = await supabase
    .from("gamedev_vfx")
    .select("*")
    .eq("show_in_library", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return dedupeGameDevVfxByMediaUrl((data ?? []) as unknown as T[]);
};

/** Collapse linked IDs to one canonical row per media URL. */
export const normalizeLinkedVfxIds = (
  linkedIds: string[],
  available: Array<{ id: string; media_url: string; sort_order?: number | null; created_at?: string }>,
): string[] => {
  const deduped = dedupeGameDevVfxByMediaUrl(available);
  const idToMedia = new Map(available.map((item) => [item.id, item.media_url.trim()]));
  const canonicalByMedia = new Map(deduped.map((item) => [item.media_url.trim(), item.id]));

  const normalized: string[] = [];
  const seenMedia = new Set<string>();

  for (const id of linkedIds) {
    const mediaUrl = idToMedia.get(id);
    if (!mediaUrl) {
      continue;
    }

    if (seenMedia.has(mediaUrl)) {
      continue;
    }

    seenMedia.add(mediaUrl);
    normalized.push(canonicalByMedia.get(mediaUrl) ?? id);
  }

  return normalized;
};
