/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevVfxItem } from "../data/types";

interface GameDevVfxShowcasePanelProps {
  vfxItems: GameDevVfxItem[];
  isLoading: boolean;
}

export const GameDevVfxShowcasePanel = ({ vfxItems, isLoading }: GameDevVfxShowcasePanelProps) => {
  if (isLoading) {
    return (
      <div className="gamedev-vfx-showcase-loading">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-800/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-800/80" />
      </div>
    );
  }

  if (vfxItems.length === 0) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/25 bg-slate-900/40 px-6 py-10 text-center">
        <Sparkles className="mb-3 h-8 w-8 text-cyan-300/70" />
        <p className="text-sm font-medium text-slate-200">No VFX showcased yet</p>
        <p className="mt-1 max-w-sm text-xs text-slate-400">
          Add visual effects in management to build your effects reel here.
        </p>
      </div>
    );
  }

  return (
    <div className="gamedev-vfx-showcase-grid">
      {vfxItems.map((item) => (
        <motion.article
          key={item.id}
          whileHover={{ y: -2 }}
          onMouseEnter={playHoverSound}
          className="gamedev-vfx-showcase-card"
        >
          <div className="gamedev-vfx-showcase-media">
            {item.media_type === "video" ? (
              <video
                src={item.media_url}
                poster={item.thumbnail_url ?? undefined}
                muted
                loop
                playsInline
                autoPlay
                className="h-full w-full object-cover"
                aria-label={item.title}
              />
            ) : (
              <img
                src={item.media_url}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="gamedev-vfx-showcase-body">
            <h3 className="text-sm font-semibold text-white">{item.title}</h3>
            {item.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.description}</p>
            ) : null}

            {item.tags && item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-cyan-400/20 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </motion.article>
      ))}
    </div>
  );
};
