import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationOrchestrator } from '../../../../lib/AnimationOrchestrator';
import { AnimationProvider } from '../../../../lib/AnimationContext';

import { DysonSphere } from './galaxy/DysonSphere';
import { IcosahedronSun } from './galaxy/IcosahedronSun';
import { OrbitingShapes } from './galaxy/OrbitingShapes';
import { Shockwave } from './galaxy/Shockwave';
import { SonarRipples } from './galaxy/SonarRipples';
import { StarParticles } from './galaxy/StarParticles';
import { useShockwaveSound } from './galaxy/useShockwaveSound';
import { useStarsSound } from './galaxy/useStarsSound';

// Base timing configs
const GALAXY_DURATION = 3.0;
const GALAXY_ENTRY_DELAY = 8.2;

export const GalaxyCreation = ({ skipIntro = false }: { skipIntro?: boolean }) => {

  // Initialize the orchestrator globally once per mount
  const orchestrator = useMemo(() => {
    const o = new AnimationOrchestrator();
    o.setGlobalTiming(GALAXY_DURATION, GALAXY_ENTRY_DELAY);
    
    // Config properties natively instantiated for the subcomponents to hook into!
    o.register("stars",          1.0, 0.0);
    o.register("starsSound",     1.0, 0.0);

    o.register("shockwave",      0.5, 0.3); // Starts at ~9.2
    o.register("shockwaveSound", 0.5, 0.3);

    o.register("sun",            0.6, 0.3); 
    o.register("dyson",          0.8, 0.3);
    o.register("ripples",        1.0, 0.3);
    o.register("orbits",         1.0, 0.3);

    return o;
  }, []);

  useEffect(() => {
    orchestrator.playScenario(skipIntro);
  }, [skipIntro, orchestrator]);

  // Each SFX hook reads its own dedicated proxy independently!
  useShockwaveSound(skipIntro, orchestrator);
  useStarsSound(skipIntro, orchestrator);

  const systemRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (systemRef.current) {
      systemRef.current.rotation.x = 0.4;
      systemRef.current.rotation.z = -0.1;
      systemRef.current.position.y = Math.sin(t * 0.5) * 0.5 - 1; 
    }
  });

  return (
    <AnimationProvider orchestrator={orchestrator}>
      <group>
        <group ref={systemRef} position={[0, -1, -5]}>
          <IcosahedronSun />
          <SonarRipples />
          <OrbitingShapes />
          <DysonSphere />
        </group>
        <Shockwave />
        <StarParticles />
      </group>
    </AnimationProvider>
  );
};
