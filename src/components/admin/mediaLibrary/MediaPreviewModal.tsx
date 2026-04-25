/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";

interface Props {
  item: MediaLibraryItem;
  onClose: () => void;
}

export const MediaPreviewModal = ({ item, onClose }: Props) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <motion.button
      type="button"
      whileHover={{ opacity: 1 }}
      whileTap={{ opacity: 0.95 }}
      onMouseEnter={playHoverSound}
      onClick={() => {
        playClickSound();
        onClose();
      }}
      className="absolute inset-0 bg-black/85"
      aria-label="Close preview"
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative z-10 w-full max-w-5xl rounded-xl border border-gray-700 bg-gray-900 p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-white">{item.name}</p>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:border-cyan-500/40"
        >
          Close
        </motion.button>
      </div>

      <div className="max-h-[76vh] overflow-hidden rounded-lg bg-black">
        {item.media_type === "video" ? (
          <video
            src={item.media_url}
            controls
            preload="metadata"
            className="max-h-[76vh] w-full object-contain"
          />
        ) : (
          <img
            src={item.media_url}
            alt={item.name}
            className="max-h-[76vh] w-full object-contain"
          />
        )}
      </div>
    </motion.div>
  </div>
);
