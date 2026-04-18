/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Cubic easing function for smooth animation.
 * Accelerates in the first half (0 → 0.5) and decelerates in the second half (0.5 → 1).
 * Used for custom scroll animations to create a natural, cinematic feel.
 *
 * @param t - Normalized progress (0 = start, 1 = end)
 * @returns Eased value (0–1)
 *
 * @example
 * const progress = 0.5; // halfway through
 * const eased = easeInOutCubic(progress); // ~0.5
 */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Find the index of the section closest to the top of the visible viewport.
 * Used to determine which section is currently "active" on the screen.
 *
 * @param main - The scroll container element
 * @param sections - Array of section elements to compare
 * @returns Index of the closest section, or -1 if no sections exist
 *
 * @example
 * const current = getClosestSectionIndex(mainRef.current, sections); // 1
 * pageTo(current + 1); // Go to next section
 */
export const getClosestSectionIndex = (main: HTMLElement, sections: HTMLElement[]) => {
  if (sections.length === 0) return -1;

  const mainTop = main.getBoundingClientRect().top;

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section, index) => {
    const distance = Math.abs(section.getBoundingClientRect().top - mainTop);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};

/**
 * Calculate the absolute scroll offset needed to align a section with the viewport top.
 * Accounts for the scroller's current scroll position and relative positioning.
 *
 * @param section - The target section element
 * @param scroller - The scroll container element
 * @returns Absolute scrollTop value to position the section at the top of the viewport
 *
 * @example
 * const targetTop = getTargetScrollTop(nextSection, main);
 * animateScrollTo(targetTop); // Smooth scroll to that position
 */
export const getTargetScrollTop = (section: HTMLElement, scroller: HTMLElement) =>
  section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

export const canPageFromTarget = (
  main: HTMLElement,
  target: EventTarget | null,
  deltaY: number,
) => {
  let el = target as HTMLElement | null;
  while (el && el !== main) {
    if (el.hasAttribute("data-no-swipe-page")) return false;
    el = el.parentElement;
  }

  el = target as HTMLElement | null;
  while (el && el !== main) {
    const { overflowY } = window.getComputedStyle(el);
    if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) {
      const atTop = el.scrollTop === 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
      return deltaY < 0 ? atTop : atBottom;
    }
    el = el.parentElement;
  }

  return true;
};

/**
 * Check if the target element is a text input or contenteditable.
 * Used to prevent paging when user is typing or editing content.
 *
 * @param target - The event target to check
 * @returns true if target is input/textarea/contenteditable, false otherwise
 *
 * @example
 * if (isInteractiveElement(keyEvent.target)) {
 *   return; // Don't page if user is typing
 * }
 */
export const isInteractiveElement = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el) return false;

  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.tagName === "BUTTON" ||
    el.tagName === "A" ||
    el.isContentEditable
  );
};
