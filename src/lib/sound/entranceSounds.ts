/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { getAudioContextClass } from "./audioContext";

let sharedEntranceCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (sharedEntranceCtx && sharedEntranceCtx.state !== "closed") {
    if (sharedEntranceCtx.state === "suspended") sharedEntranceCtx.resume().catch(() => {});
    return sharedEntranceCtx;
  }
  try {
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;
    sharedEntranceCtx = new AudioCtx();
    return sharedEntranceCtx;
  } catch {
    return null;
  }
};

/** 8-bit ascending chime: C5 → E5 → G5 → C6 (square wave) */
export const playGameDevChime = () => {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      const t = ctx.currentTime + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  } catch {
    // intentional — AudioContext autoplay blocked or in bad state
  }
};

/** Rising terminal beeps: 440 Hz → 520 Hz → 880 Hz (sine) */
export const playDevOpsBeeps = () => {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    [0, 0.46, 0.92].forEach((offset, i) => {
      const freq = i === 2 ? 880 : 440 + i * 80;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const t = ctx.currentTime + offset;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch {
    // intentional — AudioContext autoplay blocked or in bad state
  }
};
