import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationOrchestrator } from '../../../../../lib/AnimationOrchestrator';

export const useCameraRumbleSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator | null) => {
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || played.current || !orchestrator) return;
    
    // Trigger on climax proxy
    const proxy = orchestrator.getProxy("camera-climax");
    if (proxy.progress > 0 && proxy.progress < 1) {
        played.current = true;
        try {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            const ctx = audioCtxRef.current || new AudioCtx();
            audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const lfo = ctx.createOscillator();
            const gain = ctx.createGain();

            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(25, now);
            
            const lfoGain = ctx.createGain();
            lfoGain.gain.setValueAtTime(30, now);
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(45, now);
            osc.frequency.linearRampToValueAtTime(30, now + 1.0);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.5, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2); 

            osc.connect(gain);
            gain.connect(ctx.destination);
            
            lfo.start(now);
            osc.start(now);
            lfo.stop(now + 1.5);
            osc.stop(now + 1.5);
        } catch { /* ignore */ 
            console.warn("Audio rumble failed");
        }
    }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(()=>{});
      }
    };
  }, []);
};
