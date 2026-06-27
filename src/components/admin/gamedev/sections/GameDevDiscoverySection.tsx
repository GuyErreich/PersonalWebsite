/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { playClickSound } from "../../../../lib/sound/interactionSounds";
import type { AdminGameDevVfx } from "../../types";

interface GameDevDiscoverySectionProps {
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;
  featuredSort: string;
  onFeaturedSortChange: (value: string) => void;
  showVfxSection: boolean;
  onShowVfxSectionChange: (value: boolean) => void;
  availableVfx: AdminGameDevVfx[];
  linkedVfxIds: string[];
  onLinkedVfxIdsChange: (updater: (prev: string[]) => string[]) => void;
}

export const GameDevDiscoverySection = ({
  isFeatured,
  onIsFeaturedChange,
  featuredSort,
  onFeaturedSortChange,
  showVfxSection,
  onShowVfxSectionChange,
  availableVfx,
  linkedVfxIds,
  onLinkedVfxIdsChange,
}: GameDevDiscoverySectionProps) => (
  <div className="space-y-4">
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => onIsFeaturedChange(e.target.checked)}
          className="rounded border-gray-600"
        />
        Show in Selected Work
      </label>

      {isFeatured ? (
        <div className="mt-3">
          <label className="block text-xs text-gray-400">Featured order (lower appears first)</label>
          <input
            type="number"
            value={featuredSort}
            onChange={(e) => onFeaturedSortChange(e.target.value)}
            className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
          />
        </div>
      ) : null}
    </div>

    <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
      <label className="flex items-center gap-2 text-sm text-gray-200">
        <input
          type="checkbox"
          checked={showVfxSection}
          onChange={(e) => onShowVfxSectionChange(e.target.checked)}
          className="rounded border-gray-600"
        />
        Show VFX section on project page
      </label>
    </div>

    {availableVfx.length > 0 ? (
      <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
        <p className="text-sm font-medium text-gray-200">Linked VFX</p>
        <p className="text-xs text-gray-500">
          Select effects to show on this project page. Use move buttons to reorder.
        </p>

        <ul className="space-y-2">
          {availableVfx.map((vfx) => {
            const isLinked = linkedVfxIds.includes(vfx.id);
            const linkIndex = linkedVfxIds.indexOf(vfx.id);

            return (
              <li
                key={vfx.id}
                className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-800/70 px-2 py-1.5"
              >
                <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-gray-200">
                  <input
                    type="checkbox"
                    checked={isLinked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onLinkedVfxIdsChange((prev) => [...prev, vfx.id]);
                        return;
                      }

                      onLinkedVfxIdsChange((prev) => prev.filter((id) => id !== vfx.id));
                    }}
                  />
                  <span className="truncate">{vfx.title}</span>
                </label>

                {isLinked ? (
                  <div className="flex gap-1">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={linkIndex <= 0}
                      onClick={() => {
                        playClickSound();
                        onLinkedVfxIdsChange((prev) => {
                          const next = [...prev];
                          const temp = next[linkIndex - 1];
                          next[linkIndex - 1] = next[linkIndex];
                          next[linkIndex] = temp;
                          return next;
                        });
                      }}
                      className="rounded border border-gray-600 px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                    >
                      Up
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={linkIndex >= linkedVfxIds.length - 1}
                      onClick={() => {
                        playClickSound();
                        onLinkedVfxIdsChange((prev) => {
                          const next = [...prev];
                          const temp = next[linkIndex + 1];
                          next[linkIndex + 1] = next[linkIndex];
                          next[linkIndex] = temp;
                          return next;
                        });
                      }}
                      className="rounded border border-gray-600 px-1.5 py-0.5 text-[10px] disabled:opacity-40"
                    >
                      Down
                    </motion.button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    ) : null}
  </div>
);
