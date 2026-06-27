/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { inferMediaTypeFromUrl } from "../../../../../lib/gamedev";

interface GameDevProjectHeaderMediaProps {
  mediaUrl: string;
  thumbnailUrl?: string | null;
  title: string;
}

export const GameDevProjectHeaderMedia = ({
  mediaUrl,
  thumbnailUrl,
  title,
}: GameDevProjectHeaderMediaProps) => {
  const mediaType = inferMediaTypeFromUrl(mediaUrl);

  return (
    <div className="gamedev-project-header-media overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-[0_24px_80px_-48px_rgba(6,182,212,0.55)]">
      {mediaType === "video" ? (
        <video
          src={mediaUrl}
          poster={thumbnailUrl ?? undefined}
          controls
          playsInline
          loop
          className="aspect-video w-full object-cover"
          aria-label={`${title} header video`}
        />
      ) : (
        <img
          src={mediaUrl}
          alt={title}
          loading="eager"
          className="aspect-video w-full object-cover"
        />
      )}
    </div>
  );
};
