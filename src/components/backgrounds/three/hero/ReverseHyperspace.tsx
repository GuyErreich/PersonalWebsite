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
      
      const now = ctx.currentTime;
      
      // Master Compressor for punch
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -10;
      compressor.knee.value = 5;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.05;
      compressor.release.value = 0.1;
      compressor.connect(ctx.destination);
      
      // 1. Dual Oscillators tearing apart (One sweeps UP into a scream, one DOWN into sub-bass)
      const oscUp = ctx.createOscillator();
      const oscDown = ctx.createOscillator();
      const gainOsc = ctx.createGain();
      
      oscUp.type = 'triangle';
      oscDown.type = 'sine';
      
      oscUp.frequency.setValueAtTime(110, now); // A2
      oscUp.frequency.exponentialRampToValueAtTime(1800, now + 1.85); // Screams upward
      
      oscDown.frequency.setValueAtTime(220, now); // A3
      oscDown.frequency.exponentialRampToValueAtTime(10, now + 1.85); // Plummets into rumble
      
      gainOsc.gain.setValueAtTime(0, now);
      gainOsc.gain.linearRampToValueAtTime(0.1, now + 0.2);
      gainOsc.gain.exponentialRampToValueAtTime(0.5, now + 1.8); 
      gainOsc.gain.linearRampToValueAtTime(0.001, now + 1.9); 
      
      oscUp.connect(gainOsc);
      oscDown.connect(gainOsc);
      gainOsc.connect(compressor);
      
      // 2. Heavy Flange/Phaser Noise (Simulates matter tearing/warp drive)
      const bufferSize = ctx.sampleRate * 2.0; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Brown/Pinkish noise integration for deeper rumble
        data[i] = (Math.random() * 2 - 1) + (i > 0 ? data[i-1] * 0.9 : 0);
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Double filter configuration to create a sweeping phase/flange effect
      const noiseFilter1 = ctx.createBiquadFilter();
      noiseFilter1.type = 'lowpass'; 
      noiseFilter1.Q.value = 3.0; // Resonance
      noiseFilter1.frequency.setValueAtTime(50, now);
      noiseFilter1.frequency.exponentialRampToValueAtTime(8000, now + 1.85);
      
      const noiseFilter2 = ctx.createBiquadFilter();
      noiseFilter2.type = 'highpass'; 
      noiseFilter2.Q.value = 2.0;
      noiseFilter2.frequency.setValueAtTime(8000, now);
      noiseFilter2.frequency.exponentialRampToValueAtTime(40, now + 1.85);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
      noiseGain.gain.linearRampToValueAtTime(1.5, now + 1.8); // Builds up immensely
      noiseGain.gain.linearRampToValueAtTime(0.001, now + 1.9);
      
      noise.connect(noiseFilter1); // Signal splits into two filters sweeping oppositely
      noise.connect(noiseFilter2);
      
      noiseFilter1.connect(noiseGain);
      noiseFilter2.connect(noiseGain);
      noiseGain.connect(compressor);

      oscUp.start(now);
      oscDown.start(now);
      noise.start(now);
      
      oscUp.stop(now + 2);
      oscDown.stop(now + 2);
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
