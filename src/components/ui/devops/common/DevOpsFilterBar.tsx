/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "../../../../hooks/responsive/useMediaQuery";
import type { DevOpsSortKey } from "../../../../hooks/devops/useDevOpsFilter";
import { useScrollContainer } from "../../../../lib/ScrollContainerContext";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { SearchInput } from "../../common/controls/SearchInput";
import { FilterChipGroup } from "../../common/filters/FilterChipGroup";
import { ScrollViewport } from "../../common/scroll/ScrollViewport";
import { DevOpsLetterTouchBubble } from "../mobile/DevOpsLetterTouchBubble";
import type { SortOption } from "../../SortDropdown";
import { SortDropdown } from "../../SortDropdown";

interface DevOpsFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  allStacks: string[];
  activeStacks: string[];
  onStackToggle: (v: string) => void;
  onClearStacks: () => void;
  sortKey: DevOpsSortKey;
  onSortChange: (v: DevOpsSortKey) => void;
}

const DEVOPS_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
  { value: "date-desc", label: "Newest first" },
  { value: "date-asc", label: "Oldest first" },
];

const PER_PAGE = 5;
const ITEM_HEIGHT = 30;

export const DevOpsFilterBar = ({
  search,
  onSearchChange,
  allStacks,
  activeStacks,
  onStackToggle,
  onClearStacks,
  sortKey,
  onSortChange,
}: DevOpsFilterBarProps) => {
  const scrollContainer = useScrollContainer();
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Swipe navigation for filter list (mobile only)
  // Only use custom vertical swipe logic below for filter list paging

  // For vertical swipe, treat up as next page, down as prev page
  const swipeStartY = useRef<number | undefined>(undefined);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !dropdownOpen) return;
    const touch = e.changedTouches[0];
    const startY = swipeStartY.current;
    if (startY === undefined) return;
    const dy = startY - touch.clientY;
    if (Math.abs(dy) < 30) return;
    if (dy > 0 && offsetRef.current < maxOffsetRef.current) {
      setOffset(Math.min(maxOffsetRef.current, offsetRef.current + 1));
    } else if (dy < 0 && offsetRef.current > 0) {
      setOffset(Math.max(0, offsetRef.current - 1));
    }
    swipeStartY.current = undefined;
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile || !dropdownOpen) return;
    swipeStartY.current = e.touches[0].clientY;
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stackSearch, setStackSearch] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [touchLetter, setTouchLetter] = useState<string | null>(null);
  const [touchBubblePos, setTouchBubblePos] = useState<{ x: number; y: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stackSearchRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const scrollportRef = useRef<HTMLDivElement>(null);
  const letterSidebarRef = useRef<HTMLDivElement>(null);
  const lastTouchedLetterRef = useRef<string | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const filteredLengthRef = useRef(0);
  // Smooth scroll: one page advance per 220 ms regardless of how fast the user scrolls
  const wheelCooldownRef = useRef(false);
  const offsetRef = useRef(0);
  const maxOffsetRef = useRef(0);

  // Re-evaluate which item under the cursor using coordinate math —
  // works during CSS translateY transition because the scrollport rect never moves.
  const updateHoveredFromMouse = useCallback((currentOffset?: number) => {
    const pos = mousePos.current;
    const viewport = scrollportRef.current;
    if (!pos || !viewport) {
      setHoveredIdx(null);
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const relY = pos.y - rect.top;
    if (relY < 0 || relY > PER_PAGE * ITEM_HEIGHT) {
      setHoveredIdx(null);
      return;
    }
    const visualSlot = Math.floor(relY / ITEM_HEIGHT);
    const off = currentOffset ?? offsetRef.current;
    const globalIdx = off + visualSlot;
    setHoveredIdx(globalIdx < filteredLengthRef.current ? globalIdx : null);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setStackSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Auto-focus the stack search input when the dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      void Promise.resolve().then(() => stackSearchRef.current?.focus());
    } else {
      setStackSearch("");
    }
  }, [dropdownOpen]);

  const filteredStacks = stackSearch.trim()
    ? allStacks.filter((s) => s.toLowerCase().includes(stackSearch.toLowerCase()))
    : allStacks;

  useEffect(() => {
    filteredLengthRef.current = filteredStacks.length;
  }, [filteredStacks.length]);

  const maxOffset = Math.max(0, filteredStacks.length - PER_PAGE);
  const safeOffset = Math.max(0, Math.min(offset, maxOffset));
  const pageStacks = filteredStacks.slice(safeOffset, safeOffset + PER_PAGE);
  const canUp = safeOffset > 0;
  const canDown = safeOffset < maxOffset;

  // Keep refs in sync so the stable wheel listener can read current values
  useEffect(() => {
    offsetRef.current = safeOffset;
  }, [safeOffset]);
  useEffect(() => {
    maxOffsetRef.current = maxOffset;
  }, [maxOffset]);

  // Reset offset when search changes
  useEffect(() => {
    setOffset(0);
  }, [stackSearch]);

  // Lock the page scroll container while the dropdown is open
  useEffect(() => {
    const el = scrollContainer?.current as HTMLElement | null;
    if (!el) return;
    if (dropdownOpen) {
      el.style.overflow = "hidden";
      return () => {
        el.style.overflow = "";
      };
    }
  }, [dropdownOpen, scrollContainer]);

  // Native non-passive wheel listener — re-attaches whenever the dropdown opens
  // (listContainerRef is null while closed, so we must depend on dropdownOpen)
  useEffect(() => {
    if (!dropdownOpen) return;
    const el = listContainerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldownRef.current) return;
      wheelCooldownRef.current = true;
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 80);
      let newOffset = offsetRef.current;
      if (e.deltaY > 0 && offsetRef.current < maxOffsetRef.current) {
        newOffset = Math.min(maxOffsetRef.current, offsetRef.current + 1);
      } else if (e.deltaY < 0 && offsetRef.current > 0) {
        newOffset = Math.max(0, offsetRef.current - 1);
      }
      if (newOffset !== offsetRef.current) {
        setOffset(newOffset);
        if (mousePos.current) updateHoveredFromMouse(newOffset);
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [dropdownOpen, updateHoveredFromMouse]);

  // A-Z sidebar: letter → centered offset so the middle item of that letter's group
  // lands at visual position 2 (center of the 5-item window)
  const letterIndex = useMemo(() => {
    const map = new Map<string, number>();
    const groups = new Map<string, number[]>();
    filteredStacks.forEach((stack, i) => {
      const letter = stack[0]?.toUpperCase() ?? "#";
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter)!.push(i);
    });
    const mo = Math.max(0, filteredStacks.length - PER_PAGE);
    groups.forEach((indices, letter) => {
      const middleIdx = indices[Math.floor((indices.length - 1) / 2)];
      map.set(letter, Math.max(0, Math.min(middleIdx - 2, mo)));
    });
    return map;
  }, [filteredStacks]);

  const pageLetters = useMemo(
    () => new Set(pageStacks.map((s) => s[0]?.toUpperCase() ?? "#")),
    [pageStacks],
  );

  const letterEntries = useMemo(() => [...letterIndex.entries()], [letterIndex]);

  const updateLetterFromTouch = useCallback(
    (touch: React.Touch) => {
      const sidebar = letterSidebarRef.current;
      if (!sidebar || letterEntries.length === 0) return;

      const rect = sidebar.getBoundingClientRect();
      const relY = touch.clientY - rect.top;
      const clampedY = Math.max(0, Math.min(rect.height - 1, relY));
      const slotHeight = rect.height / letterEntries.length;
      const slot = Math.min(letterEntries.length - 1, Math.floor(clampedY / slotHeight));
      const [letter, targetOffset] = letterEntries[slot];

      if (lastTouchedLetterRef.current !== letter) {
        playHoverSound();
        lastTouchedLetterRef.current = letter;
      }

      setHoveredLetter(letter);
      setTouchLetter(letter);
      setTouchBubblePos({ x: rect.width / 2, y: clampedY });
      setOffset(targetOffset);
    },
    [letterEntries],
  );

  const handleLetterTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    updateLetterFromTouch(e.touches[0]);
  };

  const handleLetterTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;
    e.preventDefault();
    updateLetterFromTouch(e.touches[0]);
  };

  const handleLetterTouchEnd = () => {
    setTouchLetter(null);
    setTouchBubblePos(null);
    setHoveredLetter(null);
    lastTouchedLetterRef.current = null;
  };

  return (
    <div className="mb-3 flex flex-col gap-2">
      {/* Row: search + filter button */}
      <div className="flex items-center gap-2">
        {/* Compact search */}
        <SearchInput
          value={search}
          onValueChange={onSearchChange}
          placeholder="Search..."
        />

        {/* Filter dropdown trigger — only shown if stacks are available */}
        {allStacks.length > 0 && (
          <div ref={dropdownRef} className="relative shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();
                setDropdownOpen((o) => !o);
              }}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                activeStacks.length > 0
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeStacks.length > 0 && (
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-500/40 px-1 text-[10px] font-semibold text-blue-200">
                  {activeStacks.length}
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  role="dialog"
                  aria-label="Filter by tech stack"
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-gray-900/95 shadow-xl backdrop-blur-sm"
                >
                  {/* Search inside the dropdown */}
                  <div className="border-b border-white/8 p-2">
                    <SearchInput
                      inputRef={stackSearchRef}
                      value={stackSearch}
                      onValueChange={setStackSearch}
                      placeholder="Search stacks..."
                      className="relative"
                      iconClassName="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-gray-500"
                      inputClassName="w-full rounded-md border border-white/10 bg-white/5 py-1 pr-2 pl-6 text-[11px] text-white placeholder-gray-600 focus:border-blue-400/50 focus:outline-none"
                    />
                  </div>

                  {/* List + A-Z sidebar */}
                  <div className="flex">
                    {/* Paginated list with subtle up/down controls */}
                    <div
                      ref={listContainerRef}
                      role="listbox"
                      aria-multiselectable="true"
                      aria-label="Tech stack options"
                      className="flex-1"
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Up arrow — only when not on first page (desktop only) */}
                      {!isMobile && (
                        <div className="flex justify-center py-0.5">
                          <motion.button
                            type="button"
                            aria-label="Previous items"
                            onClick={() => {
                              playClickSound();
                              setOffset((o) => Math.max(0, o - PER_PAGE));
                            }}
                            onMouseEnter={playHoverSound}
                            animate={{
                              opacity: canUp ? 1 : 0,
                              pointerEvents: canUp ? "auto" : "none",
                            }}
                            transition={{ duration: 0.15 }}
                            className="rounded p-0.5 text-gray-600 hover:text-gray-300"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </motion.button>
                        </div>
                      )}

                      {/* Continuous-scroll strip — fades only on search change, translates on scroll */}
                      <ScrollViewport viewportRef={scrollportRef} height={PER_PAGE * ITEM_HEIGHT}>
                        <AnimatePresence mode="wait">
                          {filteredStacks.length === 0 ? (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.12 }}
                              className="px-3 py-2 text-xs text-gray-500"
                            >
                              No matches
                            </motion.div>
                          ) : (
                            <motion.div
                              key={stackSearch}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.12 }}
                            >
                              <motion.div
                                style={{
                                  transform: `translateY(-${safeOffset * ITEM_HEIGHT}px)`,
                                  transition: "transform 0.16s ease",
                                  willChange: "transform",
                                }}
                                onMouseMove={(e) => {
                                  mousePos.current = { x: e.clientX, y: e.clientY };
                                  updateHoveredFromMouse();
                                }}
                                onMouseLeave={() => {
                                  mousePos.current = null;
                                  setHoveredIdx(null);
                                }}
                              >
                                {filteredStacks.map((stack, i) => {
                                  const isActive = activeStacks.includes(stack);
                                  const dist = hoveredIdx === null ? 0 : Math.abs(i - hoveredIdx);
                                  const t = hoveredIdx === null ? 0.25 : Math.min(dist / 2, 1);
                                  const scale = 1.12 - t * 0.34;
                                  const opacity = 1 - t * 0.6;

                                  return (
                                    <div
                                      key={stack}
                                      data-idx={i}
                                      style={{ height: ITEM_HEIGHT, overflow: "hidden" }}
                                    >
                                      <div
                                        style={{
                                          transform: `scale(${scale})`,
                                          opacity,
                                          transformOrigin: "center",
                                          transition: "transform 0.1s ease, opacity 0.1s ease",
                                        }}
                                      >
                                        <button
                                          type="button"
                                          role="option"
                                          aria-selected={isActive}
                                          onClick={() => {
                                            playClickSound();
                                            onStackToggle(stack);
                                          }}
                                          className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/10 ${
                                            isActive
                                              ? "text-blue-300"
                                              : "text-gray-300 hover:text-white"
                                          }`}
                                        >
                                          {stack}
                                          {isActive && (
                                            <Check className="h-3 w-3 shrink-0 text-blue-400" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </ScrollViewport>

                      {/* Down arrow — only when more pages below (desktop only) */}
                      {!isMobile && (
                        <div className="flex justify-center py-0.5">
                          <motion.button
                            type="button"
                            aria-label="Next items"
                            onClick={() => {
                              playClickSound();
                              setOffset((o) => Math.min(maxOffset, o + PER_PAGE));
                            }}
                            onMouseEnter={playHoverSound}
                            animate={{
                              opacity: canDown ? 1 : 0,
                              pointerEvents: canDown ? "auto" : "none",
                            }}
                            transition={{ duration: 0.15 }}
                            className="rounded p-0.5 text-gray-600 hover:text-gray-300"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </motion.button>
                        </div>
                      )}
                    </div>

                    {/* A-Z letter sidebar — jump to any prefix letter */}
                    {letterIndex.size > 1 && (
                      <div
                        ref={letterSidebarRef}
                        className="relative flex flex-col items-center justify-center border-l border-white/5 px-1 py-1"
                        onTouchStart={handleLetterTouchStart}
                        onTouchMove={handleLetterTouchMove}
                        onTouchEnd={handleLetterTouchEnd}
                        onTouchCancel={handleLetterTouchEnd}
                      >
                        {letterEntries.map(([letter, targetOffset]) => {
                          const isActive = pageLetters.has(letter);
                          const isHovered = hoveredLetter === letter;
                          return (
                            <motion.button
                              key={letter}
                              type="button"
                              aria-label={`Jump to ${letter}`}
                              onClick={() => {
                                playClickSound();
                                setOffset(targetOffset);
                              }}
                              onMouseEnter={() => {
                                playHoverSound();
                                setHoveredLetter(letter);
                              }}
                              onMouseLeave={() => setHoveredLetter(null)}

                              animate={{
                                color: isHovered
                                  ? "rgb(255 255 255)"
                                  : isActive
                                    ? "rgb(147 197 253)"
                                    : "rgb(75 85 99)",
                                scale: isHovered ? 1.5 : isActive ? 1.15 : 1,
                              }}
                              transition={{ duration: 0.1 }}
                              className="w-3.5 py-px text-center text-[8px] font-medium leading-none"
                            >
                              {letter}
                            </motion.button>
                          );
                        })}

                        {isMobile && touchLetter && touchBubblePos && (
                          <DevOpsLetterTouchBubble
                            letter={touchLetter}
                            x={touchBubblePos.x}
                            y={touchBubblePos.y}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <SortDropdown
          value={sortKey}
          options={DEVOPS_SORT_OPTIONS}
          onChange={(v) => onSortChange(v as DevOpsSortKey)}
        />
      </div>

      {/* Active filter chips — one per selected stack + Clear all when multiple */}
      <FilterChipGroup items={activeStacks} onRemove={onStackToggle} onClearAll={onClearStacks} />
    </div>
  );
};
