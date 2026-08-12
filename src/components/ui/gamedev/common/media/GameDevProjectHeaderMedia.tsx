/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useReducedMotion } from "framer-motion";
import { inferMediaTypeFromUrl } from "../../../../../lib/gamedev";

interface GameDevProjectHeaderMediaProps {
  mediaUrl: string;
  thumbnailUrl?: string | null;
}

export const GameDevProjectHeaderMedia = ({
  mediaUrl,
  thumbnailUrl,
}: GameDevProjectHeaderMediaProps) => {
  const reduceMotion = useReducedMotion();
  const mediaType = inferMediaTypeFromUrl(mediaUrl);
  const mediaClassName =
    "absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none";
  const posterUrl = thumbnailUrl?.trim() || undefined;

  return (
    <div
      className="gamedev-project-header-media absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {mediaType === "video" ? (
        reduceMotion && posterUrl ? (
          <img src={posterUrl} alt="" loading="eager" className={mediaClassName} />
        ) : (
          <video
            src={mediaUrl}
            poster={posterUrl}
            autoPlay={!reduceMotion}
            muted
            playsInline
            loop={!reduceMotion}
            preload="metadata"
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            className={mediaClassName}
          />
        )
      ) : (
        <img src={mediaUrl} alt="" loading="eager" className={mediaClassName} />
      )}
    </div>
  );
};
