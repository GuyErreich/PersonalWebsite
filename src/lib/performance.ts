/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Detect low-end devices based on memory and GPU capabilities.
 * Used to disable heavy animations and reduce canvas rendering quality.
 */
export const isLowEndDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check device memory (if available)
  // Threshold of 2GB targets truly ancient/embedded devices (budget Android from 2019 or earlier).
  // 4GB is mainstream mid-range in 2026 — do NOT flag those as low-end.
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory <= 2) {
    return true;
  }

  // For browsers that do not expose deviceMemory, use a conservative fallback.
  // Keep this very strict to avoid misclassifying capable modern phones in emulation.
  const hardwareConcurrency = navigator.hardwareConcurrency;
  if (deviceMemory === undefined && hardwareConcurrency > 0 && hardwareConcurrency <= 4) {
    if (window.innerWidth <= 320) {
      return true;
    }
  }

  return false;
};

/**
 * Get appropriate device pixel ratio cap for Canvas rendering.
 * Reduces DPR on lower-end devices to improve performance.
 */
export const getCanvasDPR = (): number => {
  if (typeof window === "undefined") return 1;

  const devicePixelRatio = window.devicePixelRatio || 1;

  // Truly low-end (<=2GB RAM): cap at 1.0 to save GPU bandwidth
  if (isLowEndDevice()) {
    return Math.min(1.0, devicePixelRatio);
  }

  // Mobile: cap at 1.5 — retina quality without 4x pixel cost of 3x DPR screens
  if (window.innerWidth < 768) {
    return Math.min(1.5, devicePixelRatio);
  }

  // Desktop/tablet: cap at 2.0 — covers retina, avoids 3x overkill
  return Math.min(2.0, devicePixelRatio);
};

/**
 * Determine if heavy hero effects should be rendered.
 * Only disables for explicit user preference or truly ancient hardware.
 * Mobile devices with capable GPUs should still get the full experience.
 */
export const shouldRenderHeavyEffects = (): boolean => {
  if (typeof window === "undefined") return true;

  // Respect explicit user preference first.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // Debug override is development-only.
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const fx = params.get("fx");
    if (fx === "1") return true;
    if (fx === "0") return false;
  }

  // Only skip on genuinely incapable hardware (<=2GB RAM)
  if (isLowEndDevice()) {
    return false;
  }

  return true;
};
