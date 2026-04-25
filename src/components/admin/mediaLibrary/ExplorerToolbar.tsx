/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Search } from "lucide-react";
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
  <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4">
    <label className="relative md:col-span-2 lg:col-span-2">
      <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search folders and media globally"
        className="w-full rounded-md border border-gray-600 bg-gray-900/40 py-2 pl-8 pr-3 text-sm text-white"
      />
    </label>

    <select
      value={entryTypeFilter}
      onChange={(e) => setEntryTypeFilter(e.target.value as EntryTypeFilter)}
      className="rounded-md border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-white"
    >
      <option value="all">Filter: All Entries</option>
      <option value="folders">Filter: Folders</option>
      <option value="image">Filter: Images</option>
      <option value="video">Filter: Videos</option>
    </select>

    <select
      value={sortOption}
      onChange={(e) => setSortOption(e.target.value as SortOption)}
      className="rounded-md border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-white"
    >
      <option value="updated-desc">Sort: Recently Updated</option>
      <option value="created-desc">Sort: Recently Created</option>
      <option value="name-asc">Sort: Name A-Z</option>
      <option value="size-desc">Sort: Largest Size</option>
    </select>
  </div>
);
