/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export { inferMediaTypeFromUrl } from "../../../lib/gamedev";

export const mediaUrlDisplayName = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split("/").filter(Boolean).at(-1);
    if (segment) {
      return decodeURIComponent(segment);
    }
  } catch {
    // Fall through for blob: and relative URLs.
  }

  const fallback = url.split("/").filter(Boolean).at(-1);
  return fallback ? decodeURIComponent(fallback.split("?")[0]) : "media";
};
