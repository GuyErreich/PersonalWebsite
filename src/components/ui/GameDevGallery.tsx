/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../hooks/responsive/useMediaQuery";
import { useSwipeNavigation } from "../../hooks/useSwipeNavigation";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import type { GameDevItem } from "./gamedev/common/types";
import { SectionRevealContext } from "./sectionRevealContext";

// ── Sub-components so hooks can be called per-item in mapped lists ──────────

// Info card used in compact mode — icon + title + description + tags + links.
// Works regardless of whether media_url is populated.
const GalleryInfoCard = ({
  item,
  index,
  iconMap,
}: {
  item: GameDevItem;
  index: number;
  iconMap: Record<string, React.ElementType>;
}) => {
  const isRevealed = useContext(SectionRevealContext);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const ProjectIcon = (
    item.icon_name ? (iconMap[item.icon_name] ?? Gamepad2) : Gamepad2
  ) as React.ComponentType<{ className?: string }>;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isRevealed && isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.3, delay: isRevealed ? 0.1 + index * 0.07 : 0 }}
      className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-gray-800/50 p-3"
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <div className="flex shrink-0 items-center justify-center rounded-lg bg-purple-500/15 p-1.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] border border-purple-500/20">
          <ProjectIcon className="h-4 w-4 text-purple-300 drop-shadow-[0_0_4px_currentColor]" />
        </div>
        <p className="flex-1 truncate text-sm font-semibold text-white">{item.title}</p>
      </div>
      {/* Description */}
      <p className="line-clamp-2 text-xs leading-relaxed text-gray-400">{item.description}</p>
      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-purple-500/25 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-300/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

interface GameDevGalleryProps {
  items: GameDevItem[];
  iconMap: Record<string, React.ElementType>;
  isLoading?: boolean;
  compact?: boolean;
  maxCompactItems?: number;
}

export const GameDevGallery = ({
  items,
  iconMap,
  isLoading = false,
  compact = false,
  maxCompactItems = 4,
}: GameDevGalleryProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isShortScreen = useMediaQuery("(max-height: 700px)");

  const [currentPage, setCurrentPage] = useState(0);
  const directionRef = useRef(1);

  // Non-compact (all projects): desktop=6 (3-col), big mobile=6 (2-col 3-row), small mobile=4 (2-col 2-row)
  const ITEMS_PER_PAGE = compact ? maxCompactItems : isDesktop ? 6 : isShortScreen ? 4 : 6;
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));

  // Keep currentPage state in sync with safePage so navigation direction and pagination are correct
  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  const goToPrev = () => {
    directionRef.current = -1;
    setCurrentPage((p) => p - 1);
  };

  const goToNext = () => {
    directionRef.current = 1;
    setCurrentPage((p) => p + 1);
  };

  const goToPage = (page: number) => {
    directionRef.current = page > safePage ? 1 : -1;
    setCurrentPage(page);
  };

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (safePage < totalPages - 1) {
        playClickSound();
        goToNext();
      }
    },
    onSwipeRight: () => {
      if (safePage > 0) {
        playClickSound();
        goToPrev();
      }
    },
  });

  if (compact) {
    const displayItems = items.slice(0, maxCompactItems);

    return (
      <div className="w-full">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: maxCompactItems }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-700/40 animate-pulse" />
            ))}
          </div>
        ) : displayItems.length > 0 ? (
          <div className="flex flex-col gap-2">
            {displayItems.map((item, index) => (
              <GalleryInfoCard key={item.id} item={item} index={index} iconMap={iconMap} />
            ))}
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
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  return (
    <div className="flex flex-col gap-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-700/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-700 p-8 text-center text-gray-500">
          No projects added yet.
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={`page-${safePage}-${ITEMS_PER_PAGE}`}
              initial={{ opacity: 0, x: directionRef.current * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: directionRef.current * -50 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {pageItems.map((item, index) => (
                <GalleryInfoCard key={item.id} item={item} index={index} iconMap={iconMap} />
              ))}
            </motion.div>
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <motion.button
                type="button"
                aria-label="Previous page"
                disabled={!canPrev}
                whileHover={canPrev ? { scale: 1.1 } : {}}
                whileTap={canPrev ? { scale: 0.9 } : {}}
                onMouseEnter={() => {
                  if (canPrev) playHoverSound();
                }}
                onClick={() => {
                  if (canPrev) {
                    playClickSound();
                    goToPrev();
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-purple-500/40 enabled:hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </motion.button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <motion.button
                    key={i}
                    type="button"
                    aria-label={`Go to page ${i + 1}`}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.85 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      goToPage(i);
                    }}
                    className={`block rounded-full transition-all duration-300 ${
                      i === safePage
                        ? "h-2.5 w-2.5 bg-purple-400"
                        : "h-2 w-2 bg-gray-600 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              <motion.button
                type="button"
                aria-label="Next page"
                disabled={!canNext}
                whileHover={canNext ? { scale: 1.1 } : {}}
                whileTap={canNext ? { scale: 0.9 } : {}}
                onMouseEnter={() => {
                  if (canNext) playHoverSound();
                }}
                onClick={() => {
                  if (canNext) {
                    playClickSound();
                    goToNext();
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-purple-500/40 enabled:hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
