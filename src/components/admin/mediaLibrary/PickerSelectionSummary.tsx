/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryPickerAction } from "./MediaLibraryPickerExplorer";
import { inferMediaTypeFromUrl, mediaUrlDisplayName } from "./mediaUrlDisplayName";
import { seekThumbnailToVideoCenter } from "./videoThumbnail";

interface PickerSelectionSummaryProps {
  actions: MediaLibraryPickerAction[];
}

export const PickerSelectionSummary = ({ actions }: PickerSelectionSummaryProps) => {
  const assignedActions = actions.filter(
    (action) => action.selectedUrl && action.selectedUrl.length > 0,
  );

  if (assignedActions.length === 0) {
    return null;
  }

  return (
    <div className="border-b border-gray-700/80 bg-gray-950/40 px-4 py-2.5 sm:px-5">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
        Current selections
      </p>
      <div className="flex flex-wrap gap-2">
        {assignedActions.map((action) => {
          const url = action.selectedUrl!;
          const badge = action.badgeLabel ?? action.label;
          const displayName = mediaUrlDisplayName(url);
          const mediaType = inferMediaTypeFromUrl(url);

          return (
            <div
              key={action.id}
              className="flex max-w-full items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-1 pl-1 pr-2"
            >
              <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-black">
                {mediaType === "video" ? (
                  <video
                    src={url}
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={seekThumbnailToVideoCenter}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase text-cyan-300">{badge}</p>
                <p className="max-w-[10rem] truncate text-xs text-cyan-100 sm:max-w-[14rem]">
                  {displayName}
                </p>
              </div>

              {action.onClear ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    action.onClear?.();
                  }}
                  className="ml-1 inline-flex shrink-0 items-center gap-0.5 rounded border border-cyan-300/30 px-1.5 py-0.5 text-[10px] text-cyan-100 hover:bg-cyan-500/20"
                  aria-label={`Clear ${badge}`}
                >
                  <X className="h-3 w-3" />
                  Clear
                </motion.button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
