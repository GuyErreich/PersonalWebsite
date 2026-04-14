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
}

export const PaginatedSlideFrame = ({
  direction,
  frameKey,
  children,
  contentClassName,
  clipClassName = "relative overflow-hidden",
}: PaginatedSlideFrameProps) => {
  return (
    <motion.div layout transition={{ layout: { duration: 0.5, ease: "easeInOut" } }}>
      <div className={clipClassName}>
        <AnimatePresence mode="popLayout" custom={direction}>
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
