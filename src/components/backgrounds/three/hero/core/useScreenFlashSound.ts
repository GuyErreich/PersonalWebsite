/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { AnimationOrchestrator } from "../../../../../lib/AnimationOrchestrator";
import { getAudioContextClass } from "../../../../../lib/sound/audioContext";

export const useScreenFlashSound = (
  skipIntro: boolean,
  orchestrator: AnimationOrchestrator | null,
) => {
  const flashes = useRef({
    implosion: false,
    bang: false,
    jump: false,
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || !orchestrator) return;

    try {
      // Inlined directly (no per-frame helper allocation):
      // flash-implosion and flash-bang are intentionally disabled.
      const jumpProxy = orchestrator.getProxy("flash-jump");
      if (jumpProxy.progress > 0 && jumpProxy.progress < 1 && !flashes.current.jump) {
        flashes.current.jump = true;
        const AudioCtx = getAudioContextClass();
        if (!AudioCtx) return;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === "suspended") void ctx.resume().catch(() => {}); // intentional

        const now = ctx.currentTime;
        const duration = 0.8;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.Q.value = 1.5;
        filter.frequency.setValueAtTime(2500, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1.0, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + duration);
      }
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
