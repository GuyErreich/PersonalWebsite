/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { MotionStyle } from "framer-motion";
import { motion, useReducedMotion } from "framer-motion";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  OVERVIEW_TRACK_DURATION_S,
  OVERVIEW_TRACK_EASE_CSS,
  OVERVIEW_TRACK_REDUCED_DURATION_S,
} from "./overviewSlideVariants";

interface GameDevSlidingPanelsProps {
  showSecondaryPanel: boolean;
  motionStyle: MotionStyle;
  primaryPanel: (isPrimaryActive: boolean) => ReactNode;
  secondaryPanel: ReactNode;
}

export const GameDevSlidingPanels = ({
  showSecondaryPanel,
  motionStyle,
  primaryPanel,
  secondaryPanel,
}: GameDevSlidingPanelsProps) => {
  const reduceMotion = Boolean(useReducedMotion());
  const [trackSecondary, setTrackSecondary] = useState(false);
  const [primaryDormant, setPrimaryDormant] = useState(false);
  const [secondaryDormant, setSecondaryDormant] = useState(true);
  const [isTrackMoving, setIsTrackMoving] = useState(false);

  const isFirstTrackSyncRef = useRef(true);
  const trackSecondaryRef = useRef(trackSecondary);
  trackSecondaryRef.current = trackSecondary;
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const durationS = reduceMotion ? OVERVIEW_TRACK_REDUCED_DURATION_S : OVERVIEW_TRACK_DURATION_S;

  const clearSettleTimeout = () => {
    if (settleTimeoutRef.current === null) {
      return;
    }
    clearTimeout(settleTimeoutRef.current);
    settleTimeoutRef.current = null;
  };

  const settleTrack = (landedOnSecondary: boolean) => {
    clearSettleTimeout();
    setIsTrackMoving(false);
    if (landedOnSecondary) {
      setPrimaryDormant(true);
      return;
    }
    setSecondaryDormant(true);
  };
  const settleTrackRef = useRef(settleTrack);
  settleTrackRef.current = settleTrack;

  useLayoutEffect(() => {
    if (showSecondaryPanel) {
      setSecondaryDormant(false);
      return;
    }
    setPrimaryDormant(false);
  }, [showSecondaryPanel]);

  useEffect(() => () => clearSettleTimeout(), []);

  // Pause overview media / wake the incoming pane for one frame before the track moves.
  useEffect(() => {
    if (isFirstTrackSyncRef.current) {
      isFirstTrackSyncRef.current = false;
      return;
    }

    const frame = requestAnimationFrame(() => {
      // No-op when already synced (e.g. reverse toggle before rAF) — avoid stuck isTrackMoving.
      if (trackSecondaryRef.current === showSecondaryPanel) {
        return;
      }
      setIsTrackMoving(true);
      setTrackSecondary(showSecondaryPanel);
      clearSettleTimeout();
      // Fallback if transitionend never fires (disabled CSS transitions / dropped event).
      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null;
        settleTrackRef.current(showSecondaryPanel);
      }, durationS * 1000 + 50);
    });
    return () => {
      cancelAnimationFrame(frame);
      // Cancel any armed settle fallback so a reverse toggle cannot fire settleTrack
      // for a superseded target (stale primaryDormant / secondaryDormant).
      clearSettleTimeout();
    };
  }, [showSecondaryPanel, durationS]);

  const isPrimaryActive = !showSecondaryPanel && !trackSecondary && !isTrackMoving;
  const isSecondaryActive = showSecondaryPanel && trackSecondary && !isTrackMoving;
  const trackStyle = {
    "--gamedev-track-duration": `${durationS}s`,
    "--gamedev-track-ease": OVERVIEW_TRACK_EASE_CSS,
  } as CSSProperties;

  return (
    <motion.div style={motionStyle} className="gamedev-content-shell">
      <div className="gamedev-slider-viewport">
        <div
          style={trackStyle}
          className={`gamedev-slider-track${trackSecondary ? " gamedev-slider-track--secondary" : ""}${isTrackMoving ? " gamedev-slider-track--moving" : ""}`}
          onTransitionEnd={(event) => {
            if (event.propertyName !== "transform") return;
            if (event.target !== event.currentTarget) return;
            settleTrack(
              event.currentTarget.classList.contains("gamedev-slider-track--secondary"),
            );
          }}
        >
          <div
            className={`gamedev-slide${primaryDormant ? " gamedev-slide--dormant" : ""}`}
            aria-hidden={!isPrimaryActive}
            inert={!isPrimaryActive ? true : undefined}
          >
            {primaryPanel(isPrimaryActive)}
          </div>
          <div
            className={`gamedev-slide${secondaryDormant ? " gamedev-slide--dormant" : ""}`}
            aria-hidden={!isSecondaryActive}
            inert={!isSecondaryActive ? true : undefined}
          >
            {secondaryPanel}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
