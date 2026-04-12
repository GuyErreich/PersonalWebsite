/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

interface DevOpsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  allStacks: string[];
  activeStack: string | null;
  onStackChange: (v: string | null) => void;
}

export const DevOpsFilterBar = ({
  search,
  onSearchChange,
  allStacks,
  activeStack,
  onStackChange,
}: DevOpsFilterBarProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const availableStacks = allStacks.filter((s) => s !== activeStack);

  return (
    <div className="mb-3 flex flex-col gap-2">
      {/* Row: search + filter button */}
      <div className="flex items-center gap-2">
        {/* Compact search */}
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pr-3 pl-8 text-xs text-white placeholder-gray-500 focus:border-blue-400/60 focus:outline-none"
          />
        </div>

        {/* Filter dropdown trigger — only shown if stacks are available */}
        {allStacks.length > 0 && (
          <div ref={dropdownRef} className="relative shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();
                setDropdownOpen((o) => !o);
              }}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              <ChevronDown
                className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.ul
                  role="listbox"
                  aria-label="Filter by tech stack"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-1 max-h-52 min-w-[160px] overflow-y-auto rounded-xl border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {availableStacks.length === 0 ? (
                    <li className="px-3 py-2 text-xs text-gray-500">All filters applied</li>
                  ) : (
                    availableStacks.map((stack) => (
                      <li key={stack}>
                        <motion.button
                          type="button"
                          role="option"
                          aria-selected={false}
                          whileHover={{ x: 2 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            onStackChange(stack);
                            setDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {stack}
                        </motion.button>
                      </li>
                    ))
                  )}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Active filter chips — only rendered when a filter is set */}
      {activeStack !== null && (
        <div className="flex flex-wrap gap-1.5">
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onStackChange(null);
            }}
            className="flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-300"
          >
            {activeStack}
            <X className="h-3 w-3" />
          </motion.button>
        </div>
      )}
    </div>
  );
};
