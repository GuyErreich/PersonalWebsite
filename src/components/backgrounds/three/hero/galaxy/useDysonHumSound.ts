/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { AnimationOrchestrator } from "../../../../../lib/AnimationOrchestrator";
import { getAudioContextClass } from "../../../../../lib/sound/audioContext";

export const useDysonHumSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator) => {
  // Tie the Dyson sphere hum to its dedicated proxy
  const proxy = orchestrator.getProxy("dyson");

  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro) return;

    // Check if the visual proxy has started
    if (!played.current && proxy.activeT > 0) {
      played.current = true;
      try {
        const AudioCtx = getAudioContextClass();
        if (!AudioCtx) return;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") void ctx.resume().catch(() => {}); // intentional

        const now = ctx.currentTime;
        const duration = proxy.duration;

        // Create a harmonious hum with harmonic overtones
        const fundamentalOsc = ctx.createOscillator();
        fundamentalOsc.type = "sine";
        fundamentalOsc.frequency.setValueAtTime(110, now); // A2 note
        fundamentalOsc.frequency.linearRampToValueAtTime(132, now + duration); // E3

        const fundamentalGain = ctx.createGain();
        fundamentalGain.gain.setValueAtTime(0, now);
        fundamentalGain.gain.linearRampToValueAtTime(0.3, now + duration * 0.1);
        fundamentalGain.gain.exponentialRampToValueAtTime(0.05, now + duration);

        // Add an octave above for richness
        const overtoneOsc = ctx.createOscillator();
        overtoneOsc.type = "sine";
        overtoneOsc.frequency.setValueAtTime(220, now);
        overtoneOsc.frequency.linearRampToValueAtTime(264, now + duration);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0, now);
        overtoneGain.gain.linearRampToValueAtTime(0.15, now + duration * 0.1);
        overtoneGain.gain.exponentialRampToValueAtTime(0.02, now + duration);

        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);

        fundamentalOsc.connect(fundamentalGain);
        overtoneOsc.connect(overtoneGain);
        fundamentalGain.connect(masterGain);
        overtoneGain.connect(masterGain);
        masterGain.connect(ctx.destination);

        fundamentalOsc.start(now);
        overtoneOsc.start(now);
        fundamentalOsc.stop(now + duration);
        overtoneOsc.stop(now + duration);
      } catch {
        /* ignore */
      }
    }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);
};
