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

const CameraShake = () => {
  useFrame(({ clock, camera }) => {
    const time = clock.elapsedTime;

    let power = 0;
    
    if (time > 6.8 && time <= 7.8) {
      // Phase 1: Heavy rumble as the implosion reaches its climax
      const progress = (time - 6.8) / 1.0; 
      power = Math.pow(progress, 3) * 0.06; // Scales up right as the universe pinches out
    } else if (time >= 8.6 && time < 9.6) {
      // Phase 2: Massive explosive hit for the Big Bang
      const t = time - 8.6;
      const trauma = 1.0 - t;
      power = Math.pow(trauma, 3) * 0.25; // Much harder initial hit
    }

    if (power > 0) {
      // Wild erratic positional shaking
      camera.position.x = (Math.random() - 0.5) * power;
      camera.position.y = (Math.random() - 0.5) * power;
      
      // Slight rotational shaking for extra disorientation
      camera.rotation.z = (Math.random() - 0.5) * power * 0.5;
    } else {
      // Return to dead zero center when calm (This gives us the eerie stillness!)
      camera.position.x = 0;
      camera.position.y = 0;
      camera.rotation.z = 0;
    }
  });
  return null;
};

export const ThreeHeroBackground = () => {
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
      <fog attach="fog" args={['#111827', 10, 25]} />
      <ambientLight intensity={0.2} />
      
      {/* 3 Point Lighting System mapped to our colors */}
      <directionalLight position={[10, 10, 5]} intensity={1} color="#3b82f6" />      {/* Blue DevOps Light */}
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />   {/* Emerald GameDev Light */}
      <pointLight position={[0, 0, 0]} intensity={3} color="#f59e0b" distance={20} /> {/* Central Sun Core Light emitting outward */}

      <CameraShake />

      <FloatingThoughts />
      <Implosion />

      <Shockwave />
      
      <StarParticles />

      <group ref={systemRef} position={[0, -1, -5]}>
        <IcosahedronSun />
        <SonarRipples />
        <OrbitingShapes />
        <DysonSphere />
      </group>
    </>
  );
};
