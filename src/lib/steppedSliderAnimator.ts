/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

interface SteppedSliderAnimatorOptions {
  initialValue: number;
  min: number;
  max: number;
  step: number;
  intervalMs: number;
  onStep: (value: number) => void;
}

export interface SteppedSliderAnimator {
  animateTo: (value: number) => void;
  setImmediate: (value: number) => void;
  setIntervalMs: (value: number) => void;
  resetIntervalMs: () => void;
  stop: () => void;
  getCurrent: () => number;
}

export interface SteppedSliderPullController {
  beginPull: () => void;
  endPull: () => void;
  handleInput: (value: number) => void;
}

interface SteppedSliderPullControllerOptions {
  minIntervalMs?: number;
  maxIntervalMs?: number;
  maxDeltaForFastPull?: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

const roundToStep = (value: number, step: number) => {
  const precision = 1 / step;
  return Math.round(value * precision) / precision;
};

export const createSteppedSliderAnimator = ({
  initialValue,
  min,
  max,
  step,
  intervalMs,
  onStep,
}: SteppedSliderAnimatorOptions): SteppedSliderAnimator => {
  if (!Number.isFinite(step) || step <= 0) {
    throw new RangeError(
      `createSteppedSliderAnimator: step must be a finite positive number, got ${step}`,
    );
  }
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new RangeError(
      `createSteppedSliderAnimator: intervalMs must be a finite positive number, got ${intervalMs}`,
    );
  }

  let current = clamp(roundToStep(initialValue, step), min, max);
  let target = current;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const baseIntervalMs = Math.max(1, intervalMs);
  let currentIntervalMs = baseIntervalMs;

  const stop = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  const tick = () => {
    if (current === target) {
      stop();
      return;
    }

    const direction = target > current ? 1 : -1;
    const nextRaw = current + direction * step;
    const nextDirectional = direction > 0 ? Math.min(nextRaw, target) : Math.max(nextRaw, target);
    const next = clamp(roundToStep(nextDirectional, step), min, max);

    current = next;
    onStep(next);

    if (current === target) stop();
  };

  const scheduleNextTick = () => {
    if (timer) return;

    timer = setTimeout(() => {
      timer = null;
      tick();

      if (current !== target) {
        scheduleNextTick();
      }
    }, currentIntervalMs);
  };

  const start = () => {
    scheduleNextTick();
  };

  return {
    animateTo: (value: number) => {
      target = clamp(roundToStep(value, step), min, max);

      if (target === current) {
        onStep(current);
        stop();
        return;
      }

      start();
    },

    setImmediate: (value: number) => {
      const next = clamp(roundToStep(value, step), min, max);
      current = next;
      target = next;
      stop();
      onStep(next);
    },

    setIntervalMs: (value: number) => {
      const nextInterval = Math.max(1, Math.round(value));
      currentIntervalMs = nextInterval;

      if (!timer) return;

      clearTimeout(timer);
      timer = null;
      scheduleNextTick();
    },

    resetIntervalMs: () => {
      currentIntervalMs = baseIntervalMs;

      if (!timer) return;

      clearTimeout(timer);
      timer = null;
      scheduleNextTick();
    },

    stop,

    getCurrent: () => current,
  };
};

export const createSteppedSliderPullController = (
  animator: SteppedSliderAnimator,
  options: SteppedSliderPullControllerOptions = {},
): SteppedSliderPullController => {
  const minIntervalMs = options.minIntervalMs ?? 6;
  const maxIntervalMs = options.maxIntervalMs ?? 30;
  const maxDeltaForFastPull = options.maxDeltaForFastPull ?? 4;

  let isPulling = false;
  let lastInputValue = animator.getCurrent();

  const getAdaptiveInterval = (delta: number) => {
    const normalized = clamp(delta / maxDeltaForFastPull, 0, 1);
    return maxIntervalMs - normalized * (maxIntervalMs - minIntervalMs);
  };

  return {
    beginPull: () => {
      isPulling = true;
      lastInputValue = animator.getCurrent();
    },

    endPull: () => {
      isPulling = false;
      animator.resetIntervalMs();
      animator.setImmediate(animator.getCurrent());
    },

    handleInput: (value: number) => {
      if (isPulling) {
        const delta = Math.abs(value - lastInputValue);
        const adaptiveInterval = getAdaptiveInterval(delta);
        animator.setIntervalMs(adaptiveInterval);
        lastInputValue = value;
        animator.animateTo(value);
        return;
      }

      animator.resetIntervalMs();
      animator.setImmediate(value);
    },
  };
};
