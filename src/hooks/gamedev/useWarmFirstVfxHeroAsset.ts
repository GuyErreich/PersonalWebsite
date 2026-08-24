/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import type { GameDevVfxItem } from "../../components/ui/gamedev/common/data/types";
import {
  warmMediaAsset,
  type WarmMediaAssetMode,
} from "../../lib/media/warmMediaAsset";

const resolveWarmMode = (
  item: Pick<GameDevVfxItem, "media_type" | "thumbnail_url">,
  reduceMotion: boolean,
): WarmMediaAssetMode => {
  if (item.media_type === "image") {
    return "hero-autoplay";
  }

  if (reduceMotion) {
    return item.thumbnail_url?.trim() ? "poster-only" : "metadata-preview";
  }

  return "hero-autoplay";
};

/**
 * Warm the first public VFX catalog item while the GameDev section is visible so
 * the initial VFX tab open can reuse cached poster/video bytes.
 */
export const useWarmFirstVfxHeroAsset = (vfxItems: GameDevVfxItem[], enabled: boolean) => {
  const reduceMotion = useReducedMotion() ?? false;
  const firstItem = vfxItems[0];
  const firstItemId = firstItem?.id;
  const firstMediaUrl = firstItem?.media_url;
  const firstMediaType = firstItem?.media_type;
  const firstThumbnailUrl = firstItem?.thumbnail_url ?? null;

  useEffect(() => {
    if (
      !enabled ||
      !firstItemId ||
      !firstMediaUrl ||
      !firstMediaType
    ) {
      return;
    }

    const cleanup = warmMediaAsset(
      {
        media_url: firstMediaUrl,
        thumbnail_url: firstThumbnailUrl,
        media_type: firstMediaType,
      },
      resolveWarmMode(
        { media_type: firstMediaType, thumbnail_url: firstThumbnailUrl },
        reduceMotion,
      ),
    );

    return cleanup;
  }, [
    enabled,
    firstItemId,
    firstMediaUrl,
    firstMediaType,
    firstThumbnailUrl,
    reduceMotion,
  ]);
};
