/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { AnimationOrchestrator } from "../../../../../lib/AnimationOrchestrator";
import { getAudioContextClass } from "../../../../../lib/sound/audioContext";

export const useImplosionSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator) => {
  // Tie the implosion sound strictly to its own dedicated audio timeline
  const proxy = orchestrator.getProxy("implosionSound");

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
        const duration = orchestrator.globalDuration;

        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + duration * (2.0 / 3.0));
        gain.gain.linearRampToValueAtTime(0, now + duration);

        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass";
        noiseFilter.frequency.setValueAtTime(100, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(800, now + duration * (2.5 / 3.0));
        noiseFilter.frequency.exponentialRampToValueAtTime(40, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + duration * (2.5 / 3.0));
        noiseGain.gain.linearRampToValueAtTime(0, now + duration * (2.8 / 3.0));

        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        noise.start(now);

        osc.stop(now + duration + 0.2);
        noise.stop(now + duration + 0.2);
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
