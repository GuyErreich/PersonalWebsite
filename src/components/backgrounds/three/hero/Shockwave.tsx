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
        
        // Layer 1: The Core Detonation (Deep, physical punch like a massive kick drum)
        const subOsc1 = ctx.createOscillator();
        const subOsc2 = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc1.type = 'sine'; 
        subOsc2.type = 'triangle'; // Triangle adds a slightly harder mid-tone "knock"
        
        // Pitch envelope: Starts high and dives instantly to create a concussive "thud"
        subOsc1.frequency.setValueAtTime(250, now);
        subOsc1.frequency.exponentialRampToValueAtTime(20, now + 0.15); 
        subOsc1.frequency.linearRampToValueAtTime(1, now + 8.0); 
        
        subOsc2.frequency.setValueAtTime(200, now);
        subOsc2.frequency.exponentialRampToValueAtTime(15, now + 0.2); 
        subOsc2.frequency.linearRampToValueAtTime(1, now + 8.0); 

        // Extreme punch gain
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(5.0, now + 0.02); // Maximum blunt force
        subGain.gain.exponentialRampToValueAtTime(0.8, now + 1.2); 
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0); 

        // Layer 2: The Erupting Core (Distorted Low-End)
        const tearOsc = ctx.createOscillator();
        const tearGain = ctx.createGain();
        tearOsc.type = 'square'; // Square wave instead of Sawtooth to prevent bright buzzing
        
        tearOsc.frequency.setValueAtTime(35, now); 
        tearOsc.frequency.linearRampToValueAtTime(5, now + 5.0); // Dropping to absolute rumbling clicks
        
        tearGain.gain.setValueAtTime(0, now);
        tearGain.gain.linearRampToValueAtTime(2.0, now + 0.1); 
        tearGain.gain.exponentialRampToValueAtTime(0.2, now + 2.5);
        tearGain.gain.linearRampToValueAtTime(0, now + 5.0);
        
        // Muffle the square wave heavily so it sounds like deep pressure, not a synth
        const tearFilter = ctx.createBiquadFilter();
        tearFilter.type = 'lowpass';
        tearFilter.Q.value = 5; 
        tearFilter.frequency.setValueAtTime(300, now);
        tearFilter.frequency.exponentialRampToValueAtTime(30, now + 3.5);
        
        // Layer 3: Expanding Shockwave (Brownian Noise - heavy and dark like thunder, NO white noise sand)
        const bufferSize = ctx.sampleRate * 8.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for(let i=0; i<bufferSize; i++) {
            // Integrate white noise to create Brown Noise (favors low-end rumble, kills high-end hiss)
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.04 * white)) / 1.04;
            lastOut = data[i];
            data[i] *= 3.5; // Compensate for volume drop from integration
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass'; // Keep it strictly lowpass
        noiseFilter.Q.value = 0.5; 
        
        // Keep the rumble dark and muffled (max 500Hz, no 3000Hz static allowed)
        noiseFilter.frequency.setValueAtTime(500, now); 
        noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 1.0); 
        noiseFilter.frequency.linearRampToValueAtTime(10, now + 8.0); 

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(2.5, now + 0.1); // Heavy thunderous volume
        noiseGain.gain.exponentialRampToValueAtTime(0.8, now + 2.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0); 

        // Heavy Master Compressor to glue it into one single concussive boom
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 5;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.001; // Crush instantly
        compressor.release.value = 0.3;

        // Routing
        subOsc1.connect(subGain);
        subOsc2.connect(subGain);
        subGain.connect(compressor);
        
        tearOsc.connect(tearFilter);
        tearFilter.connect(tearGain);
        tearGain.connect(compressor);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(compressor);
        
        compressor.connect(ctx.destination);
        
        subOsc1.start(now);
        subOsc2.start(now);
        tearOsc.start(now);
        noise.start(now);
        
        subOsc1.stop(now + 8.1);
        subOsc2.stop(now + 8.1);
        tearOsc.stop(now + 5.1);
        noise.stop(now + 8.1);

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
