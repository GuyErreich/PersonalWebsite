/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { MotionValue } from "framer-motion";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

/**
 * Scroll-driven reveal with viewport-anchored fade zones.
 *
 * Enter: fades in as the section's top travels through the bottom 10% of the
 * viewport. Exit: fades out as the section's bottom travels through the top
 * 5% of the viewport. Both zones are fixed viewport-relative offsets regardless
 * of section height, so the animation feels consistent on every screen size.
 *
 * No spring — scrub is 1:1 with scroll for crisp, immediate feedback.
 *
 * Attach `ref` to the section element and spread `motionStyle` onto a
 * motion.div wrapping the section's content (NOT the background).
 */
export const useScrollReveal = () => {
  const ref = useRef<HTMLElement>(null);

  // 0→1 as section top travels through the bottom 10% of the viewport
  const { scrollYProgress: enterProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.9"],
  });

  // 0→1 as section bottom travels through the top 5% of the viewport
  const { scrollYProgress: exitProgress } = useScroll({
    target: ref,
    offset: ["end 0.05", "end start"],
  });

  // Full opacity when fully entered and not yet exiting
  // Typed explicitly to avoid runtime casts — tuple is assignable to MotionValue<number>[]
  const inputs: MotionValue<number>[] = [enterProgress, exitProgress];
  const opacity = useTransform(
    inputs,
    // Exit never goes below 0.5 so content never fully disappears while still in view
    ([enter, exit]: number[]) => Math.min(enter, 1 - exit * 0.5),
  );

  return { ref, motionStyle: { opacity } };
};
