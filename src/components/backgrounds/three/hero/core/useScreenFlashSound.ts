import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationOrchestrator } from '../../../../../lib/AnimationOrchestrator';

export const useScreenFlashSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator | null) => {
  const flashes = useRef({
      implosion: false,
      bang: false,
      jump: false
  });
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro || !orchestrator) return;
    
    try {
        const checkFlash = (proxyName: string, refKey: keyof typeof flashes.current, duration: number, frequency: number, volume: number = 1.0) => {
            const proxy = orchestrator.getProxy(proxyName);
            if (proxy.progress > 0 && proxy.progress < 1 && !flashes.current[refKey]) {
                flashes.current[refKey] = true;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                const ctx = audioCtxRef.current || new AudioCtx();
                audioCtxRef.current = ctx;
                if (ctx.state === 'suspended') ctx.resume();

                const now = ctx.currentTime;
                const bufferSize = ctx.sampleRate * duration;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
                
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.Q.value = 1.5;
                filter.frequency.setValueAtTime(frequency, now);
                filter.frequency.exponentialRampToValueAtTime(100, now + duration);
                
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now);
                gain.gain.linearRampToValueAtTime(volume, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
                
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                
                noise.start(now);
                noise.stop(now + duration);
            }
        };

        // Removed flash-implosion volume so it doesn't steal attention from the beautiful blackhole transition suck sound
        // checkFlash("flash-implosion", "implosion", 1.0, 1500, 0.15);
        // Removed flash-bang sound so only the pure explosion (shockwave) sound plays during galaxy creation
        // checkFlash("flash-bang", "bang", 2.0, 800);
        checkFlash("flash-jump", "jump", 0.8, 2500, 1.0);

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
