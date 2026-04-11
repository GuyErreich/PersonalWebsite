/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import { GameDevGallery } from "../GameDevGallery";
import { GameDevShowreelPanel } from "./GameDevShowreelPanel";
import type { GameDevIconMap, GameDevItem } from "./types";

interface GameDevOverviewPanelProps {
  showreelUrl: string | null;
  galleryItems: GameDevItem[];
  isLoading: boolean;
  iconMap: GameDevIconMap;
  onViewAll: () => void;
}

export const GameDevOverviewPanel = ({
  showreelUrl,
  galleryItems,
  isLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewPanelProps) => {
  return (
    <div className="grid h-full w-full grid-cols-1 items-start gap-4 pt-2 pb-4 md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] md:items-stretch md:gap-5 md:pt-3 md:pb-5 lg:gap-7 lg:pt-4 lg:pb-6">
      <GameDevShowreelPanel showreelUrl={showreelUrl} />

      <div className="flex min-h-0 self-stretch flex-col rounded-[2rem] border border-cyan-500/15 bg-[#08101b]/72 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl md:max-h-[70svh] sm:p-5 lg:p-6">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-emerald-300/80">
              Featured Gallery
            </p>
            <h3 className="text-xl font-bold text-white sm:text-2xl">Selected Work</h3>
          </div>
          {galleryItems.length > 0 && (
            <p className="hidden text-right text-xs uppercase tracking-[0.18em] text-gray-400 sm:block">
              {galleryItems.length} items
            </p>
          )}
        </div>
        <p className="mb-3 max-w-xl text-sm text-gray-400 sm:text-base">
          A curated set of projects and prototypes highlighting gameplay, technical systems, and
          visual polish.
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <GameDevGallery
            items={galleryItems}
            iconMap={iconMap}
            isLoading={isLoading}
            compact
            showCompactToggle={false}
          />
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, x: 3 }}
          whileTap={{ scale: 0.98 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onViewAll();
          }}
          className="mt-3 inline-flex w-fit items-center gap-2 self-end rounded-xl border border-cyan-400/45 bg-cyan-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_8px_24px_rgba(6,182,212,0.22)] transition-colors hover:bg-cyan-500/28"
        >
          View All Projects
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
};
