/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Play } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type SyntheticEvent } from "react";
import { useSwipeNavigation } from "../../../../../hooks/useSwipeNavigation";
import { vfxDeckCardVariants } from "../../../../../lib/motionVariants";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { seekThumbnailToVideoCenter } from "../../../../admin/mediaLibrary/videoThumbnail";
import type { GameDevVfxItem } from "../data/types";

interface GameDevVfxSliderProps {
  items: GameDevVfxItem[];
}

const clampIndex = (index: number, length: number) => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
};

const DECK_SPRING = { type: "spring" as const, stiffness: 340, damping: 30, mass: 0.82 };

interface VfxLoopVideoProps {
  item: GameDevVfxItem;
  autoPlay: boolean;
  className: string;
  onLoadedMetadata?: (event: SyntheticEvent<HTMLVideoElement>) => void;
}

const VfxLoopVideo = ({ item, autoPlay, className, onLoadedMetadata }: VfxLoopVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) {
      return;
    }

    void video.play().catch(() => {
      // Browser autoplay policy may block until user gesture.
    });
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
      preload={autoPlay ? "auto" : "metadata"}
      disablePictureInPicture
      disableRemotePlayback
      onLoadedMetadata={onLoadedMetadata}
      className={className}
      aria-label={item.title}
    />
  );
};

const renderVfxMedia = (
  item: GameDevVfxItem,
  variant: "hero" | "thumb",
  isActive = false,
) => {
  const className =
    variant === "hero"
      ? "h-full w-full object-cover"
      : "h-full w-full object-cover transition-transform duration-300";

  if (item.media_type === "video") {
    const shouldAutoPlay = variant === "hero" || (variant === "thumb" && isActive);

    return (
      <VfxLoopVideo
        item={item}
        autoPlay={shouldAutoPlay}
        className={className}
        onLoadedMetadata={
          variant === "thumb" && !shouldAutoPlay ? seekThumbnailToVideoCenter : undefined
        }
      />
    );
  }

  return (
    <img
      src={item.thumbnail_url ?? item.media_url}
      alt={item.title}
      loading={isActive ? "eager" : "lazy"}
      className={className}
    />
  );
};

export const GameDevVfxSlider = ({ items }: GameDevVfxSliderProps) => {
  const sliderRegionId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const directionRef = useRef(1);
  const thumbRailRef = useRef<HTMLDivElement>(null);
  const safeIndex = clampIndex(activeIndex, items.length);
  const activeItem = items[safeIndex];
  const canGoPrev = safeIndex > 0;
  const canGoNext = safeIndex < items.length - 1;

  useEffect(() => {
    setActiveIndex((current) => clampIndex(current, items.length));
  }, [items.length]);

  useEffect(() => {
    const rail = thumbRailRef.current;
    const activeThumb = rail?.querySelector<HTMLElement>(`[data-vfx-thumb-index="${safeIndex}"]`);
    activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [safeIndex]);

  const goToIndex = useCallback(
    (nextIndex: number, withSound = true) => {
      const clamped = clampIndex(nextIndex, items.length);
      if (clamped === safeIndex) return;

      directionRef.current = clamped > safeIndex ? 1 : -1;
      if (withSound) playClickSound();
      setActiveIndex(clamped);
    },
    [items.length, safeIndex],
  );

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    goToIndex(safeIndex - 1);
  }, [canGoPrev, goToIndex, safeIndex]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    goToIndex(safeIndex + 1);
  }, [canGoNext, goToIndex, safeIndex]);

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  if (!activeItem) {
    return null;
  }

  return (
    <div className="gamedev-vfx-slider">
      <div
        className="gamedev-vfx-slider-deck-zone"
        role="region"
        aria-roledescription="carousel"
        aria-label="Visual effects showcase"
        id={sliderRegionId}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {items.length > 1 ? (
          <>
            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              disabled={!canGoPrev}
              onMouseEnter={playHoverSound}
              onClick={goPrev}
              aria-label="Previous effect"
              aria-controls={sliderRegionId}
              className="gamedev-vfx-slider-nav gamedev-vfx-slider-nav--prev disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              disabled={!canGoNext}
              onMouseEnter={playHoverSound}
              onClick={goNext}
              aria-label="Next effect"
              aria-controls={sliderRegionId}
              className="gamedev-vfx-slider-nav gamedev-vfx-slider-nav--next disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </motion.button>
          </>
        ) : null}

        <div className="gamedev-vfx-slider-deck">
          {items.length > 1 ? (
            <div className="gamedev-vfx-slider-deck-stack" aria-hidden="true">
              <div className="gamedev-vfx-slider-deck-stack-card gamedev-vfx-slider-deck-stack-card--back" />
              <div className="gamedev-vfx-slider-deck-stack-card gamedev-vfx-slider-deck-stack-card--mid" />
            </div>
          ) : null}

          <AnimatePresence mode="wait" custom={directionRef.current}>
            <motion.article
              key={activeItem.id}
              custom={directionRef.current}
              variants={vfxDeckCardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={DECK_SPRING}
              style={{ transformOrigin: "center 88%" }}
              className="gamedev-vfx-slider-card"
            >
              <div className="gamedev-vfx-slider-card-media">
                {renderVfxMedia(activeItem, "hero")}
                <div className="gamedev-vfx-slider-card-shine" aria-hidden="true" />
              </div>

              <div className="gamedev-vfx-slider-card-body">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="gamedev-vfx-slider-type-badge">
                    {activeItem.media_type === "video" ? (
                      <Play className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <ImageIcon className="h-3 w-3" aria-hidden="true" />
                    )}
                    {activeItem.media_type}
                  </span>
                  {items.length > 1 ? (
                    <span className="gamedev-vfx-slider-counter">
                      {safeIndex + 1} / {items.length}
                    </span>
                  ) : null}
                </div>

                <h3 className="gamedev-vfx-slider-title">{activeItem.title}</h3>

                {activeItem.description ? (
                  <p className="gamedev-vfx-slider-description">{activeItem.description}</p>
                ) : null}

                {activeItem.tags && activeItem.tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeItem.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="gamedev-vfx-slider-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>

      {items.length > 1 ? (
        <div className="gamedev-vfx-slider-rail-wrap">
          <p className="gamedev-vfx-slider-rail-label">Browse</p>
          <div ref={thumbRailRef} className="gamedev-vfx-slider-rail">
            {items.map((item, index) => {
              const isActive = index === safeIndex;

              return (
                <motion.button
                  key={item.id}
                  type="button"
                  data-vfx-thumb-index={index}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => goToIndex(index)}
                  aria-label={`Show ${item.title}`}
                  aria-current={isActive ? "true" : undefined}
                  className={`gamedev-vfx-slider-thumb${isActive ? " gamedev-vfx-slider-thumb--active" : ""}`}
                >
                  <div className="gamedev-vfx-slider-thumb-media">
                    {renderVfxMedia(item, "thumb", isActive)}
                  </div>
                  <span className="gamedev-vfx-slider-thumb-title">{item.title}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};
