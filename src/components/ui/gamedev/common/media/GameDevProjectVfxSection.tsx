/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevVfxItem } from "../data/types";

interface GameDevProjectVfxSectionProps {
  vfxItems: GameDevVfxItem[];
}

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
};

export const GameDevProjectVfxSection = ({ vfxItems }: GameDevProjectVfxSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const safeIndex = clampIndex(activeIndex, vfxItems.length);
  const activeItem = vfxItems[safeIndex];

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, vfxItems.length));
  }, [vfxItems.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || activeItem?.media_type !== "video") {
      return;
    }

    void video.play().catch(() => {
      // Browser autoplay policy may block until user gesture.
    });
  }, [activeItem?.id, activeItem?.media_type, activeItem?.media_url]);

  if (!activeItem) {
    return null;
  }

  const thumbPreview = (item: GameDevVfxItem) => item.thumbnail_url || item.media_url;

  return (
    <section className="mt-10 mb-10">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300/80">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Visual Effects
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
            Shaders, particles, and real-time effects from this project.
          </p>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {vfxItems.length} effect{vfxItems.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_24px_80px_-48px_rgba(15,23,42,1)]">
        <div className="aspect-video w-full">
          {activeItem.media_type === "video" ? (
            <video
              key={activeItem.id}
              ref={videoRef}
              src={activeItem.media_url}
              poster={activeItem.thumbnail_url ?? undefined}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              className="h-full w-full object-contain"
              aria-label={activeItem.title}
            />
          ) : (
            <img
              key={activeItem.id}
              src={activeItem.media_url}
              alt={activeItem.title}
              loading="eager"
              className="h-full w-full object-contain"
            />
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/65 p-4 backdrop-blur-sm md:p-5">
        <h3 className="text-lg font-semibold text-white">{activeItem.title}</h3>
        {activeItem.description ? (
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{activeItem.description}</p>
        ) : null}
        {activeItem.tags && activeItem.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeItem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {vfxItems.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {vfxItems.map((item, index) => {
            const isActive = index === safeIndex;

            return (
              <motion.button
                key={item.id}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  setActiveIndex(index);
                }}
                aria-label={`Show ${item.title}`}
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 overflow-hidden rounded-xl border ${
                  isActive
                    ? "border-cyan-400/70 ring-1 ring-cyan-300/70"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="aspect-video w-28 bg-black sm:w-32">
                  <img
                    src={thumbPreview(item)}
                    alt=""
                    loading={isActive ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};
