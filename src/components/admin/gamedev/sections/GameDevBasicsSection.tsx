/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { GAMEDEV_AVAILABLE_ICONS } from "../gameDevFormConstants";

interface GameDevBasicsSectionProps {
  itemTitleId: string;
  itemDescriptionId: string;
  customGameTagInputId: string;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  selectedIcon: string;
  onIconChange: (iconId: string) => void;
  selectedGameTags: string[];
  customGameTagInput: string;
  onCustomGameTagInputChange: (value: string) => void;
  onAddGameTag: () => void;
  isComingSoon: boolean;
  onComingSoonChange: (value: boolean) => void;
}

export const GameDevBasicsSection = ({
  itemTitleId,
  itemDescriptionId,
  customGameTagInputId,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  selectedIcon,
  onIconChange,
  selectedGameTags,
  customGameTagInput,
  onCustomGameTagInputChange,
  onAddGameTag,
  isComingSoon,
  onComingSoonChange,
}: GameDevBasicsSectionProps) => (
  <div className="space-y-4">
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isComingSoon}
          onChange={(event) => onComingSoonChange(event.target.checked)}
          className="mt-1 rounded border-gray-500 bg-gray-700 text-amber-400 focus:ring-amber-400"
        />
        <span>
          <span className="block text-sm font-medium text-amber-100">Coming soon project</span>
          <span className="mt-1 block text-xs text-amber-100/75">
            Quick teaser setup with relaxed media and content requirements.
          </span>
        </span>
      </label>
    </div>

    <div>
      <p className="mb-1 block text-sm font-medium text-gray-300">Project Icon</p>
      <div className="grid grid-cols-6 gap-2">
        {GAMEDEV_AVAILABLE_ICONS.map((iconOpt) => (
          <motion.button
            key={iconOpt.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onIconChange(iconOpt.id);
            }}
            className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
              selectedIcon === iconOpt.id
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
            }`}
            title={iconOpt.label}
          >
            <iconOpt.icon className="mb-1 h-5 w-5" />
            <span className="flex w-full justify-center truncate text-[10px]">{iconOpt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>

    <div>
      <label htmlFor={itemTitleId} className="block text-sm font-medium text-gray-300">
        Title
      </label>
      <input
        id={itemTitleId}
        type="text"
        required
        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor={itemDescriptionId} className="block text-sm font-medium text-gray-300">
        {isComingSoon ? "Teaser Description" : "Description (Short)"}
      </label>
      <input
        id={itemDescriptionId}
        type="text"
        required
        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
    </div>

    <div className="space-y-3">
      <p className="block text-sm font-medium text-gray-300">Project Tags</p>

      {selectedGameTags.length > 0 ? (
        <p className="text-xs text-gray-400">
          Selected: <span className="text-cyan-300">{selectedGameTags.join(", ")}</span>
        </p>
      ) : null}

      <div className="flex gap-2">
        <input
          id={customGameTagInputId}
          type="text"
          aria-label="Game Dev tag entry"
          placeholder="Add tag (e.g. VFX, Unreal, C++)"
          value={customGameTagInput}
          onChange={(e) => onCustomGameTagInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAddGameTag();
            }
          }}
          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onAddGameTag();
          }}
          disabled={!customGameTagInput.trim()}
          className="rounded-md bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-600 disabled:opacity-40"
        >
          Add
        </motion.button>
      </div>
    </div>
  </div>
);
