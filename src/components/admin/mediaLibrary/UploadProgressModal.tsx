/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";

interface UploadProgressItem {
  id: string;
  fileName: string;
  progress: number;
  status: "queued" | "uploading" | "success" | "error";
  detail?: string;
}

interface Props {
  items: UploadProgressItem[];
  uploading: boolean;
  onClose: () => void;
}

const getStatusIcon = (status: UploadProgressItem["status"]) => {
  if (status === "success") {
    return <CheckCircle2 className="h-4 w-4 text-green-300" />;
  }

  if (status === "error") {
    return <XCircle className="h-4 w-4 text-red-300" />;
  }

  if (status === "uploading") {
    return <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />;
  }

  return <AlertTriangle className="h-4 w-4 text-amber-300" />;
};

export const UploadProgressModal = ({ items, uploading, onClose }: Props) => {
  const completeCount = items.filter((item) => item.status === "success").length;
  const errorCount = items.filter((item) => item.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full max-w-2xl rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-gray-700 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Upload Queue</h3>
            <p className="mt-1 text-xs text-gray-400">
              {uploading
                ? `Uploading ${items.length} file${items.length === 1 ? "" : "s"} in parallel...`
                : `Done: ${completeCount} success, ${errorCount} failed.`}
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onClose();
            }}
            disabled={uploading}
            className="rounded-md border border-gray-600 px-3 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Close"}
          </motion.button>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border border-gray-700/80 bg-gray-800/70 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="truncate text-xs font-medium text-gray-100">{item.fileName}</p>
                <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-gray-300">
                  {getStatusIcon(item.status)}
                  <span>{item.detail ?? item.status}</span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                <div
                  className={`h-full transition-all duration-200 ${
                    item.status === "error"
                      ? "bg-red-400"
                      : item.status === "success"
                        ? "bg-green-400"
                        : "bg-cyan-400"
                  }`}
                  style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
