/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMemo, useState } from "react";
import type { DevOpsProject } from "../../components/ui/devops/common/types";

interface UseDevOpsFilterResult {
  filteredProjects: DevOpsProject[];
  search: string;
  setSearch: (v: string) => void;
  activeStack: string | null;
  setActiveStack: (v: string | null) => void;
  allStacks: string[];
}

export const useDevOpsFilter = (projects: DevOpsProject[]): UseDevOpsFilterResult => {
  const [search, setSearch] = useState("");
  const [activeStack, setActiveStack] = useState<string | null>(null);

  const allStacks = useMemo(() => {
    const stacks = new Set<string>();
    for (const p of projects) {
      for (const s of p.tech_stack) stacks.add(s);
    }
    return Array.from(stacks).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesStack = !activeStack || p.tech_stack.includes(activeStack);
      return matchesSearch && matchesStack;
    });
  }, [projects, search, activeStack]);

  return { filteredProjects, search, setSearch, activeStack, setActiveStack, allStacks };
};
