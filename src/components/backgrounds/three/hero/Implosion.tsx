import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Implosion = () => {
  const implosionDuration = 3.0; // The active duration of the collapse phase
  const entryDelay = 4.8; // Starts right near the end of the text collapse
  const totalPhaseTime = implosionDuration + entryDelay;
  
  const groupRef = useRef<THREE.Group>(null);
  const voidRef = useRef<THREE.Mesh>(null);
  const horizonRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Points>(null);
  
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
      return;
    } else {
      if (dustRef.current) dustRef.current.visible = true;
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
    // Phase 2: 0.45 to 0.85 (Expand outward, rapidly increasing speed)
    // Phase 3: 0.85 to 1.0 (Violent collapse inward)

    let expandCollapse = 0;
    if (progress > 0.45 && progress <= 0.85) {
        // Map 0.45-0.85 to 0.0-1.0
        const outProgress = (progress - 0.45) / 0.4;
        // Ease-in so it starts slow and accelerates outward
        expandCollapse = Math.pow(outProgress, 2.0);
    } else if (progress > 0.85) {
        // Map 0.85-1.0 to 1.0-0.0
        const inProgress = (1.0 - progress) / 0.15;
        // Ease-out so it starts incredibly fast and slams into the core
        expandCollapse = Math.pow(inProgress, 0.5); 
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
    const finalPinch = progress > 0.95 ? (1 - (progress - 0.95) * 20) : 1;

    rings.forEach((ring) => {
      const mesh = ring.ref.current;
      if (!mesh) return;

      // Z-axis stretch creates a "flare/motion blur" smear effect as they burn up and collapse
      let zStretch = 1.0;
      if (progress > 0.8) {
          zStretch = 1.0 + Math.pow((progress - 0.8) / 0.2, 3.0) * 8.0; 
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

        // SUPER GLOW BURN UP: In the final 20% of the animation, they go white-hot supernova
        if (progress > 0.8) {
           const burnProgress = (progress - 0.8) / 0.2;
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
      // The 3 main rings start snapping inward at 0.85.
      // We start sucking the ripples in at 0.88 so they violently *follow* the rings down like a wake.
      if (progress > 0.88) {
        const timeAtLock = (0.88 * activeDuration) - ripple.startDelay;
        const lockLoop = Math.max(0, Math.floor(timeAtLock * ripple.speed));
        const currentLoop = Math.floor(rawCycle);
        
        if (currentLoop > lockLoop) {
            // It has reached the center, don't respawn it at the edge!
            cycle = 1.0; 
        } else {
            // It was already on its way in... violently pull it to the core trailing *just* behind the main rings!
            const suckPhase = Math.min(1.0, (progress - 0.88) / 0.12); // Exactly fills the remaining 0.88 to 1.0 window
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
        
        if (dist < 0.2 || progress > 0.95) {
          // Send back to outer shell if not finished
          if (progress <= 0.95) {
            const r = 8 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            positions[i * 3] = r * Math.cos(theta);
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 2] = r * Math.sin(theta);
          } else {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
          }
        } else {
          // Gravity acceleration pulling to center cleanly
          const speed = (dustSpeeds[i] * 4.0); // Smooth constant pull
          positions[i * 3] -= (x / dist) * speed * 0.016;
          positions[i * 3 + 1] -= (y / dist) * speed * 0.016;
          positions[i * 3 + 2] -= (z / dist) * speed * 0.016;
          
          // Add a strong horizontal swirl so they orbit around the black hole while falling in
          const spinSpeed = 3.0 / (dist + 0.1);
          const oldX = positions[i * 3];
          const oldZ = positions[i * 3 + 2];
          positions[i * 3] = oldX * Math.cos(spinSpeed * 0.016) - oldZ * Math.sin(spinSpeed * 0.016);
          positions[i * 3 + 2] = oldX * Math.sin(spinSpeed * 0.016) + oldZ * Math.cos(spinSpeed * 0.016);
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
      
      const mat = dustRef.current.material as THREE.PointsMaterial;
      
      // Make particles much brighter, scale slightly over time, and radically pulse at the climax
      const sceneClimaxPulse = Math.pow(progress, 3.0);
      const intensity = 1.0 + (sceneClimaxPulse * 8.0); // Flare up intensely right before swallowing
      
      // Increase base opacity to make them pop out more against the background
      mat.opacity = Math.min(0.85, activeT * 2.0) * finalPinch;
      
      // Give them a vibrant hot-pink / electric blue cosmic glowing tint rather than plain white dust
      mat.color = new THREE.Color("#d8b4fe").multiplyScalar(intensity); // Bright lavender/pink
      mat.size = 0.03 + (sceneClimaxPulse * 0.04); // swell their physical size right as they die
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

      {/* Sucked-in Particle Dust - Tilted so it forms a visible 3D accretion disk instead of a flat line */}
      <points ref={dustRef} rotation={[0.5, 0.2, -0.3]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustPositions.length / 3}
            array={dustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color="#d8b4fe"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation={true}
        />
      </points>
    </group>
  );
};
