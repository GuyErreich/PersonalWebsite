/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { Transition, Variants } from "framer-motion";

/** Matches `slideXVariants` sign convention: enter from the side you're heading toward. */
const OVERVIEW_SLIDE_DISTANCE = 64;

const OVERVIEW_ENTER_TRANSITION = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1] as const,
} satisfies Transition;

const OVERVIEW_EXIT_TRANSITION = {
  duration: 0.28,
  ease: [0.4, 0, 1, 1] as const,
} satisfies Transition;

const OVERVIEW_REDUCED_ENTER_TRANSITION = {
  duration: 0.18,
  ease: "easeOut" as const,
} satisfies Transition;

const OVERVIEW_REDUCED_EXIT_TRANSITION = {
  duration: 0.14,
  ease: "easeIn" as const,
} satisfies Transition;

export const overviewSlideVariants: Variants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * OVERVIEW_SLIDE_DISTANCE,
  }),
  center: {
    opacity: 1,
    x: 0,
    pointerEvents: "auto",
    transition: OVERVIEW_ENTER_TRANSITION,
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -OVERVIEW_SLIDE_DISTANCE,
    pointerEvents: "none",
    transition: OVERVIEW_EXIT_TRANSITION,
  }),
};

export const overviewReducedSlideVariants: Variants = {
  enter: { opacity: 0 },
  center: {
    opacity: 1,
    pointerEvents: "auto",
    transition: OVERVIEW_REDUCED_ENTER_TRANSITION,
  },
  exit: {
    opacity: 0,
    pointerEvents: "none",
    transition: OVERVIEW_REDUCED_EXIT_TRANSITION,
  },
};

export const getOverviewSlideMotion = (reduceMotion: boolean) => ({
  variants: reduceMotion ? overviewReducedSlideVariants : overviewSlideVariants,
});
