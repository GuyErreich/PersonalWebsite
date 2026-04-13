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
