import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationOrchestrator } from '../../../../../lib/AnimationOrchestrator';

export const useStarsSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator) => {
  const proxy = orchestrator.getProxy("starsSound");
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || played.current || proxy.activeT === 0) return;
    played.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const tStart = ctx.currentTime;

      const drone = ctx.createOscillator();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(110, tStart);
      drone.frequency.exponentialRampToValueAtTime(112, tStart + 4);
      
      const droneGain = ctx.createGain();
      droneGain.gain.setValueAtTime(0, tStart);
      droneGain.gain.linearRampToValueAtTime(0.3, tStart + 2);
      droneGain.gain.linearRampToValueAtTime(0, tStart + 8);
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, tStart);
      filter.frequency.exponentialRampToValueAtTime(800, tStart + 4);
      
      drone.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(ctx.destination);
      
      drone.start(tStart);
      drone.stop(tStart + 8);

      const baseFreqs = [587.33, 739.99, 880.00, 1174.66, 1479.98, 1760.00]; 
      
      for (let i = 0; i < 15; i++) {
          const innerDelay = Math.random() * 6.0; 
          const playChimeT = tStart + innerDelay;
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          const freq = baseFreqs[Math.floor(Math.random() * baseFreqs.length)] + (Math.random() * 4 - 2); 
          osc.type = Math.random() > 0.5 ? 'sine' : 'triangle'; 
          osc.frequency.value = freq;
          
          const swellDuration = 3.0 + Math.random() * 3.0; 
          
          gain.gain.setValueAtTime(0, playChimeT);
          gain.gain.linearRampToValueAtTime(0.015 + Math.random() * 0.015, playChimeT + swellDuration * 0.4);
          gain.gain.exponentialRampToValueAtTime(0.0001, playChimeT + swellDuration);
          
          const highpass = ctx.createBiquadFilter();
          highpass.type = 'highpass';
          highpass.frequency.value = 400;
          
          osc.connect(highpass);
          highpass.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(playChimeT);
          osc.stop(playChimeT + swellDuration);
      }
    } catch { /* ignore */ }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(()=>{});
      }
    };
  }, []);
};
