/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Mail, Terminal } from "lucide-react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { GitHubIcon, LinkedInIcon } from "./BrandIcons";

export const FloatingContactDock = () => {
  const year = new Date().getFullYear();

  return (
    <div className="fixed inset-x-0 bottom-4 z-[95] flex justify-center px-4 pointer-events-none md:inset-x-auto md:left-5 md:bottom-5 md:px-0">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-[#07101a]/82 px-3 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      >
        <div className="hidden items-center gap-2 border-r border-white/10 pr-3 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/8 text-cyan-300">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/80">Connect</p>
            <p className="text-sm font-semibold text-white">DevPortfolio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.a
            whileHover={{ scale: 1.08, y: -2, rotate: 4 }}
            whileTap={{ scale: 0.94 }}
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            href="https://github.com/GuyErreich"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open GitHub profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <GitHubIcon className="h-5 w-5" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.08, y: -2, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open LinkedIn profile"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-colors hover:border-[#0077b5]/40 hover:bg-[#0077b5]/12 hover:text-white"
          >
            <LinkedInIcon className="h-5 w-5" />
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.08, y: -2, rotate: 4 }}
            whileTap={{ scale: 0.94 }}
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            href="mailto:hello@example.com"
            aria-label="Send email"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/12 hover:text-emerald-300"
          >
            <Mail className="h-5 w-5" />
          </motion.a>
        </div>

        <div className="hidden border-l border-white/10 pl-3 md:block">
          <p className="text-[11px] tracking-[0.16em] text-gray-400 uppercase">{year}</p>
        </div>
      </motion.div>
    </div>
  );
};
