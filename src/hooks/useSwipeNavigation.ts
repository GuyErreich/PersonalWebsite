/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useCallback, useRef } from "react";

interface UseSwipeNavigationOptions {
  /** Called when the user swipes left (finger moves left → go to next). */
  onSwipeLeft: () => void;
  /** Called when the user swipes right (finger moves right → go to prev). */
  onSwipeRight: () => void;
  /** Minimum horizontal distance in px needed to trigger a swipe (default: 50). */
  threshold?: number;
  /**
   * When true, stop touchend bubbling after a successful swipe.
   * Opt-in for nested swipe surfaces (e.g. VFX slider inside another carousel).
   */
  stopPropagationOnSwipe?: boolean;
}

/**
 * Returns `onTouchStart` and `onTouchEnd` handlers to attach to any element.
 * Fires `onSwipeLeft` / `onSwipeRight` when the horizontal touch distance
 * exceeds `threshold`. Ignores primarily-vertical scrolls.
 */
export const useSwipeNavigation = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  stopPropagationOnSwipe = false,
}: UseSwipeNavigationOptions) => {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = startX.current - e.changedTouches[0].clientX;
      const dy = startY.current - e.changedTouches[0].clientY;
      // Ignore if vertical scroll dominates
      if (Math.abs(dy) > Math.abs(dx)) {
        startX.current = null;
        startY.current = null;
        return;
      }
      if (dx > threshold) {
        if (stopPropagationOnSwipe) {
          e.stopPropagation();
        }
        onSwipeLeft();
      } else if (dx < -threshold) {
        if (stopPropagationOnSwipe) {
          e.stopPropagation();
        }
        onSwipeRight();
      }
      startX.current = null;
      startY.current = null;
    },
    [onSwipeLeft, onSwipeRight, stopPropagationOnSwipe, threshold],
  );

  return { onTouchStart, onTouchEnd };
};
