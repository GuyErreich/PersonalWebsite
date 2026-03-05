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
      compressor.threshold.value = -12;
      compressor.knee.value = 5;
      compressor.ratio.value = 10;
      compressor.attack.value = 0.01;
      compressor.release.value = 0.1;
      compressor.connect(ctx.destination);

      // Sci-Fi Delay Line (creates a dimensional bouncing / accelerating teleport echo)
      const delayNode = ctx.createDelay();
      delayNode.delayTime.setValueAtTime(0.18, now); // Starts with distinct echoes
      delayNode.delayTime.exponentialRampToValueAtTime(0.015, now + 1.8); // Accelerates into a warp stutter
      
      const feedbackNode = ctx.createGain();
      feedbackNode.gain.setValueAtTime(0.7, now);
      feedbackNode.gain.linearRampToValueAtTime(0.9, now + 1.5); // Feedback intensifies as it speeds up
      
      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode);
      delayNode.connect(compressor);

      // 1. The "Chew" Zap (Sawtooth with high-resonance lowpass drop)
      const chewOsc = ctx.createOscillator();
      const chewGain = ctx.createGain();
      const chewFilter = ctx.createBiquadFilter();

      chewOsc.type = 'sawtooth';
      
      // Pitch drop (the 'pew/chew' transient)
      chewOsc.frequency.setValueAtTime(2000, now);
      chewOsc.frequency.exponentialRampToValueAtTime(80, now + 0.15); // extremely fast drop for "ch" transient
      chewOsc.frequency.linearRampToValueAtTime(40, now + 1.8);
      
      // Vocal Formant Filter (the 'eww' sound) 
      chewFilter.type = 'lowpass';
      chewFilter.Q.value = 20; // Super high resonance creates the liquid/laser squelch
      chewFilter.frequency.setValueAtTime(4000, now);
      chewFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
      
      // Volume envelope (Very short burst)
      chewGain.gain.setValueAtTime(0, now);
      chewGain.gain.linearRampToValueAtTime(0.8, now + 0.02); // instant attack
      chewGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // fast snappy decay
      
      chewOsc.connect(chewFilter);
      chewFilter.connect(chewGain);
      
      // Route the chew directly to output, AND into the accelerating delay line
      chewGain.connect(compressor);
      chewGain.connect(delayNode);

      chewOsc.start(now);
      chewOsc.stop(now + 2.0);

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
