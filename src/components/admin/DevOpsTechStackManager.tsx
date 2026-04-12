/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDevOpsTechStacks } from "../../hooks/devops/useDevOpsTechStacks";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";

export const DevOpsTechStackManager = () => {
  const { stacks, loading, saving, error, addStack, removeStack } = useDevOpsTechStacks();
  const [newStack, setNewStack] = useState("");

  const handleAdd = async () => {
    const trimmed = newStack.trim();
    if (!trimmed) return;
    playClickSound();
    await addStack(trimmed);
    setNewStack("");
  };

  const handleRemove = async (stack: string) => {
    playClickSound();
    await removeStack(stack);
  };

  if (loading) {
    return <p className="mt-4 text-sm text-gray-400">Loading tech stacks...</p>;
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-700 p-4">
      <h3 className="mb-3 text-lg font-semibold text-white">Available Tech Stacks</h3>
      <p className="mb-4 text-xs text-gray-500">
        Define the tech stack tags available when adding a DevOps project.
      </p>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {/* Chip list */}
      <div className="mb-4 flex flex-wrap gap-2">
        {stacks.length === 0 && (
          <p className="text-sm text-gray-500">No stacks yet. Add one below.</p>
        )}
        {stacks.map((stack) => (
          <span
            key={stack}
            className="flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
          >
            {stack}
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playHoverSound}
              onClick={() => void handleRemove(stack)}
              aria-label={`Remove ${stack}`}
              className="ml-1 text-blue-400 transition-colors hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </motion.button>
          </span>
        ))}
      </div>

      {/* Add new stack input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="e.g. Kubernetes"
          value={newStack}
          onChange={(e) => setNewStack(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleAdd();
            }
          }}
          className="flex-1 rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-400 focus:outline-none"
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => void handleAdd()}
          disabled={saving || !newStack.trim()}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add
        </motion.button>
      </div>
    </div>
  );
};
