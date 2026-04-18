/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * Detect low-end devices based on memory and GPU capabilities.
 * Targets truly ancient/embedded devices (≤2GB RAM).
 * Modern mid-range phones (4GB+ RAM) are NOT flagged as low-end.
 *
 * Used to disable heavy animations and reduce canvas rendering quality.
 *
 * @returns true if device appears to be low-end, false otherwise
 *
 * @example
 * if (isLowEndDevice()) {
 *   disableWebGLEffects();
 * }
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
 * Balances visual quality with performance:
 * - Low-end: Cap at 1.0 (save GPU bandwidth)
 * - Mobile: Cap at 1.5 (retina quality without 4x cost)
 * - Desktop: Cap at 2.0 (covers retina, avoids 3x overkill)
 *
 * @returns Capped DPR value (1.0 to 2.0)
 *
 * @example
 * const dpr = getCanvasDPR();
 * renderer.setPixelRatio(dpr);
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

interface PerformanceMemoryLike {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Detect runtime memory pressure (best-effort heuristic).
 * Uses Chromium's `performance.memory` when available (78%+ heap used = pressure).
 * Falls back to conservative device-memory heuristics on other browsers.
 *
 * @returns true if heap usage is high or device is memory-constrained on small screen, false otherwise
 *
 * @example
 * if (isMemoryPressureHigh()) {
 *   disableExpensiveAnimations();
 * }
 */
export const isMemoryPressureHigh = (): boolean => {
  if (typeof window === "undefined") return false;

  const perf = performance as Performance & { memory?: PerformanceMemoryLike };
  const memory = perf.memory;
  if (memory && memory.jsHeapSizeLimit > 0) {
    const heapRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    if (heapRatio >= 0.78) return true;
  }

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (deviceMemory !== undefined && deviceMemory <= 4 && window.innerWidth < 1280) {
    return true;
  }

  return false;
};

/**
 * Get adaptive DPR combining base capability and runtime memory pressure.
 * Keeps full quality on capable, cool devices; reduces under memory pressure.
 *
 * @returns Adaptive DPR (1.0 to 2.0 or base cap, whichever is lower)
 *
 * @example
 * const dpr = getAdaptiveCanvasDPR();
 * canvas.width = window.innerWidth * dpr;
 */
export const getAdaptiveCanvasDPR = (): number => {
  const baseDpr = getCanvasDPR();

  if (isMemoryPressureHigh()) {
    return Math.max(1, Math.min(baseDpr, 1.2));
  }

  return baseDpr;
};

/**
 * Determine if device should use native browser smooth-scroll instead of custom JS animation.
 * Conservative gate for JS-heavy scroll paging: low-end, memory-pressured, or mid-tier devices.
 *
 * Gating logic:
 * - Low-end devices (≤2GB) → Use native smooth
 * - High memory pressure → Use native smooth
 * - Mid-tier (≤8GB + ≤8 cores) → Use native smooth
 * - <1440px width (mobile) on unknown memory → Use native smooth
 * - Otherwise → Use custom rAF animation (1400ms easeInOutCubic)
 *
 * @returns true if device should use native smooth scroll, false if custom rAF animation is acceptable
 *
 * @example
 * const useNativeScroll = isMidTierOrConstrainedDevice();
 * if (useNativeScroll) {
 *   section.scrollIntoView({ behavior: 'smooth' });
 * } else {
 *   animateScrollWith(easeInOutCubic, 1400ms);
 * }
 */
export const isMidTierOrConstrainedDevice = (): boolean => {
  if (typeof window === "undefined") return false;

  if (isLowEndDevice() || isMemoryPressureHigh()) {
    return true;
  }

  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;

  if (
    deviceMemory !== undefined &&
    deviceMemory <= 8 &&
    hardwareConcurrency > 0 &&
    hardwareConcurrency <= 8
  ) {
    return true;
  }

  if (deviceMemory === undefined && hardwareConcurrency > 0 && hardwareConcurrency <= 8) {
    return window.innerWidth < 1440;
  }

  return false;
};

/**
 * Determine if heavy hero effects should be rendered.
 * Only disables for explicit user preference or truly ancient hardware.
 * Mobile devices with capable GPUs should still get the full experience.
 */
export const shouldRenderHeavyEffects = (): boolean => {
  if (typeof window === "undefined") return true;

  // Debug override is development-only — must come first so it can force-enable
  // even when prefers-reduced-motion or low-end detection would otherwise block.
  if (import.meta.env.DEV) {
    const params = new URLSearchParams(window.location.search);
    const fx = params.get("fx");
    if (fx === "1") return true;
    if (fx === "0") return false;
  }

  // Respect explicit user preference.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  // Only skip on genuinely incapable hardware (<=2GB RAM)
  if (isLowEndDevice()) {
    return false;
  }

  return true;
};
