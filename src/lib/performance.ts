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
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory <= 4) {
    return true;
  }

  // Check for Chromebook, low-end Android, or embedded devices
  const userAgent = navigator.userAgent.toLowerCase();
  const lowEndPatterns = [
    /cros[;i]/, // Chromebook
    /android.*(sm|gt)-[a-z]/i, // Low-end Samsung/GT
    /iphone.*(5|6)[\s;]/i, // Old iPhones
  ];

  if (lowEndPatterns.some((pattern) => pattern.test(userAgent))) {
    return true;
  }

  // Check viewport size as proxy for device power (very small screens often = low-end phones)
  if (typeof window !== "undefined" && window.innerWidth < 375) {
    return true;
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
  const low = isLowEndDevice();

  // Low-end: cap at 1.0 (native pixels, no upscaling)
  // Mid-range: cap at min(2.0, actual DPR)
  // High-end: cap at min(3.0, actual DPR)
  if (low) {
    return Math.min(1.0, devicePixelRatio);
  }

  return Math.min(2.0, devicePixelRatio);
};

/**
 * Determine if heavy hero effects should be rendered.
 * Disable on mobile, low-end, or when user prefers reduced motion.
 */
export const shouldRenderHeavyEffects = (): boolean => {
  if (typeof window === "undefined") return true;

  // Respect prefers-reduced-motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // Disable on low-end and mobile
  const isMobile = window.innerWidth < 768;
  if (isMobile || isLowEndDevice()) {
    return false;
  }

  return true;
};
