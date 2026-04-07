/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { AnimationOrchestrator } from "../../../../../lib/AnimationOrchestrator";

export const useShockwaveSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator) => {
  const proxy = orchestrator.getProxy("shockwaveSound");
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || played.current || proxy.activeT === 0) return;
    played.current = true;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;

      const subOsc1 = ctx.createOscillator();
      const subOsc2 = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc1.type = "sine";
      subOsc2.type = "triangle";

      subOsc1.frequency.setValueAtTime(250, now);
      subOsc1.frequency.exponentialRampToValueAtTime(20, now + 0.15);
      subOsc1.frequency.linearRampToValueAtTime(1, now + 8.0);

      subOsc2.frequency.setValueAtTime(200, now);
      subOsc2.frequency.exponentialRampToValueAtTime(15, now + 0.2);
      subOsc2.frequency.linearRampToValueAtTime(1, now + 8.0);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(5.0, now + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.8, now + 1.2);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0);

      const tearOsc = ctx.createOscillator();
      const tearGain = ctx.createGain();
      tearOsc.type = "square";

      tearOsc.frequency.setValueAtTime(35, now);
      tearOsc.frequency.linearRampToValueAtTime(5, now + 5.0);

      tearGain.gain.setValueAtTime(0, now);
      tearGain.gain.linearRampToValueAtTime(2.0, now + 0.1);
      tearGain.gain.exponentialRampToValueAtTime(0.2, now + 2.5);
      tearGain.gain.linearRampToValueAtTime(0, now + 5.0);

      const tearFilter = ctx.createBiquadFilter();
      tearFilter.type = "lowpass";
      tearFilter.Q.value = 5;
      tearFilter.frequency.setValueAtTime(300, now);
      tearFilter.frequency.exponentialRampToValueAtTime(30, now + 3.5);

      const bufferSize = ctx.sampleRate * 8.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "lowpass";
      noiseFilter.Q.value = 0.5;

      noiseFilter.frequency.setValueAtTime(500, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 1.0);
      noiseFilter.frequency.linearRampToValueAtTime(10, now + 8.0);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(2.5, now + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.8, now + 2.5);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -20;
      compressor.knee.value = 5;
      compressor.ratio.value = 20;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.3;

      subOsc1.connect(subGain);
      subOsc2.connect(subGain);
      subGain.connect(compressor);

      tearOsc.connect(tearFilter);
      tearFilter.connect(tearGain);
      tearGain.connect(compressor);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(compressor);

      compressor.connect(ctx.destination);

      subOsc1.start(now);
      subOsc2.start(now);
      tearOsc.start(now);
      noise.start(now);

      subOsc1.stop(now + 8.1);
      subOsc2.stop(now + 8.1);
      tearOsc.stop(now + 5.1);
      noise.stop(now + 8.1);
    } catch {
      /* ignore */
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
