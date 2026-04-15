/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "../../../../hooks/responsive/useMediaQuery";
import { useScrollContainer } from "../../../../lib/ScrollContainerContext";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../../../../lib/sound/interactionSounds";
import { SearchInput } from "../controls/SearchInput";
import type { SortOption } from "../controls/SortDropdown";
import { SortDropdown } from "../controls/SortDropdown";
import { ScrollViewport } from "../scroll/ScrollViewport";
import { FilterChipGroup } from "./FilterChipGroup";
import { FilterLetterTouchBubble } from "./FilterLetterTouchBubble";

const PER_PAGE = 5;
const ITEM_HEIGHT = 30;

export interface StackFilterTheme {
  activeButtonClassName: string;
  activeBadgeClassName: string;
  activeOptionClassName: string;
  activeOptionIconClassName: string;
  activeChipClassName: string;
  dropdownSearchFocusClassName: string;
  sidebarAccentColor: string;
  touchBubbleClassName: string;
}

interface StackFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  allStacks: string[];
  activeStacks: string[];
  onStackToggle: (value: string) => void;
  onClearStacks: () => void;
  sortKey: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
  dropdownAriaLabel: string;
  listAriaLabel: string;
  theme: StackFilterTheme;
}

export const StackFilterBar = ({
  search,
  onSearchChange,
  allStacks,
  activeStacks,
  onStackToggle,
  onClearStacks,
  sortKey,
  sortOptions,
  onSortChange,
  dropdownAriaLabel,
  listAriaLabel,
  theme,
}: StackFilterBarProps) => {
  const scrollContainer = useScrollContainer();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stackSearch, setStackSearch] = useState("");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [mobileTopIndex, setMobileTopIndex] = useState(0);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [touchLetter, setTouchLetter] = useState<string | null>(null);
  const [touchBubblePos, setTouchBubblePos] = useState<{ x: number; y: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const stackSearchRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const mobileListRef = useRef<HTMLDivElement>(null);
  const scrollportRef = useRef<HTMLDivElement>(null);
  const letterSidebarRef = useRef<HTMLDivElement>(null);
  const lastTouchedLetterRef = useRef<string | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const filteredLengthRef = useRef(0);
  const wheelCooldownRef = useRef(false);
  const offsetRef = useRef(0);
  const maxOffsetRef = useRef(0);

  const openDropdown = useCallback(() => {
    playMenuOpenSound();
    setDropdownOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownOpen((wasOpen) => {
      if (wasOpen) {
        playMenuCloseSound();
      }

      return false;
    });
    setStackSearch("");
  }, []);

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
    const nextOffset = currentOffset ?? offsetRef.current;
    const globalIdx = nextOffset + visualSlot;

    setHoveredIdx(globalIdx < filteredLengthRef.current ? globalIdx : null);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handler = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler as EventListener, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler as EventListener);
    };
  }, [closeDropdown, dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen) {
      void Promise.resolve().then(() => stackSearchRef.current?.focus());
    } else {
      setStackSearch("");
    }
  }, [dropdownOpen]);

  const filteredStacks = stackSearch.trim()
    ? allStacks.filter((stack) => stack.toLowerCase().includes(stackSearch.toLowerCase()))
    : allStacks;

  useEffect(() => {
    filteredLengthRef.current = filteredStacks.length;
  }, [filteredStacks.length]);

  const maxOffset = Math.max(0, filteredStacks.length - PER_PAGE);
  const safeOffset = Math.max(0, Math.min(offset, maxOffset));
  const pageStacks = filteredStacks.slice(safeOffset, safeOffset + PER_PAGE);
  const mobileVisibleStacks = filteredStacks.slice(mobileTopIndex, mobileTopIndex + PER_PAGE);
  const canUp = safeOffset > 0;
  const canDown = safeOffset < maxOffset;

  useEffect(() => {
    offsetRef.current = safeOffset;
  }, [safeOffset]);

  useEffect(() => {
    maxOffsetRef.current = maxOffset;
  }, [maxOffset]);

  useEffect(() => {
    setMobileTopIndex((current) => Math.max(0, Math.min(maxOffset, current)));
  }, [maxOffset]);

  useEffect(() => {
    if (isMobile) {
      setMobileTopIndex(0);
      if (mobileListRef.current) {
        mobileListRef.current.scrollTop = 0;
      }
      return;
    }

    setOffset(0);
  }, [isMobile, stackSearch]);

  useEffect(() => {
    const element = scrollContainer?.current as HTMLElement | null;

    if (!element) return;

    if (dropdownOpen) {
      element.style.overflow = "hidden";

      return () => {
        element.style.overflow = "";
      };
    }
  }, [dropdownOpen, scrollContainer]);

  useEffect(() => {
    if (!dropdownOpen || isMobile) return;

    const element = listContainerRef.current;

    if (!element) return;

    const handler = (event: WheelEvent) => {
      event.preventDefault();

      if (wheelCooldownRef.current) return;

      wheelCooldownRef.current = true;
      setTimeout(() => {
        wheelCooldownRef.current = false;
      }, 80);

      let nextOffset = offsetRef.current;

      if (event.deltaY > 0 && offsetRef.current < maxOffsetRef.current) {
        nextOffset = Math.min(maxOffsetRef.current, offsetRef.current + 1);
      } else if (event.deltaY < 0 && offsetRef.current > 0) {
        nextOffset = Math.max(0, offsetRef.current - 1);
      }

      if (nextOffset !== offsetRef.current) {
        setOffset(nextOffset);

        if (mousePos.current) {
          updateHoveredFromMouse(nextOffset);
        }
      }
    };

    element.addEventListener("wheel", handler, { passive: false });

    return () => element.removeEventListener("wheel", handler);
  }, [dropdownOpen, isMobile, updateHoveredFromMouse]);

  const letterIndex = useMemo(() => {
    const map = new Map<string, number>();
    const groups = new Map<string, number[]>();

    filteredStacks.forEach((stack, index) => {
      const letter = stack[0]?.toUpperCase() ?? "#";

      if (!groups.has(letter)) {
        groups.set(letter, []);
      }

      groups.get(letter)?.push(index);
    });

    const boundedMaxOffset = Math.max(0, filteredStacks.length - PER_PAGE);

    groups.forEach((indices, letter) => {
      const middleIdx = indices[Math.floor((indices.length - 1) / 2)];
      map.set(letter, Math.max(0, Math.min(middleIdx - 2, boundedMaxOffset)));
    });

    return map;
  }, [filteredStacks]);

  const pageLetters = useMemo(() => {
    const visible = isMobile ? mobileVisibleStacks : pageStacks;

    return new Set(visible.map((stack) => stack[0]?.toUpperCase() ?? "#"));
  }, [isMobile, mobileVisibleStacks, pageStacks]);

  const letterEntries = useMemo(() => [...letterIndex.entries()], [letterIndex]);

  const jumpToOffset = useCallback(
    (targetOffset: number) => {
      if (isMobile && mobileListRef.current) {
        mobileListRef.current.scrollTo({ top: targetOffset * ITEM_HEIGHT, behavior: "smooth" });
        setMobileTopIndex(targetOffset);
        return;
      }

      setOffset(targetOffset);
    },
    [isMobile],
  );

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
      jumpToOffset(targetOffset);
    },
    [jumpToOffset, letterEntries],
  );

  const handleLetterTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    updateLetterFromTouch(event.touches[0]);
  };

  const handleLetterTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobile) return;

    event.preventDefault();
    updateLetterFromTouch(event.touches[0]);
  };

  const handleLetterTouchEnd = () => {
    setTouchLetter(null);
    setTouchBubblePos(null);
    setHoveredLetter(null);
    lastTouchedLetterRef.current = null;
  };

  return (
    <div className="mb-3 flex flex-col gap-2" data-no-swipe-page>
      <div className="flex items-center gap-2">
        <SearchInput value={search} onValueChange={onSearchChange} placeholder="Search..." />

        {allStacks.length > 0 ? (
          <div ref={dropdownRef} className="relative shrink-0">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={() => {
                playClickSound();

                if (dropdownOpen) {
                  closeDropdown();
                } else {
                  openDropdown();
                }
              }}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                activeStacks.length > 0
                  ? theme.activeButtonClassName
                  : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeStacks.length > 0 ? (
                <span className={theme.activeBadgeClassName}>{activeStacks.length}</span>
              ) : null}
              <ChevronDown
                className={`h-3 w-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </motion.button>

            <AnimatePresence>
              {dropdownOpen ? (
                <motion.div
                  role="dialog"
                  aria-label={dropdownAriaLabel}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 z-20 mt-1 min-w-[180px] rounded-xl border border-white/10 bg-gray-900/95 shadow-xl backdrop-blur-sm"
                >
                  <div className="border-b border-white/8 p-2">
                    <SearchInput
                      inputRef={stackSearchRef}
                      value={stackSearch}
                      onValueChange={setStackSearch}
                      placeholder="Search stacks..."
                      className="relative"
                      iconClassName="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-gray-500"
                      inputClassName={`w-full rounded-md border border-white/10 bg-white/5 py-1 pr-2 pl-6 text-[11px] text-white placeholder-gray-600 focus:outline-none ${theme.dropdownSearchFocusClassName}`}
                    />
                  </div>

                  <div className="flex">
                    <div
                      ref={listContainerRef}
                      role="listbox"
                      aria-multiselectable="true"
                      aria-label={listAriaLabel}
                      className="flex-1"
                    >
                      {!isMobile ? (
                        <div className="flex justify-center py-0.5">
                          <motion.button
                            type="button"
                            aria-label="Previous items"
                            onClick={() => {
                              playClickSound();
                              setOffset((current) => Math.max(0, current - PER_PAGE));
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
                      ) : null}

                      {isMobile ? (
                        <div
                          ref={mobileListRef}
                          className="max-h-[150px] overflow-y-auto py-1"
                          onScroll={(event) => {
                            const nextTopIndex = Math.floor(
                              event.currentTarget.scrollTop / ITEM_HEIGHT,
                            );
                            setMobileTopIndex(Math.max(0, Math.min(maxOffset, nextTopIndex)));
                          }}
                        >
                          {filteredStacks.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-gray-500">No matches</div>
                          ) : (
                            filteredStacks.map((stack) => {
                              const isActive = activeStacks.includes(stack);

                              return (
                                <button
                                  key={stack}
                                  type="button"
                                  role="option"
                                  aria-selected={isActive}
                                  onClick={() => {
                                    playClickSound();
                                    onStackToggle(stack);
                                  }}
                                  className={`flex w-full items-center justify-between px-3 text-left text-xs transition-colors hover:bg-white/10 ${
                                    isActive
                                      ? theme.activeOptionClassName
                                      : "text-gray-300 hover:text-white"
                                  }`}
                                  style={{ height: ITEM_HEIGHT }}
                                >
                                  {stack}
                                  {isActive ? (
                                    <Check
                                      className={`h-3 w-3 shrink-0 ${theme.activeOptionIconClassName}`}
                                    />
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      ) : (
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
                                  onMouseMove={(event) => {
                                    mousePos.current = { x: event.clientX, y: event.clientY };
                                    updateHoveredFromMouse();
                                  }}
                                  onMouseLeave={() => {
                                    mousePos.current = null;
                                    setHoveredIdx(null);
                                  }}
                                >
                                  {filteredStacks.map((stack, index) => {
                                    const isActive = activeStacks.includes(stack);
                                    const distance =
                                      hoveredIdx === null ? 0 : Math.abs(index - hoveredIdx);
                                    const t =
                                      hoveredIdx === null ? 0.25 : Math.min(distance / 2, 1);
                                    const scale = 1.12 - t * 0.34;
                                    const opacity = 1 - t * 0.6;

                                    return (
                                      <div
                                        key={stack}
                                        data-idx={index}
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
                                                ? theme.activeOptionClassName
                                                : "text-gray-300 hover:text-white"
                                            }`}
                                          >
                                            {stack}
                                            {isActive ? (
                                              <Check
                                                className={`h-3 w-3 shrink-0 ${theme.activeOptionIconClassName}`}
                                              />
                                            ) : null}
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
                      )}

                      {!isMobile ? (
                        <div className="flex justify-center py-0.5">
                          <motion.button
                            type="button"
                            aria-label="Next items"
                            onClick={() => {
                              playClickSound();
                              setOffset((current) => Math.min(maxOffset, current + PER_PAGE));
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
                      ) : null}
                    </div>

                    {letterIndex.size > 1 ? (
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
                                jumpToOffset(targetOffset);
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
                                    ? theme.sidebarAccentColor
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

                        {isMobile && touchLetter && touchBubblePos ? (
                          <FilterLetterTouchBubble
                            letter={touchLetter}
                            x={touchBubblePos.x}
                            y={touchBubblePos.y}
                            className={theme.touchBubbleClassName}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        <SortDropdown value={sortKey} options={sortOptions} onChange={onSortChange} />
      </div>

      <FilterChipGroup
        items={activeStacks}
        onRemove={onStackToggle}
        onClearAll={onClearStacks}
        chipClassName={theme.activeChipClassName}
      />
    </div>
  );
};
