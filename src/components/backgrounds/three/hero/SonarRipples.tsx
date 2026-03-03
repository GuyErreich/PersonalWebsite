import React, { useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConstellationWeb } from './ConstellationWeb';

const makePoints = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: Math.cos(angle) * 1,
      z: Math.sin(angle) * 1,
    };
  });
};

export const SonarRipples = () => {
  // Define orbits info for ConstellationWeb just like OrbitingShapes had,
  // but now the shapes are invisible points scattered around the expanding ripple
  const orbitsInfo = useMemo(() => {
    return [0, 1, 2, 3].map(() => ({
      ref: React.createRef<THREE.Group>(),
      shapes: makePoints(12), // 12 points per ripple
      opacity: 1
    }));
  }, []);

  // Use state to trigger unmount, avoiding useRef non-reactivity
  const [isDone, setIsDone] = useState(false);
  
  // Track an explicit global fade for the pulse web
  const webOpacityRef = React.useRef(1);

  useFrame(({ clock }) => {
    if (isDone) return;

    // Delay the explosion shockwaves until after the silent gap finishes
    const t = clock.elapsedTime - 8.6;
    
    // Start immediately with the initial shockwave (once we cross the t=0 threshold)
    const rippleStartT = t; 

    let allDone = true;

    orbitsInfo.forEach((orbit, i) => {
      const group = orbit.ref.current;
      if (!group) return;
      
      // Each ring spawns from 0, staggered very quickly (0.15s) during the explosion
      const ringLifeT = rippleStartT - (i * 0.15);
      
      // Check if it hasn't started yet
      if (ringLifeT < 0) {
        group.visible = false;
        orbit.opacity = 0;
        return;
      }

      group.visible = true;

      // When the ring finishes exactly at its max lifetime, we must NOT set visible=false 
      // because other rings are still fading and need a smooth web connection to these points
      if (ringLifeT >= 6) {
        orbit.opacity = 0;
        const mesh = group.children[0] as THREE.Mesh;
        if (mesh && mesh.material) {
           (mesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
        return;
      }

      allDone = false; // It's still actively animating
      const localT = ringLifeT;
      
      // Expands outward rapidly to match the shockwave ease
      const progress = Math.min(1, localT / 6);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const scale = easeOut * 40; // Reaches scale 40 to carry way off screen

      // Fade out begins much earlier (mid-way or even before) so it has plenty of time to hit 0 softly
      // Start fading immediately, but very gradually
      // Or, we can start fading at progress 0.2 and be fully 0 by progress 1.0 (end of 6 seconds)
      const fadeProgress = Math.max(0, (progress - 0.2) / 0.8);
      
      // Use an incredibly soft sine curve or strong quadratic curve so it dwindles down beautifully to 0
      const fadeScalar = Math.pow(1 - fadeProgress, 3); // cubic decay means a very looooooooong invisible soft tail
      const opacity = Math.max(0, fadeScalar);
      orbit.opacity = opacity; // Pass opacity to ConstellationWeb 

      group.scale.setScalar(scale);
      
      // Rotate the entire ripple over time so the web twists dynamically
      group.rotation.y = t * 0.15 * (i % 2 === 0 ? 1 : -1); // Alternating spin directions

      // Address the inner mesh to set opacity
      const mesh = group.children[0] as THREE.Mesh;
      if (mesh && mesh.material) {
        (mesh.material as THREE.MeshBasicMaterial).opacity = opacity * 0.5;
      }
    });
    
    // Explicitly update a global fade ref for the web based on the very first starting ring
    // Ring 0 is the most far along, so it dictates the primary tail of the animation!
    // Since ring 0 finishes at 6.0, we just calculate its fade directly:
    const sysProgress = Math.min(1, rippleStartT / 6);
    const globalFadeProgress = Math.max(0, (sysProgress - 0.2) / 0.8);
    webOpacityRef.current = Math.pow(1 - globalFadeProgress, 3);

    if (allDone && !isDone) {
      setIsDone(true);
    }
  });

  const rippleColors = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

  if (isDone) {
    return null; // Return null to completely destroy the meshes and WebGL memory lines when finished
  }

  return (
    <>
      <group>
        {orbitsInfo.map((orbit, i) => (
          <group key={i} ref={orbit.ref}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.98, 1, 64]} />
              <meshBasicMaterial 
                color={rippleColors[i]} 
                transparent 
                opacity={0} 
                depthWrite={false} 
                blending={THREE.AdditiveBlending} 
                side={THREE.DoubleSide} 
              />
            </mesh>
          </group>
        ))}
      </group>
      <ConstellationWeb delay={8.6} orbitsInfo={orbitsInfo} globalOpacityRef={webOpacityRef} connectionThreshold={100} />
    </>
  );
};
