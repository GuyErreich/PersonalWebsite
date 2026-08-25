/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useInView } from "framer-motion";
import { lazy, memo, Suspense, useState } from "react";
import { useGameDevFilter } from "../hooks/gamedev/useGameDevFilter";
import { useGameDevSectionData } from "../hooks/gamedev/useGameDevSectionData";
import { useWarmFirstVfxHeroAsset } from "../hooks/gamedev/useWarmFirstVfxHeroAsset";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useScrollContainer } from "../lib/ScrollContainerContext";
import { SectionEntranceOverlay } from "./ui/common/sections/SectionEntranceOverlay";
import { SectionEdge } from "./ui/edges/SectionEdge";
import type { GameDevSortKey } from "./ui/gamedev/common/data/filtering";
import { iconMap } from "./ui/gamedev/common/data/iconMap";
import { GameDevSlidingPanels } from "./ui/gamedev/common/panels/GameDevSlidingPanels";
import { GameDevAllProjectsPanel } from "./ui/gamedev/GameDevAllProjectsPanel";
import { GameDevOverviewPanel } from "./ui/gamedev/GameDevOverviewPanel";

const GamingIconsBackground = lazy(async () => {
  const module = await import("./backgrounds/tsparticles/GamingIconsBackground");
  return { default: module.GamingIconsBackground };
});

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

const GameDevBackgroundFallback = () => (
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_75%_70%,rgba(59,130,246,0.14),transparent_48%),linear-gradient(to_bottom,#0f172a,#111827)]" />
);

export const GameDevSection = () => {
  const [showAllProjectsView, setShowAllProjectsView] = useState(false);
  const { ref: sectionRef, motionStyle } = useScrollReveal();
  const container = useScrollContainer();
  // Warm particles slightly early for scroll smoothness.
  const shouldRenderBackground = useInView(sectionRef, {
    root: container ?? undefined,
    margin: "30% 0px 30% 0px",
  });
  // Network + media must wait until the section is meaningfully on screen (not while on Hero).
  const shouldLoadSectionWork = useInView(sectionRef, {
    root: container ?? undefined,
    amount: 0.2,
  });

  const { galleryItems, featuredItems, vfxItems, vfxError, isLoading, isVfxLoading, showreelUrl } =
    useGameDevSectionData({ enabled: shouldLoadSectionWork });
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

  useWarmFirstVfxHeroAsset(
    vfxItems,
    shouldLoadSectionWork && !isVfxLoading && vfxItems.length > 0,
  );

  return (
    <SectionEntranceOverlay theme="gamedev">
      <section
        id="gamedev"
        ref={sectionRef}
        className="gamedev-section-shell section-desktop-offset snap-section"
      >
        <div className="gamedev-background-layer">
          {shouldRenderBackground ? (
            <Suspense fallback={<GameDevBackgroundFallback />}>
              <MemoizedGamingIconsBackground id="gamedev-particles" />
            </Suspense>
          ) : (
            <GameDevBackgroundFallback />
          )}
        </div>

        <GameDevSlidingPanels
          showSecondaryPanel={showAllProjectsView}
          motionStyle={motionStyle}
          primaryPanel={(isPrimaryActive) => (
            <GameDevOverviewPanel
              showreelUrl={showreelUrl}
              featuredItems={featuredItems}
              vfxItems={vfxItems}
              vfxError={vfxError}
              isLoading={isLoading}
              isVfxLoading={isVfxLoading}
              iconMap={iconMap}
              onViewAll={() => setShowAllProjectsView(true)}
              isActive={isPrimaryActive && shouldLoadSectionWork}
            />
          )}
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
