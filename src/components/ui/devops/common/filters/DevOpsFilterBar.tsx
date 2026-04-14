/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { DevOpsSortKey } from "../../../../../hooks/devops/useDevOpsFilter";
import type { SortOption } from "../../../common/controls/SortDropdown";
import { StackFilterBar } from "../../../common/filters/StackFilterBar";

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
  return (
    <StackFilterBar
      search={search}
      onSearchChange={onSearchChange}
      allStacks={allStacks}
      activeStacks={activeStacks}
      onStackToggle={onStackToggle}
      onClearStacks={onClearStacks}
      sortKey={sortKey}
      sortOptions={DEVOPS_SORT_OPTIONS}
      onSortChange={(value) => onSortChange(value as DevOpsSortKey)}
      dropdownAriaLabel="Filter by tech stack"
      listAriaLabel="Tech stack options"
      theme={{
        activeButtonClassName: "border-blue-500/50 bg-blue-500/15 text-blue-300",
        activeBadgeClassName:
          "flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-500/40 px-1 text-[10px] font-semibold text-blue-200",
        activeOptionClassName: "text-blue-300",
        activeOptionIconClassName: "text-blue-400",
        activeChipClassName:
          "flex items-center gap-1 rounded-full border border-blue-500/50 bg-blue-500/20 px-2.5 py-0.5 text-xs text-blue-300",
        dropdownSearchFocusClassName: "focus:border-blue-400/50",
        sidebarAccentColor: "rgb(147 197 253)",
        touchBubbleClassName:
          "pointer-events-none absolute z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-blue-200/70 bg-blue-500/95 text-3xl font-bold text-white shadow-[0_14px_40px_rgba(59,130,246,0.5)]",
      }}
    />
  );
};
