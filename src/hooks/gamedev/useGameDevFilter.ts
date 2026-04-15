/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMemo, useState } from "react";
import {
  GAMEDEV_SORT_OPTIONS,
  type GameDevSortKey,
} from "../../components/ui/gamedev/common/data/filtering";
import type { GameDevItem } from "../../components/ui/gamedev/common/data/types";

interface UseGameDevFilterResult {
  filteredItems: GameDevItem[];
  search: string;
  setSearch: (v: string) => void;
  activeStacks: string[];
  toggleStack: (v: string) => void;
  clearStacks: () => void;
  allStacks: string[];
  sortKey: GameDevSortKey;
  setSortKey: (v: GameDevSortKey) => void;
}

export const useGameDevFilter = (items: GameDevItem[]): UseGameDevFilterResult => {
  const [search, setSearch] = useState("");
  const [activeStacks, setActiveStacks] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<GameDevSortKey>(
    GAMEDEV_SORT_OPTIONS[0].value as GameDevSortKey,
  );

  const allStacks = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags ?? []))].sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const toggleStack = (stack: string) => {
    setActiveStacks((prev) =>
      prev.includes(stack) ? prev.filter((s) => s !== stack) : [...prev, stack],
    );
  };

  const clearStacks = () => setActiveStacks([]);

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const filtered = items.filter((item) => {
      const matchesSearch =
        needle.length === 0 ||
        item.title.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        (item.tags ?? []).some((tag) => tag.toLowerCase().includes(needle));

      const matchesStacks =
        activeStacks.length === 0 ||
        activeStacks.every((stack) => (item.tags ?? []).includes(stack));

      return matchesSearch && matchesStacks;
    });

    if (sortKey === "title-asc") {
      return [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortKey === "title-desc") {
      return [...filtered].sort((a, b) => b.title.localeCompare(a.title));
    }

    return filtered;
  }, [items, search, activeStacks, sortKey]);

  return {
    filteredItems,
    search,
    setSearch,
    activeStacks,
    toggleStack,
    clearStacks,
    allStacks,
    sortKey,
    setSortKey,
  };
};
