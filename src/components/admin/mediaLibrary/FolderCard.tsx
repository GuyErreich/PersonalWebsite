/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Folder } from "lucide-react";
import type { MouseEvent } from "react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { FolderEntry } from "./types";

interface Props {
  entry: FolderEntry;
  onNavigate: (path: string) => void;
  onClearSearch: () => void;
  onContextMenu: (e: MouseEvent<HTMLButtonElement>) => void;
}

export const FolderCard = ({ entry, onNavigate, onClearSearch, onContextMenu }: Props) => (
  <div className="flex flex-col items-center gap-2">
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={playHoverSound}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e);
      }}
      onClick={() => {
        playClickSound();
        onNavigate(entry.path);
        onClearSearch();
      }}
      className="flex h-36 w-44 items-center justify-center rounded-xl border border-transparent text-left transition-all hover:border-amber-300/30 hover:bg-amber-200/5"
      aria-label={`Open folder: ${entry.name}`}
    >
      <Folder className="h-24 w-24 text-amber-400 drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)]" />
    </motion.button>

    {/* Folder name label */}
    <p className="w-44 truncate text-center text-xs font-medium text-gray-200">{entry.name}</p>
  </div>
);
