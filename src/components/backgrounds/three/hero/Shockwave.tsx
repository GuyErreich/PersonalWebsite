import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Shockwave = () => {
  const explosionRef = useRef<THREE.Mesh>(null);

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
