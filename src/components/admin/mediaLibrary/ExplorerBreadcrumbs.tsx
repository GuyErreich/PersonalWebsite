/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";

interface Crumb {
  label: string;
  path: string;
}

interface Props {
  breadcrumbs: Crumb[];
  currentPath: string;
  setCurrentPath: (path: string) => void;
  uploading: boolean;
}

export const ExplorerBreadcrumbs = ({
  breadcrumbs,
  currentPath,
  setCurrentPath,
  uploading,
}: Props) => (
  <div className="mb-4 flex flex-wrap items-center gap-2">
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onMouseEnter={playHoverSound}
      onClick={() => {
        playClickSound();
        setCurrentPath("");
      }}
      className="inline-flex items-center gap-1 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40"
    >
      <Home className="h-3.5 w-3.5" />
      Root
    </motion.button>

    {breadcrumbs.map((crumb, index) => {
      if (index === 0) return null;

      return (
        <div key={crumb.path} className="inline-flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-gray-500" />

          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              setCurrentPath(crumb.path);
            }}
            className={`rounded-md border px-2.5 py-1.5 text-xs ${
              crumb.path === currentPath
                ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                : "border-gray-600 text-gray-200 hover:border-cyan-500/40"
            }`}
          >
            {crumb.label}
          </motion.button>
        </div>
      );
    })}

    {uploading && <span className="text-xs text-cyan-300">Uploading...</span>}
  </div>
);
