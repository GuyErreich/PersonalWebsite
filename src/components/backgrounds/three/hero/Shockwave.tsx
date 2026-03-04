import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Shockwave = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const explosionRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (skipIntro) return;

    let ctx: AudioContext | null = null;
    let isCancelled = false;

    // Trigger at 9.2s where the shockwave mesh scaling starts
    const t = setTimeout(() => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        
        // Massive low bass hit dropping from high boom to deep rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.05); // sharp attack
        gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0); // long exponential release
        
        // White noise layer for actual "explosion" crunch
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        // starts high freq noise, quickly filters down
        noiseFilter.frequency.setValueAtTime(3000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 1.5);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.8, now + 0.1); 
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        osc.start(now);
        noise.start(now);
        
        osc.stop(now + 2.1);
        noise.stop(now + 2.1);

      } catch(e) {}
    }, 9200);

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== 'closed') ctx.close().catch(()=>{});
    }
  }, [skipIntro]);

  useFrame(({ clock }) => {
    // Offset for the implosion phase (4.8s + 3.0s = 7.8s) + 0.8s of pure silence = 8.6s
    const t = clock.elapsedTime - 9.2;

    // Initial Explosive Sonar Wave (Shockwave flash effect on load)
    if (explosionRef.current) {
      if (t < 0) {
         // Stay invisible and wait during the implosion
         explosionRef.current.visible = false;
         explosionRef.current.scale.setScalar(0);
      } else if (t < 1.5) {
        const progress = t / 1.5; // Reaches 1 at 1.5s
        // Smoothly ease out from exactly scale 0 to 25
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const scale = easeOut * 25;
        
        explosionRef.current.scale.setScalar(scale);

        // Color transition: White -> Bright Yellow -> Deep Orange
        const mat = explosionRef.current.material as THREE.MeshBasicMaterial;
        
        const white = new THREE.Color("#ffffff");
        const yellow = new THREE.Color("#fbbf24");
        const orange = new THREE.Color("#ea580c");
        
        // Fast transition from white to yellow, then slower to orange
        if (progress < 0.2) {
           mat.color.lerpColors(white, yellow, progress / 0.2);
        } else {
           mat.color.lerpColors(yellow, orange, (progress - 0.2) / 0.8);
        }
        
        // Fade from 1 down to 0
        mat.opacity = 1 - easeOut;
        explosionRef.current.visible = true;
      } else {
        explosionRef.current.visible = false; // Turn off entirely after explosion finishes
      }
    }
  });

  return (
    <mesh ref={explosionRef} visible={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial 
        color="#f59e0b" 
        transparent 
        opacity={1} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
        side={THREE.BackSide} /* Allows us to be inside the explosion sphere */ 
      />
    </mesh>
  );
};
