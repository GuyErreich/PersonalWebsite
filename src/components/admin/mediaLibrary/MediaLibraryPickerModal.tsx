/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { FolderOpen, X } from "lucide-react";
import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
} from "../../../lib/sound/interactionSounds";
import {
  type MediaLibraryPickerAction,
  MediaLibraryPickerExplorer,
} from "./MediaLibraryPickerExplorer";
import { PickerSelectionSummary } from "./PickerSelectionSummary";

interface MediaLibraryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  actions: MediaLibraryPickerAction[];
  onReady?: (api: { reload: () => Promise<void> }) => void;
}

const DEFAULT_DESCRIPTION =
  "Assigned items are highlighted; badges show current roles. Pick media or insert into the markdown body.";

export const MediaLibraryPickerModal = ({
  isOpen,
  onClose,
  title = "Media Library",
  description = DEFAULT_DESCRIPTION,
  actions,
  onReady,
}: MediaLibraryPickerModalProps) => {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      playMenuCloseSound();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <motion.button
        type="button"
        whileHover={{ opacity: 1 }}
        whileTap={{ opacity: 0.95 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          playMenuCloseSound();
          onClose();
        }}
        className="absolute inset-0 bg-black/80"
        aria-label="Close media library"
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-700 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
              <h2 id={titleId} className="text-base font-medium text-white sm:text-lg">
                {title}
              </h2>
            </div>
            {description ? (
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">{description}</p>
            ) : null}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              playMenuCloseSound();
              onClose();
            }}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40"
          >
            <X className="h-3.5 w-3.5" />
            Close
          </motion.button>
        </div>

        <PickerSelectionSummary actions={actions} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
          <MediaLibraryPickerExplorer
            enabled={isOpen}
            variant="modal"
            actions={actions}
            onReady={onReady}
            previewOverlayClassName="fixed inset-0 z-[70] flex items-center justify-center p-4"
          />
        </div>
      </motion.div>
    </div>,
    document.body,
  );
};
