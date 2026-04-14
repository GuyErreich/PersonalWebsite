/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { SortOption } from "../../../common/controls/SortDropdown";
import { StackFilterBar } from "../../../common/filters/StackFilterBar";

interface GameDevFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  allStacks: string[];
  activeStacks: string[];
  onStackToggle: (value: string) => void;
  onClearStacks: () => void;
  sortKey: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
}

export const GameDevFilterBar = ({
  search,
  onSearchChange,
  allStacks,
  activeStacks,
  onStackToggle,
  onClearStacks,
  sortKey,
  sortOptions,
  onSortChange,
}: GameDevFilterBarProps) => {
  return (
    <StackFilterBar
      search={search}
      onSearchChange={onSearchChange}
      allStacks={allStacks}
      activeStacks={activeStacks}
      onStackToggle={onStackToggle}
      onClearStacks={onClearStacks}
      sortKey={sortKey}
      sortOptions={sortOptions}
      onSortChange={onSortChange}
      dropdownAriaLabel="Filter by game development stack"
      listAriaLabel="Game development stack options"
      theme={{
        activeButtonClassName: "border-purple-500/50 bg-purple-500/15 text-purple-300",
        activeBadgeClassName:
          "flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-purple-500/40 px-1 text-[10px] font-semibold text-purple-200",
        activeOptionClassName: "text-purple-300",
        activeOptionIconClassName: "text-purple-400",
        activeChipClassName:
          "flex items-center gap-1 rounded-full border border-purple-500/50 bg-purple-500/20 px-2.5 py-0.5 text-xs text-purple-300",
        dropdownSearchFocusClassName: "focus:border-purple-400/50",
        sidebarAccentColor: "rgb(196 181 253)",
        touchBubbleClassName:
          "pointer-events-none absolute z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-purple-200/70 bg-purple-500/95 text-3xl font-bold text-white shadow-[0_14px_40px_rgba(168,85,247,0.45)]",
      }}
    />
  );
};
