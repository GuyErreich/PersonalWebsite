/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { Transition, Variants } from "framer-motion";

export const overviewSlideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * 40 }),
};

export const overviewReducedSlideVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

export const getOverviewSlideMotion = (reduceMotion: boolean) => ({
  variants: reduceMotion ? overviewReducedSlideVariants : overviewSlideVariants,
  transition: (reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.28, ease: "easeInOut" as const }) satisfies Transition,
});
