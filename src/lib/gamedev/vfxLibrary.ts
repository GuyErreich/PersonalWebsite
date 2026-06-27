/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { dedupeGameDevVfxByMediaUrl } from "../gamedev";
import type { MediaLibraryItem } from "../storage/mediaLibrary";
import { supabase } from "../supabase";

export interface GameDevVfxRecord {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: "video" | "image";
  tags: string[];
  sort_order: number | null;
  show_in_library?: boolean;
  created_at: string;
}

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

export const ensureVfxFromMediaLibraryItem = async (
  item: Pick<MediaLibraryItem, "name" | "media_url" | "media_type">,
): Promise<GameDevVfxRecord> => {
  const existing = await findVfxByMediaUrl(item.media_url);

  if (existing) {
    const { data, error } = await supabase
      .from("gamedev_vfx")
      .select("*")
      .eq("id", existing.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("VFX entry not found.");
    }

    return {
      ...(data as GameDevVfxRecord),
      tags: (data as GameDevVfxRecord).tags ?? [],
    };
  }

  const { data, error } = await supabase
    .from("gamedev_vfx")
    .insert([
      {
        title: item.name.trim() || "VFX",
        description: "",
        media_url: item.media_url,
        thumbnail_url: null,
        media_type: item.media_type,
        tags: [],
        sort_order: null,
        show_in_library: false,
      },
    ])
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create VFX entry.");
  }

  return {
    ...(data as GameDevVfxRecord),
    tags: (data as GameDevVfxRecord).tags ?? [],
  };
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
export const normalizeLinkedVfxIds = async (
  linkedIds: string[],
  available: Array<{ id: string; media_url: string; sort_order?: number | null; created_at?: string }>,
): Promise<string[]> => {
  const availableById = new Map(available.map((item) => [item.id, item]));
  const missingIds = linkedIds.filter((id) => !availableById.has(id));

  let mergedAvailable = available;

  if (missingIds.length > 0) {
    const { data, error } = await supabase.from("gamedev_vfx").select("*").in("id", missingIds);

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      mergedAvailable = [
        ...available,
        ...(data as Array<{ id: string; media_url: string; sort_order?: number | null; created_at?: string }>),
      ];
    }
  }

  const deduped = dedupeGameDevVfxByMediaUrl(mergedAvailable);
  const idToMedia = new Map(mergedAvailable.map((item) => [item.id, item.media_url.trim()]));
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
