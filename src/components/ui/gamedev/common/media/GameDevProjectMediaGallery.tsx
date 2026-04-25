/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Image, Play } from "lucide-react";
import { useState } from "react";
import { inferMediaTypeFromUrl } from "../../../../../lib/gamedev";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevMediaItem } from "../data/types";

interface GameDevProjectMediaGalleryProps {
  mediaItems: GameDevMediaItem[];
  projectTitle: string;
}

const renderMainMedia = (item: GameDevMediaItem, projectTitle: string) => {
  const mediaType = item.media_type ?? inferMediaTypeFromUrl(item.media_url);

  if (mediaType === "video") {
    return (
      <video
        src={item.media_url}
        poster={item.thumbnail_url ?? undefined}
        className="h-full w-full object-cover"
        controls
        preload="metadata"
        playsInline
        loop
      />
    );
  }

  return (
    <img
      src={item.media_url}
      alt={item.caption ?? `${projectTitle} media`}
      className="h-full w-full object-cover"
      loading="lazy"
    />
  );
};

export const GameDevProjectMediaGallery = ({
  mediaItems,
  projectTitle,
}: GameDevProjectMediaGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (mediaItems.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/25 text-sm text-gray-300">
        No media uploaded yet.
      </div>
    );
  }

  const clampedIndex = Math.max(0, Math.min(activeIndex, mediaItems.length - 1));
  const activeItem = mediaItems[clampedIndex];

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-[0_24px_80px_-42px_rgba(6,182,212,0.85)]">
        <div className="aspect-video">{renderMainMedia(activeItem, projectTitle)}</div>
      </div>

      {mediaItems.length > 1 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {mediaItems.map((item, index) => {
            const mediaType = item.media_type ?? inferMediaTypeFromUrl(item.media_url);
            const isActive = index === clampedIndex;
            const previewSrc = item.thumbnail_url || item.media_url;

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  setActiveIndex(index);
                }}
                className={`relative overflow-hidden rounded-xl border ${
                  isActive
                    ? "border-cyan-400/70 ring-1 ring-cyan-300/70"
                    : "border-white/10 hover:border-white/30"
                }`}
                aria-label={`Open media ${index + 1}`}
              >
                <div className="aspect-video">
                  <img
                    src={previewSrc}
                    alt={item.caption ?? `${projectTitle} media thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-1 text-white">
                  {mediaType === "video" ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Image className="h-3.5 w-3.5" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
