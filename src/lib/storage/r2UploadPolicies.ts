/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export const R2_UPLOAD_FOLDERS = {
  media: "media",
  heroShowreel: "hero-showreel",
  gameDevAssets: "gamedev-assets",
  gameDevThumbnails: "gamedev-thumbnails",
} as const;

export type R2UploadFolder = (typeof R2_UPLOAD_FOLDERS)[keyof typeof R2_UPLOAD_FOLDERS];

interface R2UploadPolicy {
  mimeTypes: readonly string[];
  extensions: readonly string[];
  maxBytes: number;
}

export const R2_UPLOAD_POLICIES: Record<R2UploadFolder, R2UploadPolicy> = {
  [R2_UPLOAD_FOLDERS.media]: {
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ],
    extensions: ["jpg", "jpeg", "png", "webp", "gif", "avif", "mp4", "webm", "ogg", "mov"],
    maxBytes: 100 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.heroShowreel]: {
    mimeTypes: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
    extensions: ["mp4", "webm", "ogg", "mov"],
    maxBytes: 200 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.gameDevAssets]: {
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ],
    extensions: ["jpg", "jpeg", "png", "webp", "gif", "avif", "mp4", "webm", "ogg", "mov"],
    maxBytes: 100 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.gameDevThumbnails]: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
    extensions: ["jpg", "jpeg", "png", "webp", "gif", "avif"],
    maxBytes: 5 * 1024 * 1024,
  },
};

export const R2_ALLOWED_FOLDERS = new Set<R2UploadFolder>(Object.values(R2_UPLOAD_FOLDERS));
