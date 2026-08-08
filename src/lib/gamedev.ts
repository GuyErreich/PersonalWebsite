/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const GAMEDEV_BODY_MARKER = "\n\n[//]: # (BODY)\n\n";

const getMediaExtension = (url: string): string => {
  const normalized = url.trim().toLowerCase();
  if (!normalized) {
    return "";
  }

  try {
    const parsed = new URL(normalized, "https://placeholder.local");
    const pathname = parsed.pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot < 0) {
      return "";
    }

    return pathname.slice(lastDot);
  } catch {
    return "";
  }
};

export const buildGameDevProjectPath = (id: string) =>
  `/gamedev/projects/${encodeURIComponent(id)}`;

export const GAMEDEV_COMING_SOON_DEFAULT_SUMMARY =
  "A new project is in development. Stay tuned for updates.";

export const isGameDevComingSoon = (item: { is_coming_soon?: boolean | null }): boolean =>
  item.is_coming_soon === true;

export const markdownToPlainText = (content: string): string => {
  const plain = content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/>\s?/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/\|/g, " ")
    .replace(/[*_~]/g, "");

  return plain.replace(/\s+/g, " ").trim();
};

export const parseGameDevStoredContent = (
  content: string | null | undefined,
): { summary: string; body: string; hasStructuredBody: boolean } => {
  const normalized = content ?? "";
  const markerIndex = normalized.indexOf(GAMEDEV_BODY_MARKER);

  if (markerIndex < 0) {
    return {
      summary: markdownToPlainText(normalized).slice(0, 180),
      body: normalized,
      hasStructuredBody: false,
    };
  }

  const summary = normalized.slice(0, markerIndex).trim();
  const body = normalized.slice(markerIndex + GAMEDEV_BODY_MARKER.length).trim();

  return {
    summary,
    body,
    hasStructuredBody: true,
  };
};

export const buildGameDevStoredContent = (summary: string, body: string): string => {
  const normalizedSummary = summary.trim();
  const normalizedBody = body.trim();

  if (!normalizedSummary) return normalizedBody;
  // Teaser-only saves still need the BODY marker so fail-closed public SELECT
  // keeps the row (summary without marker is treated as unpublished).
  if (!normalizedBody) return `${normalizedSummary}${GAMEDEV_BODY_MARKER}`;

  return `${normalizedSummary}${GAMEDEV_BODY_MARKER}${normalizedBody}`;
};

export const buildGameDevSummary = (
  content: string | null | undefined,
  maxLength = 180,
): string => {
  const parsed = parseGameDevStoredContent(content);
  const source = parsed.summary.length > 0 ? parsed.summary : parsed.body;
  const plain = markdownToPlainText(source);

  if (plain.length <= maxLength) return plain;

  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
};

/**
 * Resolves the public teaser text for a Game Dev item.
 * Coming-soon rows with empty summary/description fall back to the default copy.
 */
export const resolveGameDevTeaserSummary = (
  item: {
    summary?: string | null;
    description?: string | null;
    is_coming_soon?: boolean | null;
  },
  maxLength = 180,
): string => {
  const trimmedSummary = item.summary?.trim() ?? "";
  if (trimmedSummary) return trimmedSummary;

  const fromDescription = buildGameDevSummary(item.description, maxLength);
  if (fromDescription) return fromDescription;

  if (isGameDevComingSoon(item)) return GAMEDEV_COMING_SOON_DEFAULT_SUMMARY;

  return "";
};

export const isVideoUrl = (url: string): boolean => {
  const extension = getMediaExtension(url);
  return VIDEO_EXTENSIONS.includes(extension);
};

export const isImageUrl = (url: string): boolean => {
  const extension = getMediaExtension(url);
  return IMAGE_EXTENSIONS.includes(extension);
};

export const inferMediaTypeFromUrl = (url: string): "video" | "image" => {
  if (isVideoUrl(url)) return "video";
  return "image";
};

export const inferMediaTypeFromFile = (file: File): "video" | "image" => {
  return file.type.toLowerCase().startsWith("video/") ? "video" : "image";
};

const compareNullableSort = (
  a: number | null | undefined,
  b: number | null | undefined,
): number => {
  const aVal = a ?? Number.MAX_SAFE_INTEGER;
  const bVal = b ?? Number.MAX_SAFE_INTEGER;
  if (aVal !== bVal) return aVal - bVal;
  return 0;
};

const sortByNullableOrderThenNewest = <T extends { created_at?: string }, K extends keyof T>(
  items: T[],
  orderKey: K,
): T[] =>
  [...items].sort((left, right) => {
    const sortCompare = compareNullableSort(
      left[orderKey] as number | null | undefined,
      right[orderKey] as number | null | undefined,
    );
    if (sortCompare !== 0) return sortCompare;

    const leftCreated = left.created_at ?? "";
    const rightCreated = right.created_at ?? "";
    return rightCreated.localeCompare(leftCreated);
  });

export const sortFeaturedGameDevItems = <
  T extends { featured_sort?: number | null; created_at?: string },
>(
  items: T[],
): T[] => sortByNullableOrderThenNewest(items, "featured_sort");

export const sortGameDevVfxItems = <T extends { sort_order?: number | null; created_at?: string }>(
  items: T[],
): T[] => sortByNullableOrderThenNewest(items, "sort_order");

const normalizeVfxMediaUrl = (url: string): string => url.trim();

/** Keep one VFX row per media URL (best sort_order, then newest). */
export const dedupeGameDevVfxByMediaUrl = <
  T extends { id: string; media_url: string; sort_order?: number | null; created_at?: string },
>(
  items: T[],
): T[] => {
  const byUrl = new Map<string, T>();

  for (const item of items) {
    const key = normalizeVfxMediaUrl(item.media_url);
    if (!key) continue;

    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, item);
      continue;
    }

    const existingSort = existing.sort_order ?? Number.MAX_SAFE_INTEGER;
    const itemSort = item.sort_order ?? Number.MAX_SAFE_INTEGER;
    if (itemSort < existingSort) {
      byUrl.set(key, item);
      continue;
    }

    if (itemSort === existingSort) {
      const existingCreated = existing.created_at ?? "";
      const itemCreated = item.created_at ?? "";
      if (itemCreated > existingCreated) {
        byUrl.set(key, item);
      }
    }
  }

  return sortGameDevVfxItems([...byUrl.values()]);
};

/** Dedupe by media URL while preserving the input order (first occurrence wins). */
export const dedupeGameDevVfxPreservingOrder = <T extends { id: string; media_url: string }>(
  items: T[],
): T[] => {
  const seenUrls = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = normalizeVfxMediaUrl(item.media_url);
    if (!key || seenUrls.has(key)) {
      continue;
    }

    seenUrls.add(key);
    result.push(item);
  }

  return result;
};
