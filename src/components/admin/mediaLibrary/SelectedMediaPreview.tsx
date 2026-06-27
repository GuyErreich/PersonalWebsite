/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useEffect } from "react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import { inferMediaTypeFromUrl, mediaUrlDisplayName } from "./mediaUrlDisplayName";
import { seekThumbnailToVideoCenter } from "./videoThumbnail";

interface SelectedMediaPreviewProps {
  label: string;
  url: string;
  mediaType?: "image" | "video";
  onClear: () => void;
  revokeOnUnmount?: boolean;
}

export const SelectedMediaPreview = ({
  label,
  url,
  mediaType,
  onClear,
  revokeOnUnmount = false,
}: SelectedMediaPreviewProps) => {
  const resolvedType = mediaType ?? inferMediaTypeFromUrl(url);
  const displayName = mediaUrlDisplayName(url);

  useEffect(() => {
    if (!revokeOnUnmount || !url.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [revokeOnUnmount, url]);

  return (
    <div className="mb-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-300/80">{label}</p>
          <p className="truncate text-xs text-cyan-100">{displayName}</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onClear();
          }}
          className="shrink-0 rounded border border-cyan-300/40 px-2 py-0.5 text-[11px] text-cyan-100 hover:bg-cyan-500/20"
        >
          Clear
        </motion.button>
      </div>

      <div className="aspect-video w-full max-w-xs overflow-hidden rounded bg-black">
        {resolvedType === "video" ? (
          <video
            src={url}
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={seekThumbnailToVideoCenter}
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={url} alt={displayName} className="h-full w-full object-cover" />
        )}
      </div>
    </div>
  );
};
