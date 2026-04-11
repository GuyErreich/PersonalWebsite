/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { MotionStyle } from "framer-motion";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GameDevSlidingPanelsProps {
  showSecondaryPanel: boolean;
  motionStyle: MotionStyle;
  primaryPanel: ReactNode;
  secondaryPanel: ReactNode;
}

export const GameDevSlidingPanels = ({
  showSecondaryPanel,
  motionStyle,
  primaryPanel,
  secondaryPanel,
}: GameDevSlidingPanelsProps) => {
  return (
    <motion.div style={motionStyle} className="gamedev-content-shell">
      <div className="gamedev-slider-viewport">
        <motion.div
          animate={{ x: showSecondaryPanel ? "-50%" : "0%" }}
          transition={{ type: "spring", stiffness: 150, damping: 24 }}
          className="gamedev-slider-track"
        >
          <div className="gamedev-slide">{primaryPanel}</div>
          <div className="gamedev-slide">{secondaryPanel}</div>
        </motion.div>
      </div>
    </motion.div>
  );
};
