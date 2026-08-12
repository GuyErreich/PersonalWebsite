/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export const VfxLibrarySkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }, (_, index) => (
      <div
        key={index}
        className="overflow-hidden rounded-xl border border-gray-700/70 bg-gray-900/40"
        aria-hidden="true"
      >
        <div className="aspect-video animate-pulse bg-gray-800/80" />
        <div className="space-y-2 p-3">
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-800" />
          <div className="h-2.5 w-full animate-pulse rounded bg-gray-800/80" />
        </div>
      </div>
    ))}
  </div>
);
