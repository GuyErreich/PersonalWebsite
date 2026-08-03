/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { FolderOpen, Image, Play, Plus } from "lucide-react";
import { useId, useMemo } from "react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import type { AdminGameDevVfx } from "../../types";

interface GameDevDiscoverySectionProps {
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;
  featuredSort: string;
  onFeaturedSortChange: (value: string) => void;
  showVfxSection: boolean;
  onShowVfxSectionChange: (value: boolean) => void;
  availableVfx: AdminGameDevVfx[];
  linkedVfxDetails?: AdminGameDevVfx[];
  linkedVfxIds: string[];
  onLinkedVfxIdsChange: (updater: (prev: string[]) => string[]) => void;
  onOpenVfxMediaLibrary: () => void;
  /** When true, block Add/Remove/Reorder and media-library open (e.g. links still hydrating). */
  vfxLinksDisabled?: boolean;
  /** When true with vfxLinksDisabled, show failed-load messaging instead of "Loading…". */
  vfxLinksLoadFailed?: boolean;
  onRetryVfxLinksLoad?: () => void;
}

export const GameDevDiscoverySection = ({
  isFeatured,
  onIsFeaturedChange,
  featuredSort,
  onFeaturedSortChange,
  showVfxSection,
  onShowVfxSectionChange,
  availableVfx,
  linkedVfxDetails = [],
  linkedVfxIds,
  onLinkedVfxIdsChange,
  onOpenVfxMediaLibrary,
  vfxLinksDisabled = false,
  vfxLinksLoadFailed = false,
  onRetryVfxLinksLoad,
}: GameDevDiscoverySectionProps) => {
  const featuredSortId = useId();
  const vfxById = useMemo(
    () => new Map(availableVfx.map((item) => [item.id, item])),
    [availableVfx],
  );

  const linkedDetailsById = useMemo(
    () => new Map(linkedVfxDetails.map((item) => [item.id, item])),
    [linkedVfxDetails],
  );

  const linkedVfxItems = useMemo(
    () =>
      linkedVfxIds
        .map((id) => vfxById.get(id) ?? linkedDetailsById.get(id) ?? null)
        .filter((item): item is AdminGameDevVfx => item != null),
    [linkedDetailsById, linkedVfxIds, vfxById],
  );

  const unresolvedLinkedCount = linkedVfxIds.length - linkedVfxItems.length;

  const unlinkedLibraryVfx = useMemo(
    () => availableVfx.filter((item) => !linkedVfxIds.includes(item.id)),
    [availableVfx, linkedVfxIds],
  );

  return (
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
            <label htmlFor={featuredSortId} className="block text-xs text-gray-400">
              Featured order (lower appears first)
            </label>
            <input
              id={featuredSortId}
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

        {showVfxSection ? (
          <div className="mt-4 space-y-3 border-t border-gray-700/80 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-200">Project VFX</p>
              <p className="mt-1 text-xs text-gray-500">
                Choose images or videos to display in this project&apos;s VFX gallery.
              </p>
            </div>

            {vfxLinksDisabled ? (
              <div className="space-y-2 rounded-md border border-gray-600/50 bg-gray-800/60 px-3 py-2">
                <p className="text-xs text-gray-300">
                  {vfxLinksLoadFailed
                    ? "Failed to load project VFX links. Retry or cancel without saving."
                    : "Loading project VFX links…"}
                </p>
                {vfxLinksLoadFailed && onRetryVfxLinksLoad ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      onRetryVfxLinksLoad();
                    }}
                    className="inline-flex items-center rounded-md border border-cyan-500/35 bg-cyan-600/20 px-2.5 py-1 text-[11px] font-medium text-cyan-100 hover:bg-cyan-600/30"
                  >
                    Retry
                  </motion.button>
                ) : null}
              </div>
            ) : null}

            {unresolvedLinkedCount > 0 ? (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {unresolvedLinkedCount} linked effect{unresolvedLinkedCount === 1 ? "" : "s"} could
                not be loaded. Remove stale links or re-import from the media library.
              </p>
            ) : null}

            {linkedVfxItems.length === 0 ? (
              vfxLinksDisabled ? null : (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                  Add at least one image or video before saving.
                </p>
              )
            ) : (
              <ul className="space-y-2">
                {linkedVfxItems.map((vfx) => {
                  const linkIndex = linkedVfxIds.indexOf(vfx.id);

                  return (
                    <li
                      key={vfx.id}
                      className="flex items-center gap-3 rounded border border-gray-700 bg-gray-800/70 p-2"
                    >
                      <div className="h-12 w-20 shrink-0 overflow-hidden rounded bg-black">
                        {vfx.media_type === "video" ? (
                          <video
                            src={vfx.media_url}
                            poster={vfx.thumbnail_url ?? undefined}
                            muted
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={vfx.media_url}
                            alt={vfx.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-100">{vfx.title}</p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-gray-400">
                          {vfx.media_type === "video" ? (
                            <Play className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Image className="h-3 w-3" aria-hidden="true" />
                          )}
                          {vfx.media_type === "video" ? "Video" : "Image"}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={vfxLinksDisabled || linkIndex <= 0}
                          onClick={() => {
                            if (vfxLinksDisabled) {
                              return;
                            }
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
                          disabled={vfxLinksDisabled || linkIndex >= linkedVfxIds.length - 1}
                          onClick={() => {
                            if (vfxLinksDisabled) {
                              return;
                            }
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
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={vfxLinksDisabled}
                          onClick={() => {
                            if (vfxLinksDisabled) {
                              return;
                            }
                            playClickSound();
                            onLinkedVfxIdsChange((prev) => prev.filter((id) => id !== vfx.id));
                          }}
                          className="rounded border border-red-500/40 px-1.5 py-0.5 text-[10px] text-red-200 disabled:opacity-40"
                        >
                          Remove
                        </motion.button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              disabled={vfxLinksDisabled}
              onMouseEnter={playHoverSound}
              onClick={() => {
                if (vfxLinksDisabled) {
                  return;
                }
                playClickSound();
                onOpenVfxMediaLibrary();
              }}
              className="inline-flex items-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-600/20 px-3 py-2 text-xs font-medium text-cyan-100 hover:bg-cyan-600/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
              Add from Media Library
            </motion.button>

            {unlinkedLibraryVfx.length > 0 ? (
              <details className="rounded-lg border border-gray-700 bg-gray-950/40 p-3">
                <summary className="cursor-pointer text-xs font-medium text-gray-300">
                  Or link from existing VFX library ({unlinkedLibraryVfx.length})
                </summary>
                <ul className="mt-3 space-y-2">
                  {unlinkedLibraryVfx.map((vfx) => (
                    <li
                      key={vfx.id}
                      className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-800/70 px-2 py-1.5"
                    >
                      <span className="truncate text-xs text-gray-200">{vfx.title}</span>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={vfxLinksDisabled}
                        onMouseEnter={playHoverSound}
                        onClick={() => {
                          if (vfxLinksDisabled) {
                            return;
                          }
                          playClickSound();
                          onLinkedVfxIdsChange((prev) =>
                            prev.includes(vfx.id) ? prev : [...prev, vfx.id],
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded border border-cyan-500/35 px-2 py-0.5 text-[10px] text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        Add
                      </motion.button>
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};
