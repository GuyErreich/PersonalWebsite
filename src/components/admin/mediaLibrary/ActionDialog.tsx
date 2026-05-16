/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../../../lib/sound/interactionSounds";

interface Props {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  submittingLabel?: string;
  onConfirm: (value: string) => void | Promise<void>;
  onClose: () => void;
}

export const ActionDialog = ({
  title,
  placeholder,
  defaultValue = "",
  confirmLabel = "Confirm",
  submittingLabel = "Saving...",
  onConfirm,
  onClose,
}: Props) => {
  const inputId = useId();
  const inputLabelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const handleConfirm = async () => {
    const value = inputRef.current?.value.trim() ?? "";
    if (!value) return;

    setSubmitError(null);
    setIsSubmitting(true);
    playClickSound();

    try {
      await Promise.resolve(onConfirm(value));
      playMenuCloseSound();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Action failed. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <motion.button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60"
        onClick={handleBackdropClick}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative w-80 rounded-xl border border-gray-700 bg-gray-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold text-white">{title}</h3>

        <label id={inputLabelId} htmlFor={inputId} className="sr-only">
          {title}
        </label>

        <input
          id={inputId}
          ref={inputRef}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-labelledby={inputLabelId}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleConfirm();
          }}
          className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
        />

        {submitError && <p className="mt-2 text-xs text-red-300">{submitError}</p>}

        <div className="mt-3 flex justify-end gap-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={handleBackdropClick}
            disabled={isSubmitting}
            className="rounded-md px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? submittingLabel : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
