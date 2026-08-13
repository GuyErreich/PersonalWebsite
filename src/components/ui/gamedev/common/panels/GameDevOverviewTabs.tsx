/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Film, Layers, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { useGameDevOverviewTabs } from "../hooks/useGameDevOverviewTabs";
import { getOverviewSlideMotion } from "./overviewSlideVariants";
import {
  GAMEDEV_OVERVIEW_TAB_ORDER,
  type GameDevOverviewTab,
} from "./overviewTabPulse";

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

export type GameDevOverviewTabRender = (isActive: boolean) => ReactNode;

export interface GameDevOverviewTabsProps {
  idScope: string;
  classNames: GameDevOverviewTabsClassNames;
  /** Optional icon size class applied to each tab icon (e.g. `h-4 w-4`). */
  tabIconClassName: string;
  showreel: GameDevOverviewTabRender;
  projects: GameDevOverviewTabRender;
  vfx: GameDevOverviewTabRender;
}

const TAB_META: Record<GameDevOverviewTab, { label: string; Icon: LucideIcon }> = {
  showreel: { label: "Showreel", Icon: Film },
  projects: { label: "Selected Work", Icon: Layers },
  vfx: { label: "VFX", Icon: Sparkles },
};

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
    visitedTabs,
    vfxPanelId,
    vfxTabId,
  } = useGameDevOverviewTabs({ idScope });

  const { variants: activeSlideVariants } = getOverviewSlideMotion(reduceMotion);

  const tabIds: Record<GameDevOverviewTab, string> = {
    showreel: showreelTabId,
    projects: projectsTabId,
    vfx: vfxTabId,
  };

  const panelIds: Record<GameDevOverviewTab, string> = {
    showreel: showreelPanelId,
    projects: projectsPanelId,
    vfx: vfxPanelId,
  };

  const panelRender: Record<GameDevOverviewTab, GameDevOverviewTabRender> = {
    showreel,
    projects,
    vfx,
  };

  const tabClass = (tab: GameDevOverviewTab) =>
    `${classNames.tab}${activeTab === tab ? ` ${classNames.tabActive}` : ""}`;

  const panelClass = (tab: GameDevOverviewTab) => {
    const override = classNames.panelByTab?.[tab];
    const base = override ? `${classNames.panel} ${override}` : classNames.panel;
    return `${base} gamedev-overview-tab-panel`;
  };

  return (
    <div className={classNames.root}>
      <div
        className={classNames.tabList}
        role="tablist"
        aria-label="GameDev overview"
        onKeyDown={handleTabListKeyDown}
      >
        {GAMEDEV_OVERVIEW_TAB_ORDER.map((tab) => {
          const { label, Icon } = TAB_META[tab];
          return (
            <motion.button
              key={tab}
              id={tabIds[tab]}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={panelIds[tab]}
              tabIndex={activeTab === tab ? 0 : -1}
              {...tabPulse(tab)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onMouseEnter={playHoverSound}
              onClick={() => switchTab(tab)}
              className={tabClass(tab)}
            >
              <Icon className={tabIconClassName} />
              {label}
            </motion.button>
          );
        })}
      </div>

      <div className={classNames.content}>
        {GAMEDEV_OVERVIEW_TAB_ORDER.filter((tab) => visitedTabs.has(tab)).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <motion.div
              key={tab}
              role="tabpanel"
              id={panelIds[tab]}
              aria-labelledby={tabIds[tab]}
              aria-hidden={!isActive}
              inert={!isActive ? true : undefined}
              custom={directionRef.current}
              variants={activeSlideVariants}
              initial="enter"
              animate={isActive ? "center" : "exit"}
              style={{ zIndex: isActive ? 1 : 0 }}
              className={panelClass(tab)}
            >
              {panelRender[tab](isActive)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
