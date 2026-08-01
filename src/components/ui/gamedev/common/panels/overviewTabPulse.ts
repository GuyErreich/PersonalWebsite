/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { Transition } from "framer-motion";

export type GameDevOverviewTab = "showreel" | "projects" | "vfx";

export const GAMEDEV_OVERVIEW_TAB_ORDER: GameDevOverviewTab[] = ["showreel", "projects", "vfx"];

export const getOverviewTabPulseMotion = (isVisited: boolean, reduceMotion = false) => ({
  animate:
    isVisited || reduceMotion
      ? { boxShadow: "0 0 0px rgba(6,182,212,0)" }
      : {
          boxShadow: [
            "0 0 0px rgba(6,182,212,0)",
            "0 0 14px rgba(6,182,212,0.75)",
            "0 0 0px rgba(6,182,212,0)",
          ],
        },
  transition: (isVisited || reduceMotion
    ? { duration: reduceMotion ? 0 : 0.3 }
    : {
        duration: 1.4,
        repeat: Infinity,
        repeatDelay: 0.4,
        ease: "easeInOut",
      }) satisfies Transition,
});
