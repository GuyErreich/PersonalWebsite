/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Film, Layers, type LucideIcon, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { useGameDevOverviewTabs } from "../hooks/useGameDevOverviewTabs";
import { getOverviewKeepAliveTransition, OVERVIEW_SLIDE_DISTANCE } from "./overviewSlideVariants";
import { GAMEDEV_OVERVIEW_TAB_ORDER, type GameDevOverviewTab } from "./overviewTabPulse";

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

type PanelPhase = "in" | "snap-in" | "out";

interface OverviewKeepAlivePanelProps {
  isActive: boolean;
  direction: number;
  reduceMotion: boolean;
  panelId: string;
  tabId: string;
  className: string;
  children: ReactNode;
}

const OverviewKeepAlivePanel = ({
  isActive,
  direction,
  reduceMotion,
  panelId,
  tabId,
  className,
  children,
}: OverviewKeepAlivePanelProps) => {
  const [phase, setPhase] = useState<PanelPhase>(isActive ? "in" : "out");
  const [isPaintedHidden, setIsPaintedHidden] = useState(!isActive);
  const wasActiveRef = useRef(isActive);
  const shouldAnimateExitRef = useRef(false);

  useLayoutEffect(() => {
    const wasActive = wasActiveRef.current;
    wasActiveRef.current = isActive;

    if (isActive && !wasActive) {
      setIsPaintedHidden(false);
      setPhase("snap-in");
      return;
    }

    if (!isActive && wasActive) {
      shouldAnimateExitRef.current = true;
      setPhase("out");
    }
  }, [isActive]);

  // Wait until the enter-side snap has painted, then ease to center.
  useEffect(() => {
    if (phase !== "snap-in") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      setPhase("in");
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  const offsetX = reduceMotion ? 0 : direction * OVERVIEW_SLIDE_DISTANCE;
  const isIn = phase === "in";
  const isSnap = phase === "snap-in";
  const animateExit = shouldAnimateExitRef.current;

  return (
    <motion.div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      aria-hidden={!isActive}
      inert={!isActive ? true : undefined}
      initial={false}
      animate={{
        x: isIn ? 0 : offsetX,
        opacity: isIn ? 1 : 0,
      }}
      transition={getOverviewKeepAliveTransition(
        reduceMotion,
        isIn,
        isSnap || (!isActive && !animateExit),
      )}
      onAnimationComplete={() => {
        shouldAnimateExitRef.current = false;
        if (!isActive) {
          setIsPaintedHidden(true);
        }
      }}
      style={{
        zIndex: isActive ? 1 : 0,
        visibility: isPaintedHidden ? "hidden" : "visible",
      }}
      className={`${className} ${isActive ? "gamedev-overview-tab-panel--current" : "gamedev-overview-tab-panel--idle"}`}
    >
      {children}
    </motion.div>
  );
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
    direction,
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
        {GAMEDEV_OVERVIEW_TAB_ORDER.map((tab) => {
          if (!visitedTabs.has(tab)) {
            return null;
          }
          const isActive = activeTab === tab;
          return (
            <OverviewKeepAlivePanel
              key={tab}
              isActive={isActive}
              direction={direction}
              reduceMotion={reduceMotion}
              panelId={panelIds[tab]}
              tabId={tabIds[tab]}
              className={panelClass(tab)}
            >
              {panelRender[tab](isActive)}
            </OverviewKeepAlivePanel>
          );
        })}
      </div>
    </div>
  );
};
