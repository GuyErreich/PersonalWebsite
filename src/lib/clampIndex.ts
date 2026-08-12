/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/** Clamp `index` into `[0, length - 1]`, or `0` when `length` is empty. */
export const clampIndex = (index: number, length: number): number => {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(length - 1, index));
};
