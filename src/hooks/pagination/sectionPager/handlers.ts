/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { TOUCH_DELTA_THRESHOLD, WHEEL_DELTA_THRESHOLD } from "./constants";
import { hasActiveInteractiveElement, isInteractiveElement } from "./helpers";

/**
 * Mutable state for tracking an active touch gesture across touchstart → touchmove → touchend.
 * Prevents duplicate paging when both touchmove and touchend would trigger the same page advance.
 *
 * @property touchStartY - Vertical position where touch began (clientY)
 * @property touchStartTarget - Event target where touch began (used for nested scrollable checks)
 * @property hasHandledTouchGesture - Flag set to true after touchmove pages; prevents touchend re-paging
 */
interface TouchGestureState {
  touchStartY: number;
  touchStartTarget: EventTarget | null;
  hasHandledTouchGesture: boolean;
}

/**
 * Configuration object passed to createSectionPagerHandlers factory.
 * Provides callbacks for paging decisions and state queries without coupling handlers to orchestration.
 *
 * @property isHeroIntroScrollLocked - Function that returns true if hero intro lock is currently active
 * @property canPageFromTarget - Function that checks if paging is allowed from a given event target
 * @property pageByDelta - Function that advances/reverses sections by a given delta (1 or -1)
 * @property touchState - Mutable object tracking active touch gesture across events
 */
interface SectionPagerHandlersArgs {
  isHeroIntroScrollLocked: () => boolean;
  canPageFromTarget: (target: EventTarget | null, deltaY: number) => boolean;
  pageByDelta: (delta: number) => void;
  touchState: TouchGestureState;
}

/**
 * Factory function that creates all input event handlers (wheel, touch, keyboard).
 * Encapsulates event-specific logic and gesture state management in closures over the provided callbacks.
 *
 * Event handler behavior:
 * - **onWheel**: Respects Ctrl key (browser zoom), delta threshold, and hero lock. Prevents default and pages.
 * - **onTouchStart**: Records starting Y position and target element for delta calculation.
 * - **onTouchMove**: Checks delta, prevents native scroll momentum, and pages if delta is sufficient. Handles gesture lock to prevent duplicate paging.
 * - **onTouchEnd**: Final fallback paging if touchmove didn't handle the gesture (for velocity-based swipes).
 * - **onTouchCancel**: Resets gesture state if touch is cancelled.
 * - **onKeyDown**: Pages on Arrow/Page/Space keys, skipping text inputs and hero lock.
 *
 * @param args - Configuration object with paging callbacks and touch state
 * @returns Object with six event handler functions (onWheel, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onKeyDown)
 *
 * @example
 * const handlers = createSectionPagerHandlers({
 *   isHeroIntroScrollLocked: () => heroLocked,
 *   canPageFromTarget: (target, deltaY) => checkAllowed(target, deltaY),
 *   pageByDelta: (delta) => pageByDelta(delta),
 *   touchState: { touchStartY: 0, touchStartTarget: null, hasHandledTouchGesture: false }
 * });
 * main.addEventListener('wheel', handlers.onWheel, { passive: false });
 * main.addEventListener('touchmove', handlers.onTouchMove, { passive: false });
 */
export const createSectionPagerHandlers = ({
  isHeroIntroScrollLocked,
  canPageFromTarget,
  pageByDelta,
  touchState,
}: SectionPagerHandlersArgs) => {
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    if (Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD) return;
    if (isInteractiveElement(event.target) || hasActiveInteractiveElement()) return;

    if (isHeroIntroScrollLocked()) {
      event.preventDefault();
      return;
    }

    if (event.defaultPrevented) return;
    if (!canPageFromTarget(event.target, event.deltaY)) return;

    event.preventDefault();
    pageByDelta(event.deltaY > 0 ? 1 : -1);
  };

  const onTouchStart = (event: TouchEvent) => {
    if (isInteractiveElement(event.target) || hasActiveInteractiveElement()) {
      touchState.touchStartTarget = null;
      touchState.hasHandledTouchGesture = false;
      return;
    }

    touchState.touchStartY = event.touches[0]?.clientY ?? 0;
    touchState.touchStartTarget = event.target;
    touchState.hasHandledTouchGesture = false;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (isInteractiveElement(event.target) || hasActiveInteractiveElement()) return;

    if (isHeroIntroScrollLocked()) {
      if (event.cancelable) {
        event.preventDefault();
      }
      return;
    }

    const touchCurrentY = event.touches[0]?.clientY ?? touchState.touchStartY;
    const deltaY = touchState.touchStartY - touchCurrentY;
    if (Math.abs(deltaY) < TOUCH_DELTA_THRESHOLD) return;

    if (!canPageFromTarget(touchState.touchStartTarget, deltaY)) return;

    if (event.cancelable) {
      event.preventDefault();
    }

    if (touchState.hasHandledTouchGesture) return;

    touchState.hasHandledTouchGesture = true;
    pageByDelta(deltaY > 0 ? 1 : -1);
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (isInteractiveElement(event.target) || hasActiveInteractiveElement()) {
      touchState.hasHandledTouchGesture = false;
      touchState.touchStartTarget = null;
      return;
    }

    if (touchState.hasHandledTouchGesture) {
      touchState.hasHandledTouchGesture = false;
      touchState.touchStartTarget = null;
      return;
    }

    const touchEndY = event.changedTouches[0]?.clientY ?? touchState.touchStartY;
    const deltaY = touchState.touchStartY - touchEndY;
    if (Math.abs(deltaY) < TOUCH_DELTA_THRESHOLD) return;
    if (isHeroIntroScrollLocked()) return;
    if (!canPageFromTarget(touchState.touchStartTarget, deltaY)) return;

    pageByDelta(deltaY > 0 ? 1 : -1);

    touchState.hasHandledTouchGesture = false;
    touchState.touchStartTarget = null;
  };

  const onTouchCancel = () => {
    touchState.hasHandledTouchGesture = false;
    touchState.touchStartTarget = null;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (isInteractiveElement(event.target) || hasActiveInteractiveElement()) return;
    if (isHeroIntroScrollLocked()) return;

    if (["ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      pageByDelta(1);
      return;
    }

    if (["ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      pageByDelta(-1);
    }
  };

  return {
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
    onKeyDown,
  };
};
