/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useReducedMotion } from "framer-motion";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import { playClickSound } from "../../../../../lib/sound/interactionSounds";
import {
  GAMEDEV_OVERVIEW_TAB_ORDER,
  type GameDevOverviewTab,
  getOverviewTabPulseMotion,
} from "../panels/overviewTabPulse";

interface UseGameDevOverviewTabsOptions {
  /** Distinguishes desktop vs mobile tab/panel id suffixes. */
  idScope: string;
}

export const useGameDevOverviewTabs = ({ idScope }: UseGameDevOverviewTabsOptions) => {
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<GameDevOverviewTab>("showreel");
  const [visitedTabs, setVisitedTabs] = useState<Set<GameDevOverviewTab>>(
    () => new Set(["showreel"]),
  );
  const tabPanelIdBase = useId();
  const showreelTabId = `${tabPanelIdBase}-${idScope}-tab-showreel`;
  const projectsTabId = `${tabPanelIdBase}-${idScope}-tab-projects`;
  const vfxTabId = `${tabPanelIdBase}-${idScope}-tab-vfx`;
  const showreelPanelId = `${tabPanelIdBase}-${idScope}-panel-showreel`;
  const projectsPanelId = `${tabPanelIdBase}-${idScope}-panel-projects`;
  const vfxPanelId = `${tabPanelIdBase}-${idScope}-panel-vfx`;
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

  const tabPulse = (tab: GameDevOverviewTab) =>
    getOverviewTabPulseMotion(visitedTabs.has(tab), Boolean(reduceMotion));

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

  return {
    activeTab,
    directionRef,
    handleTabListKeyDown,
    projectsPanelId,
    projectsTabId,
    reduceMotion: Boolean(reduceMotion),
    showreelPanelId,
    showreelTabId,
    switchTab,
    tabPulse,
    visitedTabs,
    vfxPanelId,
    vfxTabId,
  };
};
