/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useDevOpsFilter } from "../../../hooks/devops/useDevOpsFilter";
import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import { DevOpsFilterBar } from "./common/DevOpsFilterBar";
import type { DevOpsProject } from "./common/types";
import { DevOpsProjectsDesktop } from "./desktop/DevOpsProjectsDesktop";
import { DevOpsFilterBarMobile } from "./mobile/DevOpsFilterBarMobile";
import { DevOpsProjectsMobile } from "./mobile/DevOpsProjectsMobile";

interface DevOpsProjectsPanelProps {
  projects: DevOpsProject[];
  isLoading: boolean;
}

export const DevOpsProjectsPanel = ({ projects, isLoading }: DevOpsProjectsPanelProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const {
    filteredProjects,
    search,
    setSearch,
    activeStacks,
    toggleStack,
    clearStacks,
    allStacks,
    sortKey,
    setSortKey,
  } = useDevOpsFilter(projects);

  // Reset pagination when filter/search/sort changes
  const filterKey = `${activeStacks.join(",")}|${search}|${sortKey}`;

  if (isLoading) {
    return (
      <div aria-busy="true" className="grid grid-cols-2 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-gray-800/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isDesktop ? (
        <DevOpsFilterBar
          search={search}
          onSearchChange={setSearch}
          allStacks={allStacks}
          activeStacks={activeStacks}
          onStackToggle={toggleStack}
          onClearStacks={clearStacks}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />
      ) : (
        <DevOpsFilterBarMobile
          search={search}
          onSearchChange={setSearch}
          allStacks={allStacks}
          activeStacks={activeStacks}
          onStackToggle={toggleStack}
          onClearStacks={clearStacks}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />
      )}
      {isDesktop ? (
        <DevOpsProjectsDesktop key={filterKey} projects={filteredProjects} />
      ) : (
        <DevOpsProjectsMobile key={filterKey} projects={filteredProjects} />
      )}
    </div>
  );
};
