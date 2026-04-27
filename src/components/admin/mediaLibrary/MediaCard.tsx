/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Image as ImageIcon, Video } from "lucide-react";
import type { MouseEvent } from "react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import type { MediaEntry } from "./types";
import { seekThumbnailToVideoCenter } from "./videoThumbnail";

interface Props {
  entry: MediaEntry;
  onPreview: (item: MediaLibraryItem) => void;
  onContextMenu: (e: MouseEvent<HTMLDivElement>) => void;
}

export const MediaCard = ({ entry, onPreview, onContextMenu }: Props) => {
  const { item } = entry;

  return (
    <div
      role="option"
      aria-selected={false}
      tabIndex={0}
      className="rounded-lg border border-gray-700 bg-gray-900/30 p-3"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
      }}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          onPreview(item);
        }}
        className="mb-2 block aspect-video w-full overflow-hidden rounded bg-black"
        aria-label={`Preview ${item.name}`}
      >
        {item.media_type === "video" ? (
          <video
            src={item.media_url}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={seekThumbnailToVideoCenter}
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={item.media_url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </motion.button>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        {item.media_type === "video" ? (
          <Video className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
        )}
        <span className="truncate font-medium text-gray-200">{item.name}</span>
      </div>

      <p className="mt-1 text-[11px] text-gray-500">
        {item.file_size_bytes ? `${Math.round(item.file_size_bytes / (1024 * 1024))}MB` : "\u2014"}{" "}
        • {new Date(item.updated_at).toLocaleDateString()}
      </p>
    </div>
  );
};
