/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { Film, Layers, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { useGameDevOverviewTabs } from "../hooks/useGameDevOverviewTabs";
import { getOverviewSlideMotion } from "./overviewSlideVariants";
import type { GameDevOverviewTab } from "./overviewTabPulse";

export interface GameDevOverviewTabsClassNames {
  root: string;
  tabList: string;
  tab: string;
  tabActive: string;
  content: string;
  panel: string;
  /** Optional per-tab panel class overrides (appended to `panel`). */
  panelByTab?: Partial<Record<GameDevOverviewTab, string>>;
}

export interface GameDevOverviewTabsProps {
  idScope: string;
  classNames: GameDevOverviewTabsClassNames;
  /** Optional icon size class applied to each tab icon (e.g. `h-4 w-4`). */
  tabIconClassName: string;
  showreel: ReactNode;
  projects: ReactNode;
  vfx: ReactNode;
}

export const GameDevOverviewTabs = ({
  idScope,
  classNames,
  tabIconClassName,
  showreel,
  projects,
  vfx,
}: GameDevOverviewTabsProps) => {
  const {
    activeTab,
    directionRef,
    handleTabListKeyDown,
    projectsPanelId,
    projectsTabId,
    reduceMotion,
    showreelPanelId,
    showreelTabId,
    switchTab,
    tabPulse,
    vfxPanelId,
    vfxTabId,
  } = useGameDevOverviewTabs({ idScope });

  const { variants: activeSlideVariants, transition: slideTransition } =
    getOverviewSlideMotion(reduceMotion);

  const tabClass = (tab: GameDevOverviewTab) =>
    `${classNames.tab}${activeTab === tab ? ` ${classNames.tabActive}` : ""}`;

  const panelClass = (tab: GameDevOverviewTab) => {
    const override = classNames.panelByTab?.[tab];
    return override ? `${classNames.panel} ${override}` : classNames.panel;
  };

  return (
    <div className={classNames.root}>
      <div
        className={classNames.tabList}
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
          className={tabClass("showreel")}
        >
          <Film className={tabIconClassName} />
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
          className={tabClass("projects")}
        >
          <Layers className={tabIconClassName} />
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
          className={tabClass("vfx")}
        >
          <Sparkles className={tabIconClassName} />
          VFX
        </motion.button>
      </div>

      <div className={classNames.content}>
        <AnimatePresence mode="wait" custom={directionRef.current}>
          {activeTab === "showreel" ? (
            <motion.div
              key="showreel"
              role="tabpanel"
              id={showreelPanelId}
              aria-labelledby={showreelTabId}
              custom={directionRef.current}
              variants={activeSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className={panelClass("showreel")}
            >
              {showreel}
            </motion.div>
          ) : activeTab === "projects" ? (
            <motion.div
              key="projects"
              role="tabpanel"
              id={projectsPanelId}
              aria-labelledby={projectsTabId}
              custom={directionRef.current}
              variants={activeSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className={panelClass("projects")}
            >
              {projects}
            </motion.div>
          ) : (
            <motion.div
              key="vfx"
              role="tabpanel"
              id={vfxPanelId}
              aria-labelledby={vfxTabId}
              custom={directionRef.current}
              variants={activeSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={slideTransition}
              className={panelClass("vfx")}
            >
              {vfx}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
