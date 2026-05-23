/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { SyntheticEvent } from "react";

/**
 * Seeks a thumbnail <video> element to the midpoint of the video duration
 * once metadata has loaded. Clamps to the seekable range to avoid invalid seeks.
 */
export const seekThumbnailToVideoCenter = (event: SyntheticEvent<HTMLVideoElement>) => {
  const videoElement = event.currentTarget;
  const { duration } = videoElement;

  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }

  const midpointSeconds = duration / 2;
  const { seekable } = videoElement;
  let targetSeconds = midpointSeconds;

  if (seekable.length > 0) {
    const seekableStart = seekable.start(0);
    const seekableEnd = seekable.end(seekable.length - 1);
    targetSeconds = Math.min(
      Math.max(midpointSeconds, seekableStart),
      Math.max(seekableStart, seekableEnd - 0.05),
    );
  }

  if (!Number.isFinite(targetSeconds) || targetSeconds < 0) {
    return;
  }

  videoElement.currentTime = targetSeconds;
};
