/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Gamepad2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePaginatedNavigation } from "../../../../../hooks/pagination/usePaginatedNavigation";
import { useMediaQuery } from "../../../../../hooks/responsive/useMediaQuery";
import { useSwipeNavigation } from "../../../../../hooks/useSwipeNavigation";
import {
  buildGameDevProjectPath,
  buildGameDevSummary,
  isGameDevComingSoon,
  isImageUrl,
} from "../../../../../lib/gamedev";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { TimeoutHandle } from "../../../../../types/handles";
import { GhostSlotRepeater } from "../../../common/pagination/GhostSlotRepeater";
import { PaginatedSlideFrame } from "../../../common/pagination/PaginatedSlideFrame";
import { VerticalOffsetFrame } from "../../../common/pagination/VerticalOffsetFrame";
import { GameDevPaginationDesktop } from "../../desktop/pagination/GameDevPaginationDesktop";
import { GameDevProjectCard } from "../cards/GameDevProjectCard";
import type { GameDevItem } from "../data/types";
import { GameDevPaginationDots } from "../pagination/GameDevPaginationDots";

// ── Sub-components so hooks can be called per-item in mapped lists ──────────

// Info card used in compact mode — icon + title + description + tags + links.
// Works regardless of whether media_url is populated.
const GalleryInfoCard = ({
  item,
  index,
  iconMap,
  withThumbnail = false,
  compact = false,
  contentSized = false,
  openOnDoubleClick = false,
  skipRevealGate = false,
}: {
  item: GameDevItem;
  index: number;
  iconMap: Record<string, React.ElementType>;
  withThumbnail?: boolean;
  compact?: boolean;
  contentSized?: boolean;
  openOnDoubleClick?: boolean;
  skipRevealGate?: boolean;
}) => {
  const ProjectIcon = (
    item.icon_name ? (iconMap[item.icon_name] ?? Gamepad2) : Gamepad2
  ) as React.ComponentType<{ className?: string }>;

  const comingSoon = isGameDevComingSoon(item);
  const teaserThumbnail =
    item.thumbnail_url ??
    (item.media_url && isImageUrl(item.media_url) ? item.media_url : undefined) ??
    (item.header_media_url && isImageUrl(item.header_media_url)
      ? item.header_media_url
      : undefined) ??
    undefined;

  return (
    <GameDevProjectCard
      title={item.title}
      description={item.summary ?? buildGameDevSummary(item.description)}
      tags={item.tags}
      link={comingSoon ? null : item.github_url}
      detailsLink={buildGameDevProjectPath(item.id)}
      statusBadge={comingSoon ? "Coming Soon" : null}
      icon={<ProjectIcon className="h-6 w-6 text-purple-300 drop-shadow-[0_0_4px_currentColor]" />}
      index={index}
      compact={compact}
      contentSized={contentSized}
      openOnDoubleClick={openOnDoubleClick}
      skipRevealGate={skipRevealGate}
      thumbnailUrl={withThumbnail ? teaserThumbnail : undefined}
    />
  );
};

// ── Main component ──────────────────────────────────────────────────────────

interface GameDevGalleryProps {
  items: GameDevItem[];
  iconMap: Record<string, React.ElementType>;
  isLoading?: boolean;
  compact?: boolean;
  denseCards?: boolean;
  maxCompactItems?: number;
  mobileItemsPerPage?: number;
}

export const GameDevGallery = ({
  items,
  iconMap,
  isLoading = false,
  compact = false,
  denseCards = false,
  maxCompactItems = 4,
  mobileItemsPerPage = 1,
}: GameDevGalleryProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const mobilePageSize = Math.max(1, mobileItemsPerPage);

  // Compact slider: measure available strip height so 3 cards always fill the space
  const COMPACT_GAP = 8; // px — gap-2
  const COMPACT_CARD_H_FALLBACK = 148; // px — used until ResizeObserver fires
  const MIN_COMPACT_CARD_H = 96;
  const COMPACT_VISIBLE = isDesktop ? 3 : maxCompactItems;
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripContainerH, setStripContainerH] = useState(0);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setStripContainerH(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Non-passive native wheel listener so preventDefault() can block page scroll
  const compactWheelRef = useRef<HTMLDivElement>(null);
  const compactWheelHandlerRef = useRef<(e: WheelEvent) => void>(() => {});
  // Smooth scroll: fire at most one step per 200 ms regardless of scroll speed
  const compactWheelCooldownRef = useRef(false);
  const compactWheelCooldownTimeoutRef = useRef<TimeoutHandle | null>(null);

  useEffect(() => {
    return () => {
      if (compactWheelCooldownTimeoutRef.current !== null) {
        window.clearTimeout(compactWheelCooldownTimeoutRef.current);
        compactWheelCooldownTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!compact || !isDesktop) return;
    const el = compactWheelRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => compactWheelHandlerRef.current(e);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [compact, isDesktop]);

  // Divide measured height across the slots we actually render (not always 3).
  const layoutSlots = Math.min(COMPACT_VISIBLE, Math.max(items.length, 1));
  const dynamicCardH =
    stripContainerH > 0
      ? Math.max(
          MIN_COMPACT_CARD_H,
          Math.floor((stripContainerH - (layoutSlots - 1) * COMPACT_GAP) / layoutSlots),
        )
      : COMPACT_CARD_H_FALLBACK;
  const dynamicStep = dynamicCardH + COMPACT_GAP;
  const useStaticCompactLayout = isDesktop && items.length > 0 && items.length <= COMPACT_VISIBLE;

  // Compact slider state
  const compactMaxOffset = compact ? Math.max(0, items.length - COMPACT_VISIBLE) : 0;
  const [compactOffset, setCompactOffset] = useState(0);
  const safeCompactOffset = Math.min(compactOffset, compactMaxOffset);

  // Clamp compact offset when items length or breakpoint changes
  useEffect(() => {
    if (compactOffset !== safeCompactOffset) setCompactOffset(safeCompactOffset);
  }, [safeCompactOffset, compactOffset]);

  // Non-compact (all projects — 6 cards per page on desktop).
  //   desktop (md+) → 6 cards (2-row × 3-col, or 1-row × 6-col)
  //   mobile        → controlled via mobileItemsPerPage (default 1)
  const ITEMS_PER_PAGE = compact ? maxCompactItems : isDesktop ? 6 : mobilePageSize;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const { safePage, canPrev, canNext, direction, frameKey, goToPrev, goToNext, goToPage } =
    usePaginatedNavigation({ totalPages });

  const mobileCompactTotalPages = Math.ceil(items.length / mobilePageSize);
  const {
    safePage: safeCompactMobilePage,
    canPrev: canPrevCompactMobile,
    canNext: canNextCompactMobile,
    direction: compactMobileDirection,
    frameKey: compactMobileFrameKey,
    goToPrev: goToPrevCompactMobile,
    goToNext: goToNextCompactMobile,
    goToPage: goToCompactMobilePage,
  } = usePaginatedNavigation({ totalPages: mobileCompactTotalPages });

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (canNext) {
        playClickSound();
        goToNext();
      }
    },
    onSwipeRight: () => {
      if (canPrev) {
        playClickSound();
        goToPrev();
      }
    },
  });

  const { onTouchStart: onCompactTouchStart, onTouchEnd: onCompactTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (canNextCompactMobile) {
        playClickSound();
        goToNextCompactMobile();
      }
    },
    onSwipeRight: () => {
      if (canPrevCompactMobile) {
        playClickSound();
        goToPrevCompactMobile();
      }
    },
  });

  if (compact) {
    const canPrev = safeCompactOffset > 0;
    const canNext = safeCompactOffset < compactMaxOffset;

    const goCompactPrev = () => setCompactOffset((o) => Math.max(0, o - 1));
    const goCompactNext = () => setCompactOffset((o) => Math.min(compactMaxOffset, o + 1));

    // Update the handler ref each render so the native listener always sees fresh state
    compactWheelHandlerRef.current = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 8) return;
      e.preventDefault();
      if (compactWheelCooldownRef.current) return;
      compactWheelCooldownRef.current = true;
      if (compactWheelCooldownTimeoutRef.current !== null) {
        window.clearTimeout(compactWheelCooldownTimeoutRef.current);
      }
      compactWheelCooldownTimeoutRef.current = setTimeout(() => {
        compactWheelCooldownRef.current = false;
        compactWheelCooldownTimeoutRef.current = null;
      }, 200);
      if (e.deltaY > 0 && canNext) {
        playClickSound();
        goCompactNext();
      } else if (e.deltaY < 0 && canPrev) {
        playClickSound();
        goCompactPrev();
      }
    };

    // Mobile: freely scrollable list of all items — scroll is handled by gamedev-panel-scroll
    if (!isDesktop) {
      const compactMobilePageItems = items.slice(
        safeCompactMobilePage * mobilePageSize,
        (safeCompactMobilePage + 1) * mobilePageSize,
      );

      return (
        <div
          className="flex w-full flex-col gap-3"
          onTouchStart={onCompactTouchStart}
          onTouchEnd={onCompactTouchEnd}
        >
          {isLoading ? (
            Array.from({ length: mobilePageSize }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-gray-700/40 animate-pulse" />
            ))
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-700 p-6 text-center text-sm text-gray-500">
              No projects added yet.
            </div>
          ) : (
            <>
              <PaginatedSlideFrame
                direction={compactMobileDirection}
                frameKey={compactMobileFrameKey}
                contentClassName="grid grid-cols-1 gap-2"
              >
                {compactMobilePageItems.map((item, index) => (
                  <GalleryInfoCard
                    key={item.id}
                    item={item}
                    index={index}
                    iconMap={iconMap}
                    compact
                    skipRevealGate
                  />
                ))}
              </PaginatedSlideFrame>

              {mobileCompactTotalPages > 1 && (
                <GameDevPaginationDots
                  currentPage={safeCompactMobilePage}
                  totalPages={mobileCompactTotalPages}
                  onGoTo={goToCompactMobilePage}
                />
              )}
            </>
          )}
        </div>
      );
    }
    // Desktop: spring-animated continuous vertical strip — fills available height, 3 equal slots
    return (
      <div ref={compactWheelRef} className="flex w-full flex-col gap-3 h-full pr-1">
        {isLoading ? (
          // Skeletons fill the container using flex-1 so they match real card heights
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: COMPACT_VISIBLE }).map((_, i) => (
              <div key={i} className="flex-1 rounded-xl bg-gray-700/40 animate-pulse" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="flex min-h-0 flex-1 items-stretch gap-2">
            {useStaticCompactLayout ? (
              <div ref={stripRef} className="flex min-h-0 flex-1 flex-col gap-2">
                {items.map((item, index) => (
                  <div key={item.id} className="min-h-0 flex-1 overflow-hidden">
                    <GalleryInfoCard
                      item={item}
                      index={index}
                      iconMap={iconMap}
                      withThumbnail
                      compact
                      contentSized
                      openOnDoubleClick
                      skipRevealGate
                    />
                  </div>
                ))}
              </div>
            ) : (
              <VerticalOffsetFrame
                offset={safeCompactOffset}
                step={dynamicStep}
                viewportRef={stripRef}
              >
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="shrink-0 overflow-hidden"
                    style={{ height: dynamicCardH }}
                  >
                    <GalleryInfoCard
                      item={item}
                      index={index}
                      iconMap={iconMap}
                      withThumbnail
                      compact
                      contentSized
                      openOnDoubleClick
                      skipRevealGate
                    />
                  </div>
                ))}
              </VerticalOffsetFrame>
            )}

            {/* Dot indicators pinned to the right */}
            {!useStaticCompactLayout && compactMaxOffset > 0 ? (
              <div className="flex flex-col items-center justify-center overflow-visible py-1">
                {/* Dot indicators — one per scrollable position */}
                <div className="flex flex-col items-center gap-1">
                  {Array.from({ length: compactMaxOffset + 1 }).map((_, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      aria-label={`Go to item ${i + 1}`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                      onMouseEnter={playHoverSound}
                      onClick={() => {
                        playClickSound();
                        setCompactOffset(i);
                      }}
                      className={`block rounded-sm transition-all duration-300 ${
                        i === safeCompactOffset
                          ? "h-4 w-2 bg-purple-400"
                          : "h-2 w-2 bg-gray-600 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-gray-500">
            No projects added yet.
          </div>
        )}
      </div>
    );
  }

  // ── Full gallery — paginated grid of info cards ────────────────────────

  const pageItems = items.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);
  // denseCards → 3-col grid with content-sized rows on desktop
  const useDenseGrid = denseCards && isDesktop;

  return (
    <div
      className={
        useDenseGrid
          ? "gamedev-gallery-panel flex min-h-0 flex-1 flex-col gap-3 overflow-hidden"
          : "flex min-h-0 flex-1 flex-col gap-4"
      }
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {isLoading ? (
        <div
          className={`grid min-h-0 flex-1 grid-cols-1 gap-3 md:gap-4 ${
            useDenseGrid
              ? "gamedev-gallery-dense-grid overflow-hidden md:grid-cols-3 md:grid-rows-2 md:items-stretch"
              : "md:grid-cols-3"
          }`}
        >
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-700/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center text-gray-500">
          No projects added yet.
        </div>
      ) : (
        <>
          <PaginatedSlideFrame
            direction={direction}
            frameKey={frameKey}
            enableLayout={!useDenseGrid}
            presenceMode={useDenseGrid ? "wait" : "popLayout"}
            wrapperClassName="min-h-0 flex-1 overflow-hidden"
            clipClassName="relative min-h-0 flex-1 overflow-hidden"
            contentClassName={`grid min-h-0 grid-cols-1 gap-3 md:gap-4 ${
              useDenseGrid
                ? "gamedev-gallery-dense-grid md:grid-cols-3 md:grid-rows-2 md:items-stretch"
                : "md:grid-cols-3"
            }`}
          >
            {pageItems.map((item, index) => (
              <GalleryInfoCard
                key={item.id}
                item={item}
                index={index}
                iconMap={iconMap}
                withThumbnail
                contentSized={false}
                openOnDoubleClick={isDesktop}
                skipRevealGate={useDenseGrid}
              />
            ))}

            {/* Ghost cards pad non-dense grids; dense panels use a fixed 2×3 grid instead */}
            {!useDenseGrid ? (
              <GhostSlotRepeater
                count={Math.max(0, ITEMS_PER_PAGE - pageItems.length)}
                renderGhost={(i) => {
                  const template = pageItems[0] || items[0];
                  if (!template) return <div key={i} />;

                  return (
                    <div
                      key={`ghost-${i}`}
                      className="pointer-events-none select-none opacity-0"
                      aria-hidden="true"
                    >
                      <GalleryInfoCard
                        item={template}
                        index={i}
                        iconMap={iconMap}
                        withThumbnail
                        openOnDoubleClick={isDesktop}
                      />
                    </div>
                  );
                }}
              />
            ) : null}
          </PaginatedSlideFrame>

          {/* Pagination — colored common dots on mobile */}
          {!isDesktop && totalPages > 1 && (
            <GameDevPaginationDots
              currentPage={safePage}
              totalPages={totalPages}
              onGoTo={goToPage}
            />
          )}

          {/* Pagination — desktop controls sit below the fixed grid (no scroll container) */}
          {isDesktop && totalPages > 1 && (
            <GameDevPaginationDesktop
              currentPage={safePage}
              totalPages={totalPages}
              onPrev={goToPrev}
              onNext={goToNext}
              onGoTo={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
};
