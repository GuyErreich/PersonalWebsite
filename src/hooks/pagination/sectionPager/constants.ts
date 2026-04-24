/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Duration of custom smooth-scroll animation on strong devices.
 * Uses easeInOutCubic easing. Increase for slower/more cinematic paging.
 */
export const PAGE_SCROLL_DURATION_MS = 1400;
/**
 * Cooldown period (ms) between consecutive page transitions.
 * Prevents rapid-fire paging from repeated input. Should be slightly less than PAGE_SCROLL_DURATION_MS.
 */
export const PAGE_SCROLL_LOCK_MS = 900;
/**
 * Minimum wheel delta (pixels) required to trigger a page advance.
 * Higher = more scrolling needed to page; lower = more sensitive.
 * Typical range: 10–20px for comfortable desktop scrolling.
 */
export const WHEEL_DELTA_THRESHOLD = 12;
/**
 * Minimum touch delta (pixels) required to trigger a page advance.
 * Higher = more swiping needed to page; lower = more sensitive.
 * Typical range: 30–60px for comfortable mobile swiping.
 */
export const TOUCH_DELTA_THRESHOLD = 40;
