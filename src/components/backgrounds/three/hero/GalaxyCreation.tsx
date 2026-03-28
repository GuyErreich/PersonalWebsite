import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimationOrchestrator, useBuildOrchestrator } from '../../../../lib/AnimationOrchestrator';
import { AnimationProvider, useOrchestrator } from '../../../../lib/AnimationContext';

import { DysonSphere } from './galaxy/DysonSphere';
import { IcosahedronSun } from './galaxy/IcosahedronSun';
import { OrbitingShapes } from './galaxy/OrbitingShapes';
import { Shockwave } from './galaxy/Shockwave';
import { SonarRipples } from './galaxy/SonarRipples';
import { StarParticles } from './galaxy/StarParticles';
import { useShockwaveSound } from './galaxy/useShockwaveSound';
import { useStarsSound } from './galaxy/useStarsSound';
import { useDysonHumSound } from './galaxy/useDysonHumSound';

export const GalaxyCreation = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const masterOrchestrator = useOrchestrator();
  const masterProxy = masterOrchestrator.getProxy("galaxy_scene");

  // Local orchestrator config - starts at 0, driven by the master proxy
  const orchestrator = useBuildOrchestrator(() => {
    const o = new AnimationOrchestrator();
    o.setGlobalTiming(masterProxy.duration, 0);
    
    o.register("stars",          1.0, 0.0);
    o.register("starsSound",     1.0, 0.0);

    o.register("shockwave",      0.5, 0.3); // Starts at ~30% in
    o.register("shockwaveSound", 0.5, 0.3);

    o.register("sun",            0.6, 0.3); 
    o.register("dyson",          0.8, 0.3);
    o.register("ripples",        1.0, 0.3);
    o.register("orbits",         1.0, 0.3);

    return o;
  }, [masterProxy.duration]);

  useFrame(({ clock }) => {
    if (masterProxy.activeT >= 0) {
      orchestrator.mainTimeline.time(masterProxy.activeT);
    }
    
    const t = clock.elapsedTime;
    if (systemRef.current) {
      systemRef.current.rotation.x = 0.4;
      systemRef.current.rotation.z = -0.1;
      systemRef.current.position.y = Math.sin(t * 0.5) * 0.5 - 1; 
    }
  });

  useShockwaveSound(skipIntro, orchestrator);
  useStarsSound(skipIntro, orchestrator);
  useDysonHumSound(skipIntro, orchestrator);

  const systemRef = useRef<THREE.Group>(null);

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
