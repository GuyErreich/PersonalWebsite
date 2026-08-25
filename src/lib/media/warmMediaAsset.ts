/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export type WarmMediaAssetMode = "hero-autoplay" | "poster-only" | "metadata-preview";

export interface WarmMediaAssetInput {
  media_url: string;
  thumbnail_url?: string | null;
  media_type: "video" | "image";
}

export type WarmMediaAssetCleanup = () => void;

const warmImageUrl = (url: string): WarmMediaAssetCleanup => {
  const img = new Image();
  img.src = url;

  return () => {
    img.src = "";
  };
};

const warmVideoUrl = (url: string, preload: "auto" | "metadata"): WarmMediaAssetCleanup => {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = preload;
  video.src = url;
  video.load();

  return () => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  };
};

/**
 * Prefetch a single VFX/media asset outside the React tree so HTTP cache is warm
 * before a deferred panel mounts. Returns cleanup that releases retained elements.
 */
export const warmMediaAsset = (
  input: WarmMediaAssetInput,
  mode: WarmMediaAssetMode,
): WarmMediaAssetCleanup => {
  if (typeof document === "undefined") {
    return () => {};
  }

  const cleanups: WarmMediaAssetCleanup[] = [];
  const posterUrl = input.thumbnail_url?.trim() || null;
  const mediaUrl = input.media_url.trim();

  if (!mediaUrl) {
    return () => {};
  }

  if (posterUrl) {
    cleanups.push(warmImageUrl(posterUrl));
  }

  if (input.media_type === "image") {
    cleanups.push(warmImageUrl(mediaUrl));

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }

  if (mode === "poster-only") {
    if (!posterUrl) {
      cleanups.push(warmVideoUrl(mediaUrl, "metadata"));
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }

  if (mode === "metadata-preview") {
    cleanups.push(warmVideoUrl(mediaUrl, "metadata"));

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }

  cleanups.push(warmVideoUrl(mediaUrl, "auto"));

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
};
