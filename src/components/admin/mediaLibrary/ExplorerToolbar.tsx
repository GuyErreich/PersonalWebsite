/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { SlidersHorizontal } from "lucide-react";
import { OptionDropdown } from "../../ui/common/controls/OptionDropdown";
import { SearchInput } from "../../ui/common/controls/SearchInput";
import { SortDropdown } from "../../ui/common/controls/SortDropdown";
import { EXPLORER_ENTRY_TYPE_OPTIONS, EXPLORER_SORT_OPTIONS } from "./explorerOptions";
import type { EntryTypeFilter, SortOption } from "./types";

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  entryTypeFilter: EntryTypeFilter;
  setEntryTypeFilter: (filter: EntryTypeFilter) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
}

export const ExplorerToolbar = ({
  searchQuery,
  setSearchQuery,
  entryTypeFilter,
  setEntryTypeFilter,
  sortOption,
  setSortOption,
}: Props) => (
  <div className="mb-4 flex flex-wrap items-center gap-2">
    <SearchInput
      value={searchQuery}
      onValueChange={setSearchQuery}
      placeholder="Search folders and media"
      className="relative min-w-0 flex-1"
    />

    <OptionDropdown
      value={entryTypeFilter}
      options={EXPLORER_ENTRY_TYPE_OPTIONS}
      onChange={(value) => setEntryTypeFilter(value as EntryTypeFilter)}
      label="Filter"
      icon={SlidersHorizontal}
      menuAriaLabel="Filter explorer entries"
      activeButtonClassName="border-blue-500/50 bg-blue-500/15 text-blue-300"
      activeOptionClassName="text-blue-300"
      activeOptionIconClassName="text-blue-400"
    />

    <SortDropdown
      value={sortOption}
      options={EXPLORER_SORT_OPTIONS}
      onChange={(value) => setSortOption(value as SortOption)}
    />
  </div>
);
