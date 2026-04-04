import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationOrchestrator } from '../lib/AnimationOrchestrator';

export const useRewindSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator | null) => {
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || !orchestrator || played.current) return;
    
    // Check for rewind trigger on thought sequence start
    const thoughtsProxy = orchestrator.getProxy("thoughts");
    if (thoughtsProxy.progress > 0.9 && thoughtsProxy.progress < 1) {
      played.current = true;
      try {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const duration = 0.6; // Short rewind effect

        // Create reverse/rewind tape effect with rising pitch
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + duration);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        // Add bit-crushing effect for tape degradation
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1500, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration);
      } catch (e) {
        console.error("Rewind sound error:", e);
      }
    }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);
};
