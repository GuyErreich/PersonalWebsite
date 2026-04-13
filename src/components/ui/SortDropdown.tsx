/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";

export interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  value: string;
  options: SortOption[];
  onChange: (v: string) => void;
}

export const SortDropdown = ({ value, options, onChange }: SortDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isDefault = value === options[0]?.value;

  return (
    <div ref={ref} className="relative shrink-0">
      <motion.button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          setOpen((o) => !o);
        }}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
          !isDefault
            ? "border-purple-500/50 bg-purple-500/15 text-purple-300"
            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
        }`}
      >
        <ArrowUpDown className="h-3.5 w-3.5" />
        Sort
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label="Sort order"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 py-1 shadow-xl backdrop-blur-sm"
          >
            {options.map((opt) => {
              const isActive = value === opt.value;
              return (
                <li key={opt.value}>
                  <motion.button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    whileHover={{ x: 2 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${
                      isActive ? "text-purple-300" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    {opt.label}
                    {isActive && <Check className="h-3 w-3 shrink-0 text-purple-400" />}
                  </motion.button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
