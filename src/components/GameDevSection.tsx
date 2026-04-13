/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { memo, useState } from "react";
import { useGameDevSectionData } from "../hooks/gamedev/useGameDevSectionData";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { GamingIconsBackground } from "./backgrounds/tsparticles/GamingIconsBackground";
import { GameDevSlidingPanels } from "./ui/gamedev/common/GameDevSlidingPanels";
import { iconMap } from "./ui/gamedev/common/iconMap";
import { GameDevAllProjectsPanel } from "./ui/gamedev/GameDevAllProjectsPanel";
import { GameDevOverviewPanel } from "./ui/gamedev/GameDevOverviewPanel";
import { SectionEdge } from "./ui/SectionEdge";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";

const MemoizedGamingIconsBackground = memo(GamingIconsBackground);

export const GameDevSection = () => {
  const [showAllProjectsView, setShowAllProjectsView] = useState(false);

  const { galleryItems, isLoading, showreelUrl } = useGameDevSectionData();
  const { ref: sectionRef, motionStyle } = useScrollReveal();

  return (
    <SectionEntranceOverlay theme="gamedev">
      <section id="gamedev" ref={sectionRef} className="gamedev-section-shell snap-section">
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
              galleryItems={galleryItems}
              isLoading={isLoading}
              iconMap={iconMap}
              onBack={() => setShowAllProjectsView(false)}
            />
          }
        />

        <SectionEdge variant="circuit" fillColor="#111827" height={100} className="z-[4]" />
      </section>
    </SectionEntranceOverlay>
  );
};
