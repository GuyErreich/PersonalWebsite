import { useMemo, useRef, useEffect, useContext } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationContext } from '../../../../lib/AnimationContext';

export const HyperspaceJump = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const orchestrator = useContext(AnimationContext);
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  useFrame(() => {
    if (skipIntro || !orchestrator) return;
    
    // SFX block
    const proxy = orchestrator.getProxy("hyperspace");
    if (proxy.progress > 0 && !played.current) {
        played.current = true;
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = audioCtxRef.current || new AudioCtx();
            audioCtxRef.current = ctx;
            if (ctx.state === 'suspended') ctx.resume();

            const now = ctx.currentTime;
            
            // Cinematic fast forward WHOOSH
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 1.0);
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.4, now + 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);

            // Wind rushing effect for realism
            const bufferSize = ctx.sampleRate * 1.5;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
            
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.Q.value = 1.5;
            noiseFilter.frequency.setValueAtTime(200, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(3000, now + 1.0);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.5, now + 0.8);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            
            osc.start(now);
            noise.start(now);
            osc.stop(now + 1.3);
            noise.stop(now + 1.3);
        } catch { /* ignore */ }
    }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(()=>{});
      }
    };
  }, []);
  
  const count = 300;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 6);
    for(let i=0; i<count; i++) {
        const r = 3 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        const zStart = -50 - Math.random() * 100;
        const length = 5 + Math.random() * 25;
        arr[i*6 + 0] = x;
        arr[i*6 + 1] = y;
        arr[i*6 + 2] = zStart;
        arr[i*6 + 3] = x;
        arr[i*6 + 4] = y;
        arr[i*6 + 5] = zStart + length;
    }
    return arr;
  }, [count]);

  const initialData = useMemo(() => {
    const data = [];
    for(let i=0; i<count; i++) {
      const r = 2 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      data.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return data;
  }, [count]);

  useFrame(() => {
    if (!orchestrator) return;
    const p = orchestrator.getProxy("hyperspace");
    const progress = p.progress;

    if (progress === 0 || progress === 1) {
        if (linesRef.current) linesRef.current.visible = false;
        return;
    }

    if (linesRef.current && materialRef.current) {
        linesRef.current.visible = true;
        
        const pos = linesRef.current.geometry.attributes.position.array as Float32Array;
        const speed = 30 + Math.pow(progress, 4) * 800;
        
        for(let i=0; i<count; i++) {
            pos[i*6 + 2] += speed * 0.016;
            pos[i*6 + 5] += speed * 0.016;

            if (pos[i*6 + 2] > 10) {
                const xy = initialData[i];
                const length = 5 + Math.random() * 20 + (progress * 60); 
                
                pos[i*6 + 0] = xy.x * (1 + progress * 0.5); 
                pos[i*6 + 1] = xy.y * (1 + progress * 0.5);
                pos[i*6 + 2] = -150 - Math.random() * 50; 
                
                pos[i*6 + 3] = pos[i*6 + 0];
                pos[i*6 + 4] = pos[i*6 + 1];
                pos[i*6 + 5] = pos[i*6 + 2] + length;
            }
        }
        linesRef.current.geometry.attributes.position.needsUpdate = true;

        let opacity = 1;
        if (progress < 0.23) { // up to ~14.5
            opacity = progress / 0.23;
        }
        if (progress > 0.84) { // past 15.3
            opacity = Math.max(0, 1.0 - ((progress - 0.84) / 0.16));
        }
        materialRef.current.opacity = opacity;
    }
  });

  return (
    <lineSegments ref={linesRef} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};
