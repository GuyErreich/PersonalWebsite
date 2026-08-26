/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { seekThumbnailToVideoCenter } from "../../../../../lib/media/seekThumbnailToVideoCenter";

export interface GameDevVfxRenderable {
  media_url: string;
  thumbnail_url?: string | null;
  media_type: "video" | "image";
  title: string;
}

interface GameDevVfxMediaProps {
  item: GameDevVfxRenderable;
  /** Hero / selected thumb autoplay while `isActive`; inactive surfaces stay paused. */
  surface: "hero" | "thumb";
  isActive?: boolean;
  /**
   * When false, the overview tab (or other host) is hidden but still mounted.
   * Only affects surfaces that already render `<video>`: pause and use
   * `preload="none"` — do not swap a poster `<img>` to `<video>`.
   */
  isPanelActive?: boolean;
  className?: string;
  objectFit?: "cover" | "contain";
  imgLoading?: "eager" | "lazy";
}

const shouldAutoplayVideo = (
  item: GameDevVfxRenderable,
  _surface: GameDevVfxMediaProps["surface"],
  isActive: boolean,
  reduceMotion: boolean,
): boolean => !reduceMotion && item.media_type === "video" && isActive;

interface VfxLoopVideoProps {
  item: GameDevVfxRenderable;
  autoPlay: boolean;
  className?: string;
  objectFit?: "cover" | "contain";
  /** When paused with no poster, seek to mid-frame once metadata loads. */
  seekPreviewFrame?: boolean;
  preload?: "auto" | "metadata" | "none";
}

const VfxLoopVideo = ({
  item,
  autoPlay,
  className,
  objectFit = "cover",
  seekPreviewFrame = false,
  preload = "metadata",
}: VfxLoopVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (autoPlay) {
      void video.play().catch(() => {
        // Browser autoplay policy may block until user gesture.
      });
    } else {
      video.pause();
    }

    return () => {
      video.pause();
    };
  }, [autoPlay, item.media_url]);

  return (
    <video
      ref={videoRef}
      src={item.media_url}
      poster={item.thumbnail_url ?? undefined}
      muted
      loop
      playsInline
      autoPlay={autoPlay}
      preload={preload}
      disablePictureInPicture
      disableRemotePlayback
      className={className}
      style={{ objectFit }}
      aria-label={item.title}
      aria-hidden={!autoPlay && seekPreviewFrame ? true : undefined}
      onLoadedMetadata={seekPreviewFrame ? seekThumbnailToVideoCenter : undefined}
    />
  );
};

/**
 * Renders a VFX item as image (static or GIF) or looping muted video.
 * See `src/components/ui/gamedev/AGENT.md` — VFX media contract.
 */
export const GameDevVfxMedia = ({
  item,
  surface,
  isActive = true,
  isPanelActive = true,
  className = "h-full w-full",
  objectFit = "cover",
  imgLoading = "lazy",
}: GameDevVfxMediaProps) => {
  const reduceMotion = useReducedMotion() ?? false;
  const autoPlay = shouldAutoplayVideo(item, surface, isActive, reduceMotion);
  const videoPreload = autoPlay ? "auto" : isPanelActive ? "metadata" : "none";

  if (item.media_type === "video") {
    if (autoPlay) {
      return (
        <VfxLoopVideo
          item={item}
          autoPlay
          preload={videoPreload}
          className={className}
          objectFit={objectFit}
        />
      );
    }

    // Non-playing video surfaces with a poster stay on <img> even when the
    // host panel is hidden — avoid remounting as <video> on panel hide.
    if (item.thumbnail_url) {
      return (
        <img
          src={item.thumbnail_url}
          alt=""
          loading={imgLoading}
          className={className}
          style={{ objectFit }}
        />
      );
    }

    return (
      <VfxLoopVideo
        item={item}
        autoPlay={false}
        seekPreviewFrame={isPanelActive}
        preload={videoPreload}
        className={className}
        objectFit={objectFit}
      />
    );
  }

  return (
    <img
      src={surface === "hero" ? item.media_url : (item.thumbnail_url ?? item.media_url)}
      alt={surface === "hero" ? item.title : ""}
      loading={imgLoading}
      className={className}
      style={{ objectFit }}
    />
  );
};
