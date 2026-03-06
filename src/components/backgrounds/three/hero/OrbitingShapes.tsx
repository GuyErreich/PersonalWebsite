import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConstellationWeb } from './ConstellationWeb';
import { OrbitTrackDevOps } from './orbiting-shapes/OrbitTrackDevOps';
import { OrbitTrackGameDev } from './orbiting-shapes/OrbitTrackGameDev';
import { OrbitTrackDataCore } from './orbiting-shapes/OrbitTrackDataCore';

// Pre-calculate mathematically perfect spaced positions for our orbital shapes
const makeOrbitShapes = (radius: number, count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      angle
    };
  });
};

export const OrbitingShapes = () => {
  const orbit1Ref = useRef<THREE.Group>(null);
  const orbit2Ref = useRef<THREE.Group>(null);
  const orbit3Ref = useRef<THREE.Group>(null);

  // We have 3 orbital tracks
  const orbit1Shapes = useMemo(() => makeOrbitShapes(4, 5), []);
  const orbit2Shapes = useMemo(() => makeOrbitShapes(7, 8), []);
  const orbit3Shapes = useMemo(() => makeOrbitShapes(10, 12), []);

  const [visibleState, setVisibleState] = useState({
    track1: false,
    track2: false,
    track3: false
  });

  useFrame(({ clock }) => {
    // Delay creation until after implosion
    const t = Math.max(0, clock.elapsedTime - 9.2);
    
    // Scale up the orbits from 0 to 1 just behind the sun's formation
    const orbitProgress = Math.min(1, Math.max(0, (t - 0.2) / 2.0));
    const orbitEase = 1 - Math.pow(1 - orbitProgress, 4);

    const isVisible = t > 0;
    if (visibleState.track1 !== isVisible) {
       setVisibleState(prev => ({ ...prev, track1: isVisible, track2: isVisible, track3: isVisible }));
    }

    // Spin individual discs at different speeds and direction, mapping the scale ease as well
    if (orbit1Ref.current) {
       orbit1Ref.current.rotation.y = t * 0.15;
       orbit1Ref.current.scale.setScalar(orbitEase);
    }
    if (orbit2Ref.current) {
       orbit2Ref.current.rotation.y = t * 0.1;
       orbit2Ref.current.scale.setScalar(orbitEase);
    }
    if (orbit3Ref.current) {
       orbit3Ref.current.rotation.y = t * 0.08;
       orbit3Ref.current.scale.setScalar(orbitEase);
    }
  });

  return (
    <>
      <OrbitTrackDevOps ref={orbit1Ref} shapes={orbit1Shapes} visible={visibleState.track1} />
      <OrbitTrackGameDev ref={orbit2Ref} shapes={orbit2Shapes} visible={visibleState.track2} />
      <OrbitTrackDataCore ref={orbit3Ref} shapes={orbit3Shapes} visible={visibleState.track3} />

      {/* Constellation Web connecting the orbital rings globally */}
      <ConstellationWeb 
        delay={9.2}
        orbitsInfo={[
          { ref: orbit1Ref, shapes: orbit1Shapes },
          { ref: orbit2Ref, shapes: orbit2Shapes },
          { ref: orbit3Ref, shapes: orbit3Shapes }
      ]} />
    </>
  );
};
