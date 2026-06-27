/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Film, Layers, Sparkles } from "lucide-react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import {
  GAMEDEV_OVERVIEW_TAB_ORDER,
  type GameDevOverviewTab,
  getOverviewTabPulseMotion,
} from "../../common/panels/overviewTabPulse";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevVfxShowcasePanel } from "../../common/panels/GameDevVfxShowcasePanel";
import { GameDevHiveGallery } from "../gallery/GameDevHiveGallery";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * 40 }),
};

export const GameDevOverviewMobileShort = ({
  showreelUrl,
  featuredItems,
  vfxItems,
  isLoading,
  isVfxLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  const [activeTab, setActiveTab] = useState<GameDevOverviewTab>("showreel");
  const [visitedTabs, setVisitedTabs] = useState<Set<GameDevOverviewTab>>(() => new Set(["showreel"]));
  const tabPanelIdBase = useId();
  const showreelTabId = `${tabPanelIdBase}-tab-showreel`;
  const projectsTabId = `${tabPanelIdBase}-tab-projects`;
  const vfxTabId = `${tabPanelIdBase}-tab-vfx`;
  const showreelPanelId = `${tabPanelIdBase}-tab-panel-showreel`;
  const projectsPanelId = `${tabPanelIdBase}-tab-panel-projects`;
  const vfxPanelId = `${tabPanelIdBase}-tab-panel-vfx`;
  const directionRef = useRef(1);

  const switchTab = (tab: GameDevOverviewTab) => {
    const from = GAMEDEV_OVERVIEW_TAB_ORDER.indexOf(activeTab);
    const to = GAMEDEV_OVERVIEW_TAB_ORDER.indexOf(tab);
    directionRef.current = to > from ? 1 : -1;
    setVisitedTabs((current) => {
      if (current.has(tab)) return current;
      return new Set([...current, tab]);
    });
    playClickSound();
    setActiveTab(tab);
  };

  const tabPulse = (tab: GameDevOverviewTab) => getOverviewTabPulseMotion(visitedTabs.has(tab));

  const getTabId = (tab: GameDevOverviewTab) => {
    if (tab === "showreel") return showreelTabId;
    if (tab === "projects") return projectsTabId;
    return vfxTabId;
  };

  const handleTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const order = GAMEDEV_OVERVIEW_TAB_ORDER;
    const currentIndex = order.indexOf(activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % order.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + order.length) % order.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = order.length - 1;
    }

    if (nextIndex === null || nextIndex === currentIndex) {
      return;
    }

    event.preventDefault();
    const nextTab = order[nextIndex];
    switchTab(nextTab);
    document.getElementById(getTabId(nextTab))?.focus();
  };

  return (
    <div className="gamedev-overview-mobile-short-stack">
      <div
        className="gamedev-mobile-short-tabs"
        role="tablist"
        aria-label="GameDev overview"
        onKeyDown={handleTabListKeyDown}
      >
        <motion.button
          id={showreelTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "showreel"}
          aria-controls={showreelPanelId}
          tabIndex={activeTab === "showreel" ? 0 : -1}
          {...tabPulse("showreel")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("showreel")}
          className={`gamedev-mobile-short-tab-btn${activeTab === "showreel" ? " gamedev-mobile-short-tab-btn--active" : ""}`}
        >
          <Film className="h-3.5 w-3.5" />
          Showreel
        </motion.button>

        <motion.button
          id={projectsTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "projects"}
          aria-controls={projectsPanelId}
          tabIndex={activeTab === "projects" ? 0 : -1}
          {...tabPulse("projects")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("projects")}
          className={`gamedev-mobile-short-tab-btn${activeTab === "projects" ? " gamedev-mobile-short-tab-btn--active" : ""}`}
        >
          <Layers className="h-3.5 w-3.5" />
          Selected Work
        </motion.button>

        <motion.button
          id={vfxTabId}
          type="button"
          role="tab"
          aria-selected={activeTab === "vfx"}
          aria-controls={vfxPanelId}
          tabIndex={activeTab === "vfx" ? 0 : -1}
          {...tabPulse("vfx")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => switchTab("vfx")}
          className={`gamedev-mobile-short-tab-btn${activeTab === "vfx" ? " gamedev-mobile-short-tab-btn--active" : ""}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          VFX
        </motion.button>
      </div>

      <div className="gamedev-mobile-short-content">
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {activeTab === "showreel" ? (
            <motion.div
              key="showreel"
              role="tabpanel"
              id={showreelPanelId}
              aria-labelledby={showreelTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="gamedev-mobile-short-panel"
            >
              <GameDevShowreelPanel showreelUrl={showreelUrl} />
            </motion.div>
          ) : activeTab === "projects" ? (
            <motion.div
              key="projects"
              role="tabpanel"
              id={projectsPanelId}
              aria-labelledby={projectsTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="gamedev-mobile-short-panel"
            >
              <GameDevPanelShell
                eyebrow="Featured Gallery"
                title="Selected Work"
                className="h-full"
                clipScroll
                rightAction={
                  <GameDevPanelButton
                    variant="primary"
                    hoverX={3}
                    onClick={onViewAll}
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    View All Projects
                  </GameDevPanelButton>
                }
              >
                <GameDevHiveGallery items={featuredItems} iconMap={iconMap} isLoading={isLoading} />
              </GameDevPanelShell>
            </motion.div>
          ) : (
            <motion.div
              key="vfx"
              role="tabpanel"
              id={vfxPanelId}
              aria-labelledby={vfxTabId}
              custom={directionRef.current}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="gamedev-mobile-short-panel gamedev-mobile-short-panel--clip"
            >
              <div className="gamedev-vfx-showcase">
                <GameDevVfxShowcasePanel vfxItems={vfxItems} isLoading={isVfxLoading} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
