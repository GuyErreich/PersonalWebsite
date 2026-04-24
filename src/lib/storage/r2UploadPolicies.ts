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
  // MIME type → allowed file extensions mapping.
  // Enforces pair-consistency: a file's MIME type and extension must both be allowed,
  // and the extension must be in the list for that specific MIME type.
  mimeTypeExtensions: Record<string, readonly string[]>;
  maxBytes: number;
}

export const R2_UPLOAD_POLICIES: Record<R2UploadFolder, R2UploadPolicy> = {
  [R2_UPLOAD_FOLDERS.media]: {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 100 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.heroShowreel]: {
    mimeTypeExtensions: {
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 200 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.gameDevAssets]: {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 100 * 1024 * 1024,
  },
  [R2_UPLOAD_FOLDERS.gameDevThumbnails]: {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
    },
    maxBytes: 5 * 1024 * 1024,
  },
};

export const R2_ALLOWED_FOLDERS = new Set<R2UploadFolder>(Object.values(R2_UPLOAD_FOLDERS));

/**
 * Extract all allowed MIME types for a given upload folder.
 * Useful for generating HTML `accept` attributes and validation sets.
 */
export const getMimeTypesForFolder = (folder: R2UploadFolder): readonly string[] => {
  return Object.keys(R2_UPLOAD_POLICIES[folder].mimeTypeExtensions);
};
