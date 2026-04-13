/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

interface FilterChipGroupProps {
  items: string[];
  onRemove: (item: string) => void;
  onClearAll?: () => void;
  showClearAllWhenAtLeast?: number;
  className?: string;
  chipClassName?: string;
  clearClassName?: string;
  clearLabel?: string;
}

export const FilterChipGroup = ({
  items,
  onRemove,
  onClearAll,
  showClearAllWhenAtLeast = 2,
  className,
  chipClassName,
  clearClassName,
  clearLabel = "Clear all",
}: FilterChipGroupProps) => {
  if (items.length === 0) return null;

  return (
    <div className={className ?? "flex flex-wrap gap-1.5"}>
      {items.map((item) => (
        <motion.button
          key={item}
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onRemove(item);
          }}
          className={
            chipClassName ??
            "flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-300"
          }
        >
          {item}
          <X className="h-3 w-3" />
        </motion.button>
      ))}

      {onClearAll && items.length >= showClearAllWhenAtLeast && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onClearAll();
          }}
          className={
            clearClassName ??
            "flex items-center gap-1 rounded-full border border-gray-600/50 bg-gray-700/30 px-2.5 py-0.5 text-xs text-gray-400 hover:text-gray-200"
          }
        >
          {clearLabel}
        </motion.button>
      )}
    </div>
  );
};
