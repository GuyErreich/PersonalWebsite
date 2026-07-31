/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Globe, Image as ImageIcon, Pencil, Play, Trash2 } from "lucide-react";
import { seekThumbnailToVideoCenter } from "../../../lib/media/seekThumbnailToVideoCenter";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { AdminGameDevVfx } from "../types";

interface VfxLibraryCardProps {
  item: AdminGameDevVfx;
  onEdit: () => void;
  onDelete: () => void;
}

export const VfxLibraryCard = ({ item, onEdit, onDelete }: VfxLibraryCardProps) => {
  const previewSrc = item.thumbnail_url ?? item.media_url;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-700/80 bg-gradient-to-b from-gray-900/80 to-gray-950/90 shadow-[0_12px_40px_-24px_rgba(6,182,212,0.45)] transition-colors hover:border-cyan-500/35">
      <div className="relative aspect-video overflow-hidden bg-black">
        {item.media_type === "video" ? (
          <video
            src={item.media_url}
            poster={item.thumbnail_url ?? undefined}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={seekThumbnailToVideoCenter}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <img
            src={previewSrc}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-90" />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90 backdrop-blur-sm">
            {item.media_type === "video" ? (
              <Play className="h-3 w-3 text-cyan-300" aria-hidden="true" />
            ) : (
              <ImageIcon className="h-3 w-3 text-cyan-300" aria-hidden="true" />
            )}
            {item.media_type}
          </span>

          {item.show_in_library ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-100 backdrop-blur-sm">
              <Globe className="h-3 w-3" aria-hidden="true" />
              Public
            </span>
          ) : null}
        </div>

        {item.sort_order != null ? (
          <span className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-medium text-gray-200 backdrop-blur-sm">
            #{item.sort_order}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-3">
          <h4 className="truncate text-sm font-semibold text-white">{item.title}</h4>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-gray-300/90">{item.description}</p>
          ) : null}
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gray-950/55 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onEdit();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-50 shadow-lg"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onDelete();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/35 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-100 shadow-lg"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </motion.button>
        </div>
      </div>

      {item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-gray-800/80 px-3 py-2.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-100"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div className="border-t border-gray-800/80 px-3 py-2.5">
          <p className="text-[11px] text-gray-500">No tags</p>
        </div>
      )}
    </article>
  );
};
