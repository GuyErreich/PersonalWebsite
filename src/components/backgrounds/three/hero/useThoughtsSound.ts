/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import type { AnimationOrchestrator } from "../../../../lib/AnimationOrchestrator";
import { getAudioContextClass } from "../../../../lib/sound/audioContext";

export const useThoughtsSound = (
  skipIntro: boolean,
  orchestrator: AnimationOrchestrator,
  totalThoughts: number,
) => {
  const proxy = orchestrator.getProxy("thoughts");
  const playedFiles = useRef<boolean[]>(Array(totalThoughts).fill(false));
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro) return;

    for (let i = 0; i < totalThoughts; i++) {
      const delay = i * 0.6; // Same stagger as the texts
      if (!playedFiles.current[i] && proxy.activeT >= delay && proxy.activeT > 0) {
        playedFiles.current[i] = true;
        try {
          const AudioCtx = getAudioContextClass();
          if (!AudioCtx) return;
          const ctx = audioCtxRef.current || new AudioCtx();
          audioCtxRef.current = ctx;
          if (ctx.state === "suspended") void ctx.resume().catch(() => {}); // intentional

          const now = ctx.currentTime;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(300 + i * 150, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.04, now + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 2.0);
        } catch {
          /* ignore */
          // Ignore audio context errors if browser blocks autoplay
        }
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
