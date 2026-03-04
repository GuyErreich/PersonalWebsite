import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Implosion = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const implosionDuration = 3.0; // The active duration of the collapse phase
  const entryDelay = 4.8; // Starts right near the end of the text collapse
  const totalPhaseTime = implosionDuration + entryDelay;

  useEffect(() => {
    if (skipIntro) return;
    
    let ctx: AudioContext | null = null;
    let isCancelled = false;

    const t = setTimeout(() => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;

        // Big implosion drone/suck sound starting at right now (which is t=4.8s global)
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 3.0); // pitch down heavily
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 2.0); // gets louder as it sucks in
        gain.gain.linearRampToValueAtTime(0, now + 3.0); 

        // Rumbly noise 
        const bufferSize = ctx.sampleRate * 3.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(100, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 2.5); // opens up
        noiseFilter.frequency.exponentialRampToValueAtTime(40, now + 3.0); // closes abruptly

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + 2.5);
        noiseGain.gain.linearRampToValueAtTime(0, now + 2.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        noise.start(now);

        osc.stop(now + 3.2);
        noise.stop(now + 3.2);
      } catch(e) {}
    }, entryDelay * 1000); // 4.8 seconds

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== 'closed') ctx.close().catch(()=>{});
    };
  }, [skipIntro, entryDelay]);
  
  const groupRef = useRef<THREE.Group>(null);
  const voidRef = useRef<THREE.Mesh>(null);
  const horizonRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  const blueDustRef = useRef<THREE.Points>(null);
  const wormholeRef = useRef<THREE.LineSegments>(null);
  
  // Create space ripples that will fall inward
  const rippleRefs = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      ref: React.createRef<THREE.Mesh>(),
      startDelay: Math.random() * 1.5,
      speed: 1.2 + Math.random() * 2.0,
      scaleMultiplier: 12 + Math.random() * 6,
      // Keep them mostly facing the camera so they remain visible as ripples
      rotX: (Math.random() - 0.5) * 0.5,
      rotY: (Math.random() - 0.5) * 0.5,
      tiltSpeed: (Math.random() - 0.5) * 2.0
    }));
  }, []);

  // Create Dust Particles getting sucked into the singularity
  const { dustPositions, dustSpeeds } = useMemo(() => {
    const count = 600; // Drastically reduced so they don't overpower the scene
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for(let i = 0; i < count; i++) {
        const r = 4 + Math.random() * 8; // Start closer
        const theta = Math.random() * Math.PI * 2;
        // Form a flat accretion disk instead of a blinding complete sphere
        positions[i*3] = r * Math.cos(theta);
        positions[i*3+1] = (Math.random() - 0.5) * 0.8; // mostly flat on the Y axis
        positions[i*3+2] = r * Math.sin(theta);
        speeds[i] = 1.0 + Math.random() * 2.0; // Slower, more elegant pull
    }
    return { dustPositions: positions, dustSpeeds: speeds };
  }, []);

  // Static blue dust cloud — scattered anchor points that wormhole lasers fire from
  const blueDustPositions = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 28; // 10–38 units: fills the whole visible volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  const blueDustUniforms = useMemo(() => ({ uOpacity: { value: 0.0 }, uSize: { value: 1.8 } }), []);

  const blueDustFragmentShader = `
    uniform float uOpacity;
    void main() {
      float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
      if (d > 1.0) discard;
      float core = 1.0 - smoothstep(0.0, 0.3, d);
      float glow = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);
      vec3 color = mix(vec3(0.05, 0.3, 0.9), vec3(0.7, 0.9, 1.0), core);
      gl_FragColor = vec4(color, (core * 0.9 + glow * 0.35) * uOpacity);
    }
  `;

  // Create 3 rings that will collapse inward
  const rings = useMemo(() => {
    // Generate distinct, orthogonal rotation offsets to ensure no overlap
    const fixedRotations = [
      { rotX: Math.PI / 2, rotY: 0 },         // Flat horizon
      { rotX: Math.PI / 4, rotY: Math.PI / 4 }, // Top-left to bottom-right diagonal
      { rotX: -Math.PI / 4, rotY: Math.PI / 4 } // Top-right to bottom-left diagonal
    ];

    return [0, 1, 2].map((i) => {
      const baseColor = new THREE.Color(["#f59e0b", "#3b82f6", "#10b981"][i]);
      baseColor.multiplyScalar(2.5); // Push into HDR range so they brightly glow
      
      return {
        ref: React.createRef<THREE.Mesh>(),
        rotX: fixedRotations[i].rotX,
        rotY: fixedRotations[i].rotY,
        // Give each ring its own spin direction multiplier so they weave pleasantly forever
        spinDirTargetX: (i % 2 === 0 ? 1 : -1) * (1.0 + i * 0.2),
        spinDirTargetY: (i % 2 !== 0 ? 1 : -1.5) * (1.0 + i * 0.3),
        color: baseColor
      };
    });
  }, []);

  // --------------- Wormhole line system ---------------

  // Per-line state machine: 0=idle, 1=stretching, 2=hold, 3=fading
  const wormholeState = useRef(
    Array.from({ length: 50 }, (_, si) => ({
      phase: 0 as 0 | 1 | 2 | 3,
      t: 0,
      idleT: si * 0.05 + Math.random() * 0.08, // spread initial burst over ~2.5s
      triggerInterval: 0.04 + Math.random() * 0.08, // short re-fire — guarantees 400+ fires
      outerX: 0, outerY: 0, outerZ: 0,
      dustIdx: -1,
      color: Math.random() < 0.55 ? 0 : 1,
    }))
  );

  // Pool of unconsumed blue dust indices — shuffled so firing order is random
  const availablePool = useRef<number[]>(Array.from({ length: 400 }, (_, i) => i).sort(() => Math.random() - 0.5));
  const poolDrained = useRef(false); // one-shot flag to hide all remaining specks at collapse

  // 2 vertices per line
  const wormholePositions = useMemo(() => new Float32Array(50 * 6), []);
  const wormholeAlphas    = useMemo(() => new Float32Array(50 * 2), []);
  const wormholeColors    = useMemo(() => new Float32Array(50 * 6), []);

  const wormholeUniforms = useMemo(() => ({ uOpacity: { value: 0.0 } }), []);

  const wormholeVertexShader = `
    attribute float aAlpha;
    attribute vec3  aColor;
    uniform float   uOpacity;
    varying float   vAlpha;
    varying vec3    vColor;
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vAlpha = aAlpha;
      vColor = aColor;
    }
  `;

  const wormholeFragmentShader = `
    uniform float uOpacity;
    varying float vAlpha;
    varying vec3  vColor;
    void main() {
      gl_FragColor = vec4(vColor, vAlpha * uOpacity);
    }
  `;

  // Custom plasma ember shader — soft radial glow per particle, driven fully by GPU
  const dustUniforms = useMemo(() => ({
    uOpacity:    { value: 0.0 },
    uIntensity:  { value: 1.0 },
    uSize:       { value: 3.0 },
    uAbsorption: { value: 0.0 }, // 0 = glowing plasma, 1 = light-consuming void
  }), []);

  const dustVertexShader = `
    uniform float uSize;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = uSize * (300.0 / -mvPosition.z);
    }
  `;

  const dustFragmentShader = `
    uniform float uOpacity;
    uniform float uIntensity;
    uniform float uAbsorption;

    void main() {
      float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
      if (d > 1.0) discard;

      float core = 1.0 - smoothstep(0.0, 0.25, d);
      float glow = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);

      // Plasma glow color
      vec3 coreColor  = vec3(0.98, 0.88, 1.0);
      vec3 outerColor = vec3(0.55, 0.1,  0.75);
      vec3 plasmaColor = mix(outerColor, coreColor, core) * uIntensity;

      // Absorbed void color — deep black with a faint dark-blue rim
      vec3 voidColor = vec3(0.0, 0.0, 0.02) * (1.0 - core * 0.5);

      // Lerp between plasma glow and absorbed void
      vec3 color = mix(plasmaColor, voidColor, uAbsorption);

      float alpha = (core * 0.95 + glow * 0.5) * uOpacity;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  const [isDone, setIsDone] = useState(false);

  useFrame(({ clock }) => {
    if (isDone) return;
    
    // Total delay before the implosion actually triggers its entrance
    const t = clock.elapsedTime;
    
    if (t > totalPhaseTime) {
      setIsDone(true);
      return;
    }

    // Completely hide everything during the delay
    if (t < entryDelay) {
      rings.forEach(r => { if (r.ref.current) r.ref.current.scale.setScalar(0); });
      rippleRefs.forEach(r => { if (r.ref.current) r.ref.current.scale.setScalar(0); });
      if (voidRef.current) voidRef.current.scale.setScalar(0);
      if (horizonRef.current) horizonRef.current.scale.setScalar(0);
      if (dustRef.current) dustRef.current.visible = false;
      if (blueDustRef.current) blueDustRef.current.visible = false;
      if (wormholeRef.current) wormholeRef.current.visible = false;
      return;
    } else {
      if (dustRef.current) dustRef.current.visible = true;
      if (blueDustRef.current) blueDustRef.current.visible = true;
      if (wormholeRef.current) wormholeRef.current.visible = true;
    }

    const activeT = t - entryDelay;
    const activeDuration = implosionDuration;

    // Progress from 0 to 1 over the active implosion duration
    const progress = activeT / activeDuration;
    
    // We want the rings to start close to the core and hover there for a moment.
    // Then slowly expand outward.
    // Then violently whip back inward at the very end.
    
    let currentScale = 1.0;
    
    // Phase 1: 0.0 to 0.45 (Hover close to the black hole, charging energy over almost half the animation)
    // Phase 2: 0.45 to 0.78 (Expand outward, rapidly increasing speed)
    // Phase 3: 0.78 to 0.88 (Violent collapse inward before the black hole itself collapses)

    let expandCollapse = 0;
    if (progress > 0.45 && progress <= 0.78) {
        // Map 0.45-0.78 to 0.0-1.0
        const outProgress = (progress - 0.45) / 0.33;
        // Ease-in so it starts slow and accelerates outward
        expandCollapse = Math.pow(outProgress, 2.0);
    } else if (progress > 0.78 && progress <= 0.88) {
        // Map 0.78-0.88 to 1.0-0.0
        const inProgress = (0.88 - progress) / 0.10;
        // Ease-out so it starts incredibly fast and slams into the core
        expandCollapse = Math.pow(inProgress, 0.5); 
    } else if (progress > 0.88) {
        expandCollapse = 0; // Stays fully collapsed securely at the core
    }
    
    // The rings appear slightly offset to juice the manifestation!
    const ringDelay = 0.08; 
    const ringActiveT = Math.max(0, activeT - ringDelay);

    // Calculate Black Hole's Intro Bounce (Starts exactly at t=0 of this phase)
    let introBounce = 1.0;
    if (activeT < 0.6) {
      const x = activeT / 0.6; 
      const c1 = 1.70158;
      const c3 = c1 + 1;
      introBounce = Math.max(0, 1.0 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2));
    }

    // Calculate Rings' Intro Bounce (Starts EXACTLY 0.08s later, using the exact same shape!)
    let ringBounce = 1.0;
    if (ringActiveT < 0.6) {
      const rx = ringActiveT / 0.6; 
      const c1 = 1.70158;
      const c3 = c1 + 1;
      ringBounce = Math.max(0, 1.0 + c3 * Math.pow(rx - 1, 3) + c1 * Math.pow(rx - 1, 2));
    }
    
    currentScale = (1.0 + (expandCollapse * 1.8)) * ringBounce;
    
    // Near the very end, make sure to completely pinch to 0 so the universe "disappears" right before big bang
    const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

    rings.forEach((ring) => {
      const mesh = ring.ref.current;
      if (!mesh) return;

      // Z-axis stretch creates a "flare/motion blur" smear effect as they burn up and collapse
      let zStretch = 1.0;
      if (progress > 0.75) {
          zStretch = 1.0 + Math.pow(Math.min(1.0, (progress - 0.75) / 0.13), 3.0) * 8.0; 
      }
      mesh.scale.set(currentScale * finalPinch, currentScale * finalPinch, currentScale * finalPinch * zStretch);
      
      // Persistant slow spin based on overall clock time, independent of the jumpy intro 'activeT'
      const baseSpinSpeed = t * 0.4; 
      // Whip into an absolute frenzy only as they collapse inward
      const frenzySpeed = Math.pow(progress, 3) * 20.0;
      
      mesh.rotation.x = ring.rotX + (baseSpinSpeed * ring.spinDirTargetX) + frenzySpeed * Math.sign(ring.spinDirTargetX);
      mesh.rotation.y = ring.rotY + (baseSpinSpeed * ring.spinDirTargetY) + frenzySpeed * Math.sign(ring.spinDirTargetY);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        // High opacity so they are intensely visible. Fade in sequentially after the hole pops in.
        const fadeIn = Math.min(1, ringActiveT / 0.3);
        mat.opacity = fadeIn * (0.6 + expandCollapse * 0.4) * finalPinch; 
        
        // Dynamically shift the color brightness as the rings charge up and expand
        let intensity = 1.0 + (Math.pow(expandCollapse, 2.0) * 8.0); // Spikes brightly as they pull back
        let whiteMix = 0.0;

        // SUPER GLOW BURN UP: As they violently collapse, they go white-hot supernova
        if (progress > 0.75) {
           const burnProgress = Math.min(1.0, (progress - 0.75) / 0.13);
           intensity += Math.pow(burnProgress, 3.0) * 50.0; // Absolutely blow out the HDR bloom
           whiteMix = Math.pow(burnProgress, 2.0); // Shift base color completely to pure white
        }

        const targetColor = ring.color.clone().multiplyScalar(intensity);
        if (whiteMix > 0) {
           const whiteHot = new THREE.Color(0xffffff).multiplyScalar(intensity);
           targetColor.lerp(whiteHot, whiteMix);
        }
        
        mat.color.copy(targetColor);
      }
    });

    // Space Gravity Ripples (Pulling inwards and spaghettifying)
    rippleRefs.forEach((ripple) => {
      const mesh = ripple.ref.current;
      if (!mesh) return;

      const rippleActiveT = activeT - ripple.startDelay;
      
      if (rippleActiveT < 0 || progress > 0.95) {
        mesh.scale.setScalar(0);
        return;
      }

      // Start large and drop scale exponentially fast
      // Modulo to repeat a few ripples while the black hole is open
      const rawCycle = rippleActiveT * ripple.speed;
      let cycle = rawCycle % 1.0; 

      // Accumulate & Collapse: Delay just a brief moment behind the 3 main Torus rings!
      // The 3 main rings start snapping inward at 0.78.
      // We start sucking the ripples in at 0.82 so they violently *follow* the rings down like a wake.
      if (progress > 0.82) {
        const timeAtLock = (0.82 * activeDuration) - ripple.startDelay;
        const lockLoop = Math.max(0, Math.floor(timeAtLock * ripple.speed));
        const currentLoop = Math.floor(rawCycle);
        
        if (currentLoop > lockLoop) {
            // It has reached the center, don't respawn it at the edge!
            cycle = 1.0; 
        } else {
            // It was already on its way in... violently pull it to the core trailing *just* behind the main rings!
            const suckPhase = Math.min(1.0, (progress - 0.82) / 0.18); // Exactly fills the remaining 0.82 to 1.0 window
            // Use 1.5 exponent here (down from 2.0) to make it snap a bit faster since it has less time to collapse
            cycle = cycle + (1.0 - cycle) * Math.pow(suckPhase, 1.5); 
        }
      }
      
      const currentScale = Math.max(0, 1.0 - Math.pow(cycle, 0.5)) * ripple.scaleMultiplier;
      
      // No extreme spaghettification, keep it feeling like an expanding/contracting spatial ripple
      const warp = Math.pow(cycle, 2.0) * 0.2; 
      
      mesh.scale.set(
        currentScale * finalPinch * (1.0 + warp), 
        currentScale * finalPinch * (1.0 - warp), 
        currentScale * finalPinch
      );

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        // Ramp up the energy massively as the global scene nears its climax point
        const sceneClimaxPulse = Math.pow(progress, 3.0); 

        const intensity = 1.0 + Math.pow(cycle, 1.5) * 3.0 + (sceneClimaxPulse * 15.0);
        
        // Fade in when forming, fade out as it reaches the core
        const startFade = cycle === 1.0 ? 0 : Math.min(1.0, cycle * 5.0);
        const endFade = Math.max(0, 1.0 - Math.pow(cycle, 3.0));
        
        // Base opacity starts subtle (0.15), but surges violently to 0.8+ as the void collapses
        const dynamicOpacity = 0.15 + (sceneClimaxPulse * 0.7);
        
        mat.opacity = startFade * endFade * dynamicOpacity * finalPinch;
        
        // Color shift to white-hot at center and during the climax
        const glowColor = new THREE.Color("#60a5fa").multiplyScalar(intensity);
        mat.color.copy(glowColor);
      }
      
      // Slight tilt so they are clearly 3D but remain readable as ripples
      mesh.rotation.z = rippleActiveT * ripple.tiltSpeed; 
      mesh.rotation.x = ripple.rotX;
      mesh.rotation.y = ripple.rotY;
    });

    // Particle Emissions (Cosmic Dust getting sucked in)
    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < dustPositions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);

        if (dist < 0.05 || progress > 0.98) {
          if (progress <= 0.92) {
            // Respawn at full radius — disk stays dense until the final collapse window
            const r = 8 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            positions[i * 3]     = r * Math.cos(theta);
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 2] = r * Math.sin(theta);
          } else {
            // Past 0.92: accumulate at origin, finalPinch fades opacity
            positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;
          }
        } else {
          // Gravity pull — ramp up speed from 0.70 onward, capped so particles stay visible
          const condenseFactor = progress > 0.70
            ? Math.min(2.2, 1.0 + Math.pow((progress - 0.70) / 0.30, 2.0) * 4.0)
            : 1.0;
          const speed = dustSpeeds[i] * 4.0 * condenseFactor;
          positions[i * 3]     -= (x / dist) * speed * 0.016;
          positions[i * 3 + 1] -= (y / dist) * speed * 0.016;
          positions[i * 3 + 2] -= (z / dist) * speed * 0.016;

          // Orbital swirl — tightens and speeds up as they approach the core
          const swarmBoost = progress > 0.70 ? 1.0 + Math.pow((progress - 0.70) / 0.30, 1.5) * 2.5 : 1.0; // loosened from 6 → 2.5
          const spinSpeed = (3.0 / (dist + 0.1)) * swarmBoost;
          const oldX = positions[i * 3];
          const oldZ = positions[i * 3 + 2];
          positions[i * 3]     = oldX * Math.cos(spinSpeed * 0.016) - oldZ * Math.sin(spinSpeed * 0.016);
          positions[i * 3 + 2] = oldX * Math.sin(spinSpeed * 0.016) + oldZ * Math.cos(spinSpeed * 0.016);
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
      
      const mat = dustRef.current.material as THREE.ShaderMaterial;
      
      // Before 0.70: glowing plasma spiraling inward
      // 0.70 to 0.85: cross-fade to light-absorbing void particles engulfing the black hole
      // 0.85+: fully absorbed, pinch out with finalPinch
      const absorptionProgress = progress > 0.70
        ? Math.min(1.0, (progress - 0.70) / 0.15)
        : 0.0;

      // Opacity: visible during the engulf, then pinched to zero at final collapse
      mat.uniforms.uOpacity.value    = Math.pow(Math.min(1.0, progress * 1.5), 2.0) * 0.7 * finalPinch;
      // Intensity: glows up briefly at 0.70 then dies as absorption takes over
      const prePeakGlow = progress > 0.65 && progress < 0.75
        ? Math.sin(((progress - 0.65) / 0.10) * Math.PI) * 4.0  // brief flare right before they go dark
        : 0.0;
      mat.uniforms.uIntensity.value  = 1.0 + prePeakGlow;
      // Absorption: 0 = bright plasma, 1 = dark void sphere
      mat.uniforms.uAbsorption.value = Math.pow(absorptionProgress, 1.5);
      mat.uniforms.uSize.value       = 0.8;
    }

    // Wormhole laser lines — randomly fired beams that stretch from a far point to the core then fade
    if (wormholeRef.current) {
      const STRETCH = 0.12;
      const HOLD    = 0.03;
      const FADE    = 0.15;
      const posArr   = wormholeRef.current.geometry.attributes.position.array as Float32Array;
      const alphaArr = wormholeRef.current.geometry.attributes.aAlpha.array   as Float32Array;
      const colorArr = wormholeRef.current.geometry.attributes.aColor.array   as Float32Array;
      const dt = 0.016;

      wormholeState.current.forEach((wl, i) => {
        wl.t += dt;

        if (wl.phase === 0) {
          // IDLE: invisible, waiting
          posArr.fill(0, i * 6, i * 6 + 6);
          alphaArr[i * 2] = alphaArr[i * 2 + 1] = 0;
          if (wl.t >= wl.idleT && progress > 0.04 && progress < 0.92) {
            // Pick the next unconsumed blue dust speck from the pool
            const pool = availablePool.current;
            if (pool.length === 0) return; // all consumed, stay idle
            const pick = pool.pop()!;
            wl.dustIdx = pick;
            wl.outerX = blueDustPositions[pick * 3];
            wl.outerY = blueDustPositions[pick * 3 + 1];
            wl.outerZ = blueDustPositions[pick * 3 + 2];
            // Hide the consumed dust speck immediately
            if (blueDustRef.current) {
              const bd = blueDustRef.current.geometry.attributes.position.array as Float32Array;
              bd[pick * 3] = 10000; bd[pick * 3 + 1] = 0; bd[pick * 3 + 2] = 0;
              blueDustRef.current.geometry.attributes.position.needsUpdate = true;
            }
            wl.phase = 1; wl.t = 0;
          }
        } else if (wl.phase === 1) {
          // STRETCHING: inner end shoots from outer position to origin (ease-out cubic)
          const ease = 1.0 - Math.pow(1.0 - Math.min(1, wl.t / STRETCH), 3);
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = wl.outerX * (1 - ease);
          posArr[i * 6 + 4] = wl.outerY * (1 - ease);
          posArr[i * 6 + 5] = wl.outerZ * (1 - ease);
          alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
          if (wl.t >= STRETCH) { wl.phase = 2; wl.t = 0; }
        } else if (wl.phase === 2) {
          // HOLD: full line from outer to core
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
          alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
          if (wl.t >= HOLD) { wl.phase = 3; wl.t = 0; }
        } else if (wl.phase === 3) {
          // FADING: outer (dust/star) end fades first, inner (core) end fades after
          const f = Math.min(1, wl.t / FADE);
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
          alphaArr[i * 2]     = Math.max(0, 1 - f / 0.55);          // outer gone by 55%
          alphaArr[i * 2 + 1] = Math.max(0, 1 - Math.max(0, f - 0.3) / 0.7); // inner lags
          if (wl.t >= FADE) { wl.phase = 0; wl.t = 0; wl.idleT = wl.triggerInterval; }
        }

        // Colors: outer vertex = white hot tip, inner = coloured glow
        colorArr[i * 6]     = 1.0; colorArr[i * 6 + 1] = 1.0; colorArr[i * 6 + 2] = 1.0;
        if (wl.color === 0) { // electric blue tail
          colorArr[i * 6 + 3] = 0.1; colorArr[i * 6 + 4] = 0.55; colorArr[i * 6 + 5] = 1.0;
        } else {              // purple-white tail
          colorArr[i * 6 + 3] = 0.7; colorArr[i * 6 + 4] = 0.1;  colorArr[i * 6 + 5] = 0.9;
        }
      });

      wormholeRef.current.geometry.attributes.position.needsUpdate = true;
      wormholeRef.current.geometry.attributes.aAlpha.needsUpdate    = true;
      wormholeRef.current.geometry.attributes.aColor.needsUpdate    = true;

      const wMat = wormholeRef.current.material as THREE.ShaderMaterial;
      wMat.uniforms.uOpacity.value = Math.pow(Math.min(1, progress * 4), 2) * finalPinch;
    }

    // Blue dust opacity — fades in with the scene, geometry-drained at 0.90 as safety net
    if (blueDustRef.current) {
      if (progress >= 0.90 && !poolDrained.current) {
        poolDrained.current = true;
        const bd = blueDustRef.current.geometry.attributes.position.array as Float32Array;
        availablePool.current.forEach(idx => {
          bd[idx * 3] = 10000; bd[idx * 3 + 1] = 0; bd[idx * 3 + 2] = 0;
        });
        availablePool.current = [];
        blueDustRef.current.geometry.attributes.position.needsUpdate = true;
      }
      const bMat = blueDustRef.current.material as THREE.ShaderMaterial;
      bMat.uniforms.uOpacity.value = Math.pow(Math.min(1, progress * 3), 2) * 0.6 * finalPinch;
    }

    if (voidRef.current && horizonRef.current) {
        // The black hole slowly shrinks down over the first 95% of the animation, 
        // accelerating its shrink-speed as `progress` gets closer to 1.
        // It drops from 1.0 down to a tiny 0.1 spec right before the final instantaneous pinch.
        const coreCollapse = 1.0 - Math.pow(progress, 2.5) * 0.9;

        // Fun intro bounce curve for the black hole spawning in:
        // (Calculated globally above so rings use the exact same elastic curve)

        // The void violently stutters and shakes before absorbing the galaxy
        const shake = 1.0 + (Math.sin(activeT * 40) * 0.03 * expandCollapse);
        
        voidRef.current.scale.setScalar(shake * coreCollapse * finalPinch * introBounce);
        voidRef.current.rotation.x = activeT * 1.5;
        voidRef.current.rotation.y = activeT * 2.0;

        // The glowing rim of the black hole flares out when the rings expand, but is also pulled in by the collapsing core
        horizonRef.current.scale.setScalar((shake * coreCollapse * 1.3 + (expandCollapse * 0.5)) * finalPinch * introBounce);
        horizonRef.current.rotation.x = -activeT * 2.5;
        horizonRef.current.rotation.y = -activeT * 1.8;
        (horizonRef.current.material as THREE.MeshBasicMaterial).opacity = (0.2 + expandCollapse * 0.8) * finalPinch;
    }
  });

  if (isDone) return null;

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} ref={ring.ref} scale={0}>
          {/* Low poly circle bands. 4 radial segments makes it a diamond cross-section, 
              and 12-16 tubular segments gives it that jagged, PS1-era cyclic feel instead of a pure hexagon */}
          {/* Reduced tube thickness from 0.015 -> 0.008 to make them even thinner wire-like bands */}
          <torusGeometry args={[0.8, 0.008, 4, 16]} />
          <meshBasicMaterial 
            color={ring.color} 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      
      {/* Intense Glowing Event Horizon (behind the black hole, wireframe ico) */}
      <mesh ref={horizonRef} scale={0}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Central Black Hole (The Void, solid ico) */}
      <mesh ref={voidRef} scale={0}>
        <icosahedronGeometry args={[0.58, 0]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Spatially distorted gravity ripples */}
      {rippleRefs.map((ripple, i) => (
        <mesh key={`ripple-${i}`} ref={ripple.ref} scale={0}>
          {/* Made the rings thinner so they are less overwhelming */}
          <ringGeometry args={[0.9, 0.905, 64]} />
          <meshBasicMaterial 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Static blue dust cloud — anchor points that wormhole lasers originate from */}
      <points ref={blueDustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[blueDustPositions, 3]} count={blueDustPositions.length / 3} array={blueDustPositions} itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={blueDustUniforms}
          vertexShader={dustVertexShader}
          fragmentShader={blueDustFragmentShader}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Wormhole laser lines — randomly fired beams that stretch from a dust point to the core then vanish */}
      <lineSegments ref={wormholeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[wormholePositions, 3]} count={wormholePositions.length / 3} array={wormholePositions} itemSize={3} />
          <bufferAttribute attach="attributes-aAlpha"   args={[wormholeAlphas,    1]} count={wormholeAlphas.length}          array={wormholeAlphas}    itemSize={1} />
          <bufferAttribute attach="attributes-aColor"   args={[wormholeColors,    3]} count={wormholeColors.length / 3}      array={wormholeColors}    itemSize={3} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={wormholeUniforms}
          vertexShader={wormholeVertexShader}
          fragmentShader={wormholeFragmentShader}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Sucked-in Particle Dust - Plasma Embers with custom radial glow shader */}
      <points ref={dustRef} rotation={[0.5, 0.2, -0.3]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
            count={dustPositions.length / 3}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={dustUniforms}
          vertexShader={dustVertexShader}
          fragmentShader={dustFragmentShader}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
