/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import type { AdminProjectListItem } from "./types";

interface ManagedProjectsListProps {
  title: string;
  emptyText: string;
  items: AdminProjectListItem[];
  onEdit: (id: string) => void;
}

export const ManagedProjectsList = ({
  title,
  emptyText,
  items,
  onEdit,
}: ManagedProjectsListProps) => {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
          {emptyText}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{item.description}</p>
                  {item.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    onEdit(item.id);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-600/20 px-2.5 py-1 text-xs font-medium text-blue-200 hover:bg-blue-600/30"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </motion.button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
