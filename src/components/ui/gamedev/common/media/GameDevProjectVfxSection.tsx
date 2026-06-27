/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevVfxItem } from "../data/types";

interface GameDevProjectVfxSectionProps {
  vfxItems: GameDevVfxItem[];
}

export const GameDevProjectVfxSection = ({ vfxItems }: GameDevProjectVfxSectionProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (vfxItems.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300/80">
        <Sparkles className="h-3.5 w-3.5" />
        Visual Effects
      </div>

      <div className="gamedev-vfx-grid">
        {vfxItems.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <motion.button
              key={item.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();
                setExpandedId((current) => (current === item.id ? null : item.id));
              }}
              className={`gamedev-vfx-card text-left${isExpanded ? " gamedev-vfx-card--expanded" : ""}`}
              aria-expanded={isExpanded}
            >
              <div className="gamedev-vfx-card-media">
                {item.media_type === "video" ? (
                  <video
                    src={item.media_url}
                    poster={item.thumbnail_url ?? undefined}
                    muted
                    loop
                    playsInline
                    autoPlay={isExpanded}
                    controls={isExpanded}
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

              <div className="gamedev-vfx-card-body">
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                {item.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.description}</p>
                ) : null}

                {item.tags && item.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
};
