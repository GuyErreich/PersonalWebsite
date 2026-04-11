/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import { GameDevGallery } from "../GameDevGallery";
import type { GameDevIconMap, GameDevItem } from "./types";

interface GameDevAllProjectsPanelProps {
  galleryItems: GameDevItem[];
  isLoading: boolean;
  iconMap: GameDevIconMap;
  onBack: () => void;
}

export const GameDevAllProjectsPanel = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
}: GameDevAllProjectsPanelProps) => {
  return (
    <div className="h-full w-full pt-2 pb-4 md:pt-3 md:pb-5 lg:pt-4 lg:pb-6">
      <div className="flex h-full min-h-0 flex-col rounded-[2rem] border border-cyan-500/15 bg-[#08101b]/76 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-cyan-300/80">
              Full Gallery View
            </p>
            <h3 className="text-xl font-bold text-white sm:text-2xl">All Projects</h3>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, x: -3 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onBack();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/14"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </motion.button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <GameDevGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
