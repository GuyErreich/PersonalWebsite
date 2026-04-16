/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { memo, useState } from "react";
import { useGameDevFilter } from "../hooks/gamedev/useGameDevFilter";
import { useGameDevSectionData } from "../hooks/gamedev/useGameDevSectionData";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { GamingIconsBackground } from "./backgrounds/tsparticles/GamingIconsBackground";
import { SectionEntranceOverlay } from "./ui/common/sections/SectionEntranceOverlay";
import { SectionEdge } from "./ui/edges/SectionEdge";
import type { GameDevSortKey } from "./ui/gamedev/common/data/filtering";
import { iconMap } from "./ui/gamedev/common/data/iconMap";
import { GameDevSlidingPanels } from "./ui/gamedev/common/panels/GameDevSlidingPanels";
import { GameDevAllProjectsPanel } from "./ui/gamedev/GameDevAllProjectsPanel";
import { GameDevOverviewPanel } from "./ui/gamedev/GameDevOverviewPanel";

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

export const GameDevSection = () => {
  const [showAllProjectsView, setShowAllProjectsView] = useState(false);

  const { galleryItems, isLoading, showreelUrl } = useGameDevSectionData();
  const {
    filteredItems,
    search,
    setSearch,
    activeStacks,
    toggleStack,
    clearStacks,
    allStacks,
    sortKey,
    setSortKey,
  } = useGameDevFilter(galleryItems);
  const { ref: sectionRef, motionStyle } = useScrollReveal();

  return (
    <SectionEntranceOverlay theme="gamedev">
      <section
        id="gamedev"
        ref={sectionRef}
        className="gamedev-section-shell section-desktop-offset snap-section"
      >
        <div className="gamedev-background-layer">
          <MemoizedGamingIconsBackground id="gamedev-particles" />
        </div>

        <GameDevSlidingPanels
          showSecondaryPanel={showAllProjectsView}
          motionStyle={motionStyle}
          primaryPanel={
            <GameDevOverviewPanel
              showreelUrl={showreelUrl}
              galleryItems={galleryItems}
              isLoading={isLoading}
              iconMap={iconMap}
              onViewAll={() => setShowAllProjectsView(true)}
            />
          }
          secondaryPanel={
            <GameDevAllProjectsPanel
              galleryItems={filteredItems}
              isLoading={isLoading}
              iconMap={iconMap}
              onBack={() => setShowAllProjectsView(false)}
              search={search}
              onSearchChange={setSearch}
              allStacks={allStacks}
              activeStacks={activeStacks}
              onStackToggle={toggleStack}
              onClearStacks={clearStacks}
              sortKey={sortKey}
              onSortChange={(value) => setSortKey(value as GameDevSortKey)}
            />
          }
        />

        <SectionEdge variant="circuit" fillColor="#111827" height={100} className="z-[4]" />
      </section>
    </SectionEntranceOverlay>
  );
};
