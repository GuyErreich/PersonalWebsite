/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Image as ImageIcon, Video } from "lucide-react";
import type { MouseEvent } from "react";
import { seekThumbnailToVideoCenter } from "../../../lib/media/seekThumbnailToVideoCenter";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import type { MediaEntry } from "./types";

interface Props {
  entry: MediaEntry;
  onPreview: (item: MediaLibraryItem) => void;
  onContextMenu: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const MediaCard = ({ entry, onPreview, onContextMenu }: Props) => {
  const { item } = entry;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      draggable
      className="rounded-lg border border-gray-700 bg-gray-900/30 p-3"
      onMouseEnter={playHoverSound}
      onClick={() => {
        playClickSound();
        onPreview(item);
      }}
      onDragStartCapture={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-media-item-id", entry.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
      }}
      aria-label={`Media item: ${item.name}`}
    >
      <div
        className="mb-2 block aspect-video w-full overflow-hidden rounded bg-black"
        aria-hidden="true"
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
      </div>

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
    </motion.button>
  );
};
