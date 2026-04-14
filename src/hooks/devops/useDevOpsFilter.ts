/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMemo, useState } from "react";
import type { DevOpsProject } from "../../components/ui/devops/common/data/types";

export type DevOpsSortKey = "default" | "title-asc" | "title-desc" | "date-desc" | "date-asc";

interface UseDevOpsFilterResult {
  filteredProjects: DevOpsProject[];
  search: string;
  setSearch: (v: string) => void;
  activeStacks: string[];
  toggleStack: (v: string) => void;
  clearStacks: () => void;
  allStacks: string[];
  sortKey: DevOpsSortKey;
  setSortKey: (v: DevOpsSortKey) => void;
}

export const useDevOpsFilter = (projects: DevOpsProject[]): UseDevOpsFilterResult => {
  const [search, setSearch] = useState("");
  const [activeStacks, setActiveStacks] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<DevOpsSortKey>("default");

  const allStacks = useMemo(() => {
    const stacks = new Set<string>();
    for (const p of projects) {
      for (const s of p.tech_stack) stacks.add(s);
    }
    return Array.from(stacks).sort();
  }, [projects]);

  const toggleStack = (stack: string) => {
    setActiveStacks((prev) =>
      prev.includes(stack) ? prev.filter((s) => s !== stack) : [...prev, stack],
    );
  };

  const clearStacks = () => setActiveStacks([]);

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    const filtered = projects.filter((p) => {
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesStacks =
        activeStacks.length === 0 || activeStacks.every((s) => p.tech_stack.includes(s));
      return matchesSearch && matchesStacks;
    });

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-desc":
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        case "date-asc":
          return (a.created_at ?? "").localeCompare(b.created_at ?? "");
        default:
          return 0;
      }
    });
  }, [projects, search, activeStacks, sortKey]);

  return {
    filteredProjects,
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
