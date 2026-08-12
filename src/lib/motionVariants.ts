/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 *
 * Shared Framer Motion variant definitions for directional page transitions.
 * Pass `custom={directionRef.current}` to both <AnimatePresence> and <motion.div>
 * so exit animations always receive the current direction even when the component
 * has been removed from the React tree.
 */

/** Horizontal slide — used by the full-page paginators (GameDev gallery, DevOps). */
export const slideXVariants = {
  enter: (dir: number) => ({ opacity: 0, x: `${dir * 100}%` }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: `${dir * -100}%` }),
};

/** Vertical slide — used by the compact carousel (GameDev selected-work sidebar). */
export const slideYVariants = {
  enter: (dir: number) => ({ opacity: 0, y: `${dir * 100}%` }),
  center: { opacity: 1, y: 0 },
  exit: (dir: number) => ({ opacity: 0, y: `${dir * -100}%` }),
};

/** Deck-style card switch for the GameDev VFX showcase. */
export const vfxDeckCardVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 88,
    y: 36,
    rotateZ: dir * -9,
    rotateY: dir * 22,
    scale: 0.86,
    filter: "blur(8px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    rotateZ: 0,
    rotateY: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -110,
    y: -42,
    rotateZ: dir * 11,
    rotateY: dir * -26,
    scale: 0.9,
    filter: "blur(10px)",
    transition: {
      type: "spring" as const,
      stiffness: 320,
      damping: 26,
      mass: 0.7,
      opacity: { duration: 0.2 },
      filter: { duration: 0.2 },
    },
  }),
};

/** Idle bob for the settled VFX deck card (media stays transparent). */
export const vfxDeckFloatTransition = {
  y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" as const },
  rotateZ: { duration: 5.6, repeat: Infinity, ease: "easeInOut" as const },
};

export const vfxDeckFloatAnimate = {
  y: [0, -8, 0],
  rotateZ: [0, 0.7, -0.5, 0],
};

/** Background deck plates — swap mid/back poses as the front card changes. */
export const vfxDeckStackPose = {
  mid: (dir: number) => ({
    y: 10,
    x: dir * -12,
    scale: 0.96,
    rotate: dir * -2.8,
    opacity: 0.9,
  }),
  back: (dir: number) => ({
    y: 24,
    x: dir * 14,
    scale: 0.9,
    rotate: dir * 3.2,
    opacity: 0.65,
  }),
};

export const vfxDeckStackSpring = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
  mass: 0.72,
};
