import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ReverseHyperspace = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const count = 400;

  useEffect(() => {
    // Generative Synth Time-Jump Sound Effect
    let ctx: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      ctx = new AudioCtx();
      
      // 1. Cinematic reverse suction (Sine sweeping UPwards instead of down)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine'; // much smoother, zero retro vibes
      
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(30, now); // starts deep and sub-audible
      osc.frequency.exponentialRampToValueAtTime(800, now + 1.9); // sweeps up rapidly at the end
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.2); 
      gain.gain.exponentialRampToValueAtTime(0.6, now + 1.8); // volume peaks right before snapping back
      gain.gain.linearRampToValueAtTime(0.001, now + 1.9); 
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      // 2. White noise reverse cymbal/wind rush effect
      const bufferSize = ctx.sampleRate * 2.0; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass'; // Bandpass creates a realistic 'whooshing wind' effect
      noiseFilter.Q.value = 1.0;
      
      // Filter sweeps from muffled up to crisp to simulate moving incredibly fast backward
      noiseFilter.frequency.setValueAtTime(100, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(4000, now + 1.9);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.8, now + 1.8); // Crescendos heavily into the drop
      noiseGain.gain.linearRampToValueAtTime(0.001, now + 1.9);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.start(now);
      noise.start(now);
      
      osc.stop(now + 2);
      noise.stop(now + 2);

    } catch(e) {
      console.warn("Web Audio API not supported", e);
    }
    
    return () => {
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, []);
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 6);
    for(let i=0; i<count; i++) {
        const r = 2 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        // start them slightly behind camera (+Z) and shoot them deep into -Z
        const zStart = 6 + Math.random() * 20;
        const length = 15 + Math.random() * 30;
        
        arr[i*6 + 0] = x;
        arr[i*6 + 1] = y;
        arr[i*6 + 2] = zStart;
        
        arr[i*6 + 3] = x;
        arr[i*6 + 4] = y;
        arr[i*6 + 5] = zStart - length;
    }
    return arr;
  }, [count]);

  const initialData = useMemo(() => {
    const data = [];
    for(let i=0; i<count; i++) {
      const r = 1 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      data.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return data;
  }, [count]);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    if (linesRef.current && materialRef.current) {
        const pos = linesRef.current.geometry.attributes.position.array as Float32Array;
        
        // 2 seconds max duration for the animation. speeds up drastically.
        const flightProgress = Math.max(0, Math.min(1, t / 1.8)); 
        const speed = 200 + Math.pow(flightProgress, 3) * 1500;
        
        for(let i=0; i<count; i++) {
            // move away from camera using actual delta time for smoothness
            const moveDist = speed * delta;
            pos[i*6 + 2] -= moveDist;
            pos[i*6 + 5] -= moveDist;

            // if they are too far away, recycle them near camera
            if (pos[i*6 + 5] < -150) {
                const xy = initialData[i];
                const length = 10 + Math.random() * 20 + (flightProgress * 60); 
                
                pos[i*6 + 0] = xy.x / (1 + flightProgress * 0.5); // constrict towards center as they regress
                pos[i*6 + 1] = xy.y / (1 + flightProgress * 0.5);
                pos[i*6 + 2] = 10 + Math.random() * 20; // spawn behind camera
                
                pos[i*6 + 3] = pos[i*6 + 0];
                pos[i*6 + 4] = pos[i*6 + 1];
                pos[i*6 + 5] = pos[i*6 + 2] - length;
            }
        }
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        
        // flash opacity up
        if (t < 0.2) {
           materialRef.current.opacity = t / 0.2;
        } else {
           materialRef.current.opacity = 1;
        }
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};
