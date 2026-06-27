/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { slideXVariants } from "../../../../lib/motionVariants";

interface PaginatedSlideFrameProps {
  direction: number;
  frameKey: number;
  children: ReactNode;
  contentClassName?: string;
  clipClassName?: string;
  wrapperClassName?: string;
  /** Framer layout animation — disable inside fixed-height panels to avoid scroll flashes */
  enableLayout?: boolean;
  presenceMode?: "sync" | "wait" | "popLayout";
}

export const PaginatedSlideFrame = ({
  direction,
  frameKey,
  children,
  contentClassName,
  clipClassName = "relative overflow-hidden",
  wrapperClassName,
  enableLayout = true,
  presenceMode = "popLayout",
}: PaginatedSlideFrameProps) => {
  return (
    <motion.div
      layout={enableLayout}
      transition={enableLayout ? { layout: { duration: 0.5, ease: "easeInOut" } } : undefined}
      className={wrapperClassName}
    >
      <div className={clipClassName}>
        <AnimatePresence mode={presenceMode} custom={direction}>
          <motion.div
            key={frameKey}
            custom={direction}
            variants={slideXVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={contentClassName}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
