/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

interface GameDevLinksSectionProps {
  itemGithubUrlId: string;
  itemLiveUrlId: string;
  itemRepoUrlId: string;
  githubUrl: string;
  onGithubUrlChange: (value: string) => void;
  liveUrl: string;
  onLiveUrlChange: (value: string) => void;
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  isImportingRepo: boolean;
  onImportFromRepo: () => void;
}

export const GameDevLinksSection = ({
  itemGithubUrlId,
  itemLiveUrlId,
  itemRepoUrlId,
  githubUrl,
  onGithubUrlChange,
  liveUrl,
  onLiveUrlChange,
  repoUrl,
  onRepoUrlChange,
  isImportingRepo,
  onImportFromRepo,
}: GameDevLinksSectionProps) => (
  <div className="space-y-4">
    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
      <label htmlFor={itemRepoUrlId} className="block text-sm font-medium text-gray-300">
        Import from GitHub Repository
      </label>
      <p className="mt-1 text-xs text-gray-500">
        Prefills title, short description, body, tags, and repo URL.
      </p>
      <div className="mt-2 flex gap-2">
        <input
          id={itemRepoUrlId}
          type="url"
          placeholder="https://github.com/owner/repo"
          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
        />
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onImportFromRepo();
          }}
          disabled={isImportingRepo || !repoUrl.trim()}
          className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
        >
          {isImportingRepo ? "Importing..." : "Import"}
        </motion.button>
      </div>
    </div>

    <div>
      <label htmlFor={itemGithubUrlId} className="block text-sm font-medium text-gray-300">
        GitHub URL (Optional)
      </label>
      <input
        id={itemGithubUrlId}
        type="url"
        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={githubUrl}
        onChange={(e) => onGithubUrlChange(e.target.value)}
      />
    </div>

    <div>
      <label htmlFor={itemLiveUrlId} className="block text-sm font-medium text-gray-300">
        Live URL (Optional)
      </label>
      <input
        id={itemLiveUrlId}
        type="url"
        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        value={liveUrl}
        onChange={(e) => onLiveUrlChange(e.target.value)}
      />
    </div>
  </div>
);
