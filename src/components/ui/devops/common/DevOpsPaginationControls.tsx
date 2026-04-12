/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

interface DevOpsPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export const DevOpsPaginationControls = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
}: DevOpsPaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <motion.button
        type="button"
        aria-label="Previous page"
        disabled={!canPrev}
        whileHover={canPrev ? { scale: 1.1 } : {}}
        whileTap={canPrev ? { scale: 0.9 } : {}}
        onMouseEnter={() => {
          if (canPrev) playHoverSound();
        }}
        onClick={() => {
          if (canPrev) {
            playClickSound();
            onPrev();
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-blue-500/40 enabled:hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              i === currentPage
                ? "h-2.5 w-2.5 bg-blue-400"
                : "h-2 w-2 bg-gray-600 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>

      <motion.button
        type="button"
        aria-label="Next page"
        disabled={!canNext}
        whileHover={canNext ? { scale: 1.1 } : {}}
        whileTap={canNext ? { scale: 0.9 } : {}}
        onMouseEnter={() => {
          if (canNext) playHoverSound();
        }}
        onClick={() => {
          if (canNext) {
            playClickSound();
            onNext();
          }
        }}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-blue-500/40 enabled:hover:text-white"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
};
