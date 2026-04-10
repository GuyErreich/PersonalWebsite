/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * Returns the AudioContext constructor, handling the webkit vendor prefix.
 * Returns undefined when the Web Audio API is not available.
 */
export const getAudioContextClass = (): typeof AudioContext | undefined =>
  window.AudioContext || (window as WebkitWindow).webkitAudioContext;
