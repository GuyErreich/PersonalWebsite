import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { SonarRipples } from './hero/SonarRipples';
import { Shockwave } from './hero/Shockwave';
import { IcosahedronSun } from './hero/IcosahedronSun';
import { DysonSphere } from './hero/DysonSphere';
import { OrbitingShapes } from './hero/OrbitingShapes';
import { StarParticles } from './hero/StarParticles';
import { Implosion } from './hero/Implosion';
import { FloatingThoughts } from './hero/FloatingThoughts';
import { HyperspaceJump } from './hero/HyperspaceJump';
import { TimeController } from './hero/TimeController';

const CameraShake = () => {
  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;

    let power = 0;
    
    // We update FOV to give a Dolly Zoom effect or slow pan
    let targetFov = 50; // default R3F fov is often 50 or 75, we'll manage it loosely
    let targetZ = 5;

    // Phase 0: Taglines (0 to 4.8)
    if (time < 4.8) {
      // Gentle cinematic reverse dolly (drifting slowly backward)
      targetZ = 5.0 + time * 0.15;
    }
    // Phase 1: Implosion Start (4.8 to 6.8)
    else if (time >= 4.8 && time <= 6.8) {
      // Hold position and start sucking the FOV inward
      const p = (time - 4.8) / 2.0;
      targetZ = 5.72; // max from previous phase
      targetFov = 50 + p * 15; // FOV widening (stretching the edges)
    }
    // Phase 2: Implosion Climax (6.8 to 7.8)
    else if (time > 6.8 && time <= 7.8) {
      const progress = (time - 6.8) / 1.0; 
      power = Math.pow(progress, 3) * 0.06; // Heavy rumble
      
      // Extreme Vertigo: Push camera in heavily while warping FOV out
      targetZ = 5.72 - Math.pow(progress, 2) * 3.5; // fly into the black hole!
      targetFov = 65 + Math.pow(progress, 3) * 40; // warp speed fov
    }
    // Phase 3: The Eerie Silence (7.8 to 9.2)
    else if (time > 7.8 && time < 9.2) {
      // Snaps to perfect clarity
      targetZ = 5;
      targetFov = 50;
      power = 0;
    }
    // Phase 4: Big Bang (9.2 to 10.2)
    else if (time >= 9.2 && time < 10.2) {
      const t = time - 9.2;
      const trauma = 1.0 - t;
      power = Math.pow(trauma, 3) * 0.25; // Massive hit
      targetZ = 5; 
      targetFov = 50 - Math.pow(trauma, 3) * 10; // Slight FOV punch inward on impact
    } else {
      targetZ = 5;
      targetFov = 50;
    }

    // Apply the deterministic FOV and Z
    // (Type cast to any because PerspectiveCamera typing might not automatically be detected)
    const pCam = camera as THREE.PerspectiveCamera;
    if (pCam.fov !== undefined && Math.abs(pCam.fov - targetFov) > 0.1) {
      pCam.fov += (targetFov - pCam.fov) * 0.1; // Smooth interpolate
      pCam.updateProjectionMatrix();
    }
    
    // We lerp the Z position so it's smooth
    pCam.position.z += (targetZ - pCam.position.z) * 0.1;

    // Apply erratic translational shaking on X and Y ONLY if power > 0
    if (power > 0) {
      camera.position.x = (Math.random() - 0.5) * power;
      camera.position.y = (Math.random() - 0.5) * power;
      camera.rotation.z = (Math.random() - 0.5) * power * 0.5;
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.rotation.z = 0;
    }
  });
  return null;
};

// Massive Screen flashes that don't need post-processing (Overlay plane)
const ScreenFlash = () => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    let opacity = 0;
    let hex = '#ffffff';

    // Flash 1: Taglines dying, Implosion starts (~4.8s) - Smooth violet flash
    if (t >= 4.6 && t < 5.4) {
      if (t < 4.8) {
        // 0.2s ramp up
        opacity = ((t - 4.6) / 0.2) * 0.4; // Max opacity 0.4 so it's not totally blinding
      } else {
        // 0.6s fade out
        opacity = (1.0 - (t - 4.8) / 0.6) * 0.4;
      }
      hex = '#4c1d95'; // Deep purple
    }
    // Flash 2a: Light Absorption (7.3s - 7.6s) — Black hole consumes all ambient light
    else if (t >= 7.3 && t < 7.6) {
      // Ramp up darkness like light is being drained from the room
      opacity = Math.pow((t - 7.3) / 0.3, 1.5) * 0.72;
      hex = '#000000';
    }
    // Flash 2b: Singularity Blowout (7.6s - 7.8s) — Compressed energy bursts out as ice-blue
    else if (t >= 7.6 && t < 7.8) {
       // Instantly transitions from dark to blinding as the core implodes
       const p = (t - 7.6) / 0.2;
       opacity = 0.72 + p * (0.9 - 0.72); // cross-fade from dark level up to blinding
       hex = '#e0f2fe';
    } 
    // The Eerie Silence Gap (7.8s - 8.6s) - Pure black that fades to reveal the arriving stars
    else if (t >= 7.8 && t < 8.6) {
       opacity = 1.0 - Math.pow((t - 7.8) / 0.8, 2); // Black fades out as stars appear
       hex = '#000000';
    }
    // Flash 3: The Big Bang (9.2s) - Nuclear White
    else if (t >= 9.2 && t < 10.6) {
      const progress = (t - 9.2) / 1.4; // 1.4s duration
      if (progress < 0.05) {
        opacity = progress / 0.05; // 1-2 frames very fast attack
      } else {
        opacity = Math.pow(1 - ((progress - 0.05) / 0.95), 3); // smooth long tail decay
      }
      hex = '#ffffff';
    }
    // Flash 4: Hyperspace Exit Flash (15.45s)
    else if (t >= 15.45 && t < 15.9) {
      const progress = (t - 15.45) / 0.45;
      if (progress < 0.1) {
        opacity = (progress / 0.1) * 0.8; // sharp attack, not completely blinding
      } else {
        opacity = Math.pow(1 - ((progress - 0.1) / 0.9), 2) * 0.8;
      }
      hex = '#e0ecff'; // slight blue-ish white
    }

    if (materialRef.current) {
      materialRef.current.opacity = opacity;
      materialRef.current.color.set(hex);
      // NOTE: We NEVER toggle transparent at runtime, it breaks ThreeJS depth/alpha sorting!
    }
  });

  return (
    <mesh position={[0, 0, 4.8]}> {/* Put it very close to default camera Z=5 */}
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial ref={materialRef} transparent={true} opacity={0} color="#ffffff" depthWrite={false} />
    </mesh>
  );
};

export const ThreeHeroBackground = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const systemRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    
    // Coordinate the Solar System Orbits
    if (systemRef.current) {
      // Tilt the entire solar system slightly forward for a cinematic 3D layered angle
      systemRef.current.rotation.x = 0.4;
      systemRef.current.rotation.z = -0.1;
      systemRef.current.position.y = Math.sin(t * 0.5) * 0.5; // Make the entire system float gently
    }
  });

  return (
    <>
      <TimeController skipIntro={skipIntro} />
      <fog attach="fog" args={['#111827', 10, 25]} />
      <ambientLight intensity={0.2} />
      
      {/* 3 Point Lighting System mapped to our colors */}
      <directionalLight position={[10, 10, 5]} intensity={1} color="#3b82f6" />      {/* Blue DevOps Light */}
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />   {/* Emerald GameDev Light */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#f59e0b" distance={20} /> {/* Central Sun Core Light emitting outward */}

      <CameraShake />
      <ScreenFlash />

      <FloatingThoughts skipIntro={skipIntro} />
      <Implosion skipIntro={skipIntro} />

      <HyperspaceJump skipIntro={skipIntro} />

      <Shockwave skipIntro={skipIntro} />
      
      <StarParticles skipIntro={skipIntro} />

      <group ref={systemRef} position={[0, -1, -5]}>
        <IcosahedronSun />
        <SonarRipples />
        <OrbitingShapes />
        <DysonSphere />
      </group>
    </>
  );
};
