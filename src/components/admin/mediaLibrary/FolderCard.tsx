/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { FolderEntry } from "./types";

interface Props {
  entry: FolderEntry;
  onNavigate: (path: string) => void;
  onClearSearch: () => void;
}

export const FolderCard = ({ entry, onNavigate, onClearSearch }: Props) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.03, y: -2 }}
    whileTap={{ scale: 0.97 }}
    onMouseEnter={playHoverSound}
    onClick={() => {
      playClickSound();
      onNavigate(entry.path);
      onClearSearch();
    }}
    className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 text-center hover:border-cyan-500/40"
  >
    <div className="mb-2 flex aspect-video items-center justify-center rounded-md border border-gray-700 bg-gray-950/70">
      <FolderOpen className="h-10 w-10 text-cyan-300" />
    </div>

    <p className="truncate text-sm font-medium text-white">{entry.name}</p>
  </motion.button>
);
