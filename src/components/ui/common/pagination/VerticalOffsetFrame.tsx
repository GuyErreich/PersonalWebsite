/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, type Transition } from "framer-motion";
import type { ReactNode, RefObject } from "react";

interface VerticalOffsetFrameProps {
  offset: number;
  step: number;
  children: ReactNode;
  viewportClassName?: string;
  contentClassName?: string;
  transition?: Transition;
  viewportRef?: RefObject<HTMLDivElement | null>;
}

export const VerticalOffsetFrame = ({
  offset,
  step,
  children,
  viewportClassName = "flex-1 overflow-hidden h-full",
  contentClassName = "flex flex-col gap-2 h-full",
  transition = { type: "spring", stiffness: 350, damping: 32, mass: 0.8 },
  viewportRef,
}: VerticalOffsetFrameProps) => {
  return (
    <div ref={viewportRef} className={viewportClassName}>
      <motion.div
        className={contentClassName}
        animate={{ y: -offset * step }}
        transition={transition}
      >
        {children}
      </motion.div>
    </div>
  );
};
