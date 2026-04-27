/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  playClickSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../../../lib/sound/interactionSounds";

interface Props {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

export const ActionDialog = ({
  title,
  placeholder,
  defaultValue = "",
  onConfirm,
  onClose,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    playMenuOpenSound();
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playMenuCloseSound();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleConfirm = () => {
    const value = inputRef.current?.value.trim() ?? "";
    if (!value) return;
    playClickSound();
    onConfirm(value);
    onClose();
  };

  const handleBackdropClick = () => {
    playMenuCloseSound();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleBackdropClick();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-80 rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>

        <input
          ref={inputRef}
          defaultValue={defaultValue}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
        />

        <div className="mt-3 flex justify-end gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBackdropClick}
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200"
          >
            Cancel
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-500"
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
