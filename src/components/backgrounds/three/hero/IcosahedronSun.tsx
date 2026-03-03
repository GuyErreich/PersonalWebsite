import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const IcosahedronSun = () => {
  const sunRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    // Delay creation until after implosion + pure silence gap (8.6s total)
    const t = Math.max(0, clock.elapsedTime - 9.2);
    
    // The Icosahedron Sun Formation
    if (sunRef.current) {
      if (t === 0) {
        sunRef.current.visible = false;
        return;
      } else {
        sunRef.current.visible = true;
      }

      // Bursts from scale 0 to 1 over the first 2 seconds
      const formationProgress = Math.min(1, t / 2.0);
      const formationEase = 1 - Math.pow(1 - formationProgress, 4); // Quartic ease out for a nice pop

      // Add a subtle "breathing/resonating" pulse over time
      const pulse = 1 + Math.sin(t * 2) * 0.05;
      
      // When t=0, formationEase=0, so it starts exactly at 0!
      sunRef.current.scale.setScalar(formationEase * pulse);
      
      // Idle spin
      sunRef.current.rotation.y = t * 0.2;
      sunRef.current.rotation.x = t * 0.1;
    }
  });

  return (
    <mesh ref={sunRef} visible={false}>
      {/* Increased detail flag from 0 to 1 for more polygons to make it slightly rounder */}
      <icosahedronGeometry args={[1.5, 1]} />
      {/* Wireframe outer geometric sun */}
      <meshStandardMaterial 
        color="#fde047" 
        emissive="#fbbf24" 
        emissiveIntensity={2.5} 
        wireframe 
        opacity={1.0} 
        transparent 
      />
      {/* Solid inner magma core */}
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial 
          color="#f59e0b" 
          emissive="#d97706" 
          emissiveIntensity={2.0} 
          roughness={0.2} 
        />
      </mesh>
    </mesh>
  );
};
