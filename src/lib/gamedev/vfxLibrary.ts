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

/** Client-only catalog picks that must not hit `gamedev_vfx` until project save. */
export const PROVISIONAL_VFX_ID_PREFIX = "provisional:" as const;

export const isProvisionalVfxId = (id: string): boolean => id.startsWith(PROVISIONAL_VFX_ID_PREFIX);

export const makeProvisionalVfxId = (mediaUrl: string): string =>
  `${PROVISIONAL_VFX_ID_PREFIX}${mediaUrl.trim()}`;

export const provisionalVfxMediaUrl = (id: string): string | null =>
  isProvisionalVfxId(id) ? id.slice(PROVISIONAL_VFX_ID_PREFIX.length) : null;

export const buildProvisionalVfxFromMediaLibraryItem = (
  item: Pick<MediaLibraryItem, "name" | "media_url" | "media_type">,
): GameDevVfxRecord => {
  const mediaUrl = item.media_url.trim();

  return {
    id: makeProvisionalVfxId(mediaUrl),
    title: item.name.trim() || "VFX",
    description: "",
    media_url: mediaUrl,
    thumbnail_url: null,
    media_type: item.media_type,
    tags: [],
    sort_order: null,
    show_in_library: false,
    // Epoch so a persisted row with the same media_url wins catalog dedupe.
    created_at: new Date(0).toISOString(),
  };
};

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

const toVfxRecord = (data: GameDevVfxRecord): GameDevVfxRecord => ({
  ...data,
  tags: data.tags ?? [],
});

/** Load a persisted catalog row by media URL without inserting. */
export const getVfxByMediaUrl = async (mediaUrl: string): Promise<GameDevVfxRecord | null> => {
  const existing = await findVfxByMediaUrl(mediaUrl);
  if (!existing) {
    return null;
  }

  const { data, error } = await supabase
    .from("gamedev_vfx")
    .select("*")
    .eq("id", existing.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return toVfxRecord(data as GameDevVfxRecord);
};

export const ensureVfxFromMediaLibraryItem = async (
  item: Pick<MediaLibraryItem, "name" | "media_url" | "media_type">,
): Promise<{ record: GameDevVfxRecord; created: boolean }> => {
  const existing = await getVfxByMediaUrl(item.media_url);
  if (existing) {
    return { record: existing, created: false };
  }

  const { data, error } = await supabase
    .from("gamedev_vfx")
    .insert([
      {
        title: item.name.trim() || "VFX",
        description: "",
        media_url: item.media_url.trim(),
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
    if (error?.code === "23505") {
      const conflictExisting = await getVfxByMediaUrl(item.media_url);
      if (conflictExisting) {
        return { record: conflictExisting, created: false };
      }
    }

    throw new Error(error?.message ?? "Failed to create VFX entry.");
  }

  return { record: toVfxRecord(data as GameDevVfxRecord), created: true };
};

/**
 * Persist provisional project-form VFX picks. Returns remapped IDs plus any rows
 * this call newly inserted (for cleanup if link sync fails afterward).
 */
export const materializeProvisionalLinkedVfx = async (
  linkedIds: string[],
  available: Array<{
    id: string;
    title: string;
    media_url: string;
    media_type: "video" | "image";
  }>,
): Promise<{
  linkedIds: string[];
  available: Array<{
    id: string;
    title: string;
    media_url: string;
    media_type: "video" | "image";
    sort_order?: number | null;
    created_at?: string;
  }>;
  createdVfxIds: string[];
}> => {
  const availableById = new Map(available.map((item) => [item.id, item]));
  const idMap = new Map<string, string>();
  const createdVfxIds: string[] = [];
  const materializedRows: GameDevVfxRecord[] = [];

  try {
    for (const id of linkedIds) {
      if (!isProvisionalVfxId(id) || idMap.has(id)) {
        continue;
      }

      const mediaUrl = provisionalVfxMediaUrl(id);
      if (!mediaUrl) {
        throw new Error("Provisional VFX pick is missing media.");
      }

      const entry =
        availableById.get(id) ?? available.find((item) => item.media_url.trim() === mediaUrl);

      const alreadyPersisted = await getVfxByMediaUrl(mediaUrl);
      if (alreadyPersisted) {
        idMap.set(id, alreadyPersisted.id);
        materializedRows.push(alreadyPersisted);
        continue;
      }

      if (!entry) {
        throw new Error("Provisional VFX pick is missing from the in-modal catalog.");
      }

      const { record: vfx, created } = await ensureVfxFromMediaLibraryItem({
        name: entry.title,
        media_url: mediaUrl,
        media_type: entry.media_type,
      });

      if (created) {
        createdVfxIds.push(vfx.id);
      }
      idMap.set(id, vfx.id);
      materializedRows.push(vfx);
    }
  } catch (error) {
    if (createdVfxIds.length > 0) {
      await supabase.from("gamedev_vfx").delete().in("id", createdVfxIds);
    }
    throw error;
  }

  if (idMap.size === 0) {
    return { linkedIds, available, createdVfxIds };
  }

  const remappedLinkedIds = linkedIds.map((id) => idMap.get(id) ?? id);
  const withoutProvisionals = available.filter((item) => !isProvisionalVfxId(item.id));

  return {
    linkedIds: remappedLinkedIds,
    available: [...withoutProvisionals, ...materializedRows],
    createdVfxIds,
  };
};

export const findVfxByMediaUrl = async (mediaUrl: string): Promise<{ id: string } | null> => {
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

export const loadPublicVfxLibraryItems = async (): Promise<GameDevVfxRecord[]> => {
  const { data, error } = await supabase
    .from("gamedev_vfx")
    .select("*")
    .eq("show_in_library", true)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []).map((item) => ({
    ...(item as GameDevVfxRecord),
    tags: (item as GameDevVfxRecord).tags ?? [],
  }));

  return dedupeGameDevVfxByMediaUrl(rows);
};

/** Collapse linked IDs to one canonical row per media URL. */
export const normalizeLinkedVfxIds = async (
  linkedIds: string[],
  available: Array<{
    id: string;
    media_url: string;
    sort_order?: number | null;
    created_at?: string;
  }>,
): Promise<string[]> => {
  const availableById = new Map(available.map((item) => [item.id, item]));
  const missingIds = linkedIds.filter((id) => !availableById.has(id));
  const provisionalMissingIds = missingIds.filter(isProvisionalVfxId);
  const dbMissingIds = missingIds.filter((id) => !isProvisionalVfxId(id));

  let mergedAvailable = [...available];

  // Provisional IDs embed media_url; resolve them locally so they never hit `.in('id')`
  // (Postgres uuid parse error) when catalog merge dropped them from `available`.
  for (const id of provisionalMissingIds) {
    const mediaUrl = provisionalVfxMediaUrl(id)?.trim();
    if (!mediaUrl) {
      continue;
    }

    const mediaMatch = mergedAvailable.find((item) => item.media_url.trim() === mediaUrl);
    mergedAvailable.push({
      id,
      media_url: mediaUrl,
      sort_order: mediaMatch?.sort_order ?? null,
      created_at: mediaMatch?.created_at,
    });
  }

  if (dbMissingIds.length > 0) {
    const { data, error } = await supabase.from("gamedev_vfx").select("*").in("id", dbMissingIds);

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      mergedAvailable = [
        ...mergedAvailable,
        ...(data as Array<{
          id: string;
          media_url: string;
          sort_order?: number | null;
          created_at?: string;
        }>),
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
