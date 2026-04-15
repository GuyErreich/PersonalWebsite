/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { SortOption } from "../../../common/controls/SortDropdown";
import type { StackFilterTheme } from "../../../common/filters/StackFilterBar";

export type GameDevSortKey = "default" | "title-asc" | "title-desc";

export const GAMEDEV_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title A → Z" },
  { value: "title-desc", label: "Title Z → A" },
];

export const GAMEDEV_STACK_FILTER_THEME: StackFilterTheme = {
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
};
