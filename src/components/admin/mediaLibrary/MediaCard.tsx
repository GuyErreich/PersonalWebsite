/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Image as ImageIcon, Video } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import type { MediaEntry } from "./types";
import { seekThumbnailToVideoCenter } from "./videoThumbnail";

interface Props {
  entry: MediaEntry;
  onPreview: (item: MediaLibraryItem) => void;
  onRename: (id: string, name: string) => void;
  onMoveFolder: (id: string, folder: string) => void;
}

export const MediaCard = ({ entry, onPreview, onRename, onMoveFolder }: Props) => {
  const { item } = entry;

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
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

      <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
        {item.media_type === "video" ? (
          <Video className="h-3.5 w-3.5 text-cyan-300" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 text-cyan-300" />
        )}
        <span>{item.media_type}</span>
        <span>•</span>
        <span>
          {item.file_size_bytes ? `${Math.round(item.file_size_bytes / (1024 * 1024))}MB` : "-"}
        </span>
      </div>

      <label className="mb-2 block text-xs text-gray-400">
        Name
        <input
          defaultValue={item.name}
          onBlur={(e) => {
            const nextName = e.target.value;
            if (nextName !== item.name) onRename(item.id, nextName);
          }}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
        />
      </label>

      <label className="block text-xs text-gray-400">
        Folder Path
        <input
          defaultValue={item.folder_origin ?? ""}
          onBlur={(e) => {
            const nextFolder = e.target.value;
            if (nextFolder !== (item.folder_origin ?? "")) onMoveFolder(item.id, nextFolder);
          }}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
        />
      </label>

      <p className="mt-2 truncate text-[11px] text-gray-500">Path: {entry.path || "(root)"}</p>

      <p className="mt-1 text-[11px] text-gray-500">
        Updated {new Date(item.updated_at).toLocaleString()}
      </p>

      <div className="mt-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onPreview(item);
          }}
          className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20"
        >
          View Full
        </motion.button>
      </div>
    </div>
  );
};
