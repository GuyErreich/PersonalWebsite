/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { Transition } from "framer-motion";

/** Shared easing for overview tab panels and the overview ↔ all-projects track. */
export const OVERVIEW_EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const OVERVIEW_EASE_IN = [0.4, 0, 1, 1] as const;

/** Enter and exit share this side so a rightward tab move always exits/enters on the right. */
export const OVERVIEW_SLIDE_DISTANCE = 40;

const OVERVIEW_ENTER_TRANSITION = {
  duration: 0.24,
  ease: OVERVIEW_EASE_OUT,
} satisfies Transition;

export const OVERVIEW_TRACK_DURATION_S = OVERVIEW_ENTER_TRANSITION.duration;
export const OVERVIEW_TRACK_REDUCED_DURATION_S = 0.18;
export const OVERVIEW_TRACK_EASE_CSS = `cubic-bezier(${OVERVIEW_EASE_OUT.join(", ")})`;

const OVERVIEW_EXIT_TRANSITION = {
  duration: 0.18,
  ease: OVERVIEW_EASE_IN,
} satisfies Transition;

const OVERVIEW_REDUCED_ENTER_TRANSITION = {
  duration: 0.18,
  ease: "easeOut" as const,
} satisfies Transition;

const OVERVIEW_REDUCED_EXIT_TRANSITION = {
  duration: 0.14,
  ease: "easeIn" as const,
} satisfies Transition;

export const getOverviewKeepAliveTransition = (
  reduceMotion: boolean,
  isEntering: boolean,
  isSnap: boolean,
): Transition => {
  if (isSnap) {
    return { duration: 0 };
  }
  if (reduceMotion) {
    return isEntering ? OVERVIEW_REDUCED_ENTER_TRANSITION : OVERVIEW_REDUCED_EXIT_TRANSITION;
  }
  return isEntering ? OVERVIEW_ENTER_TRANSITION : OVERVIEW_EXIT_TRANSITION;
};
