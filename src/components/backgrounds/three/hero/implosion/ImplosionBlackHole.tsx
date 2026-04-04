import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getImplosionState } from './shared';

export const ImplosionBlackHole = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const { progress } = getImplosionState(t);
    
    if (meshRef.current) {
      if (progress > 0.45 && progress <= 0.88) {
        meshRef.current.visible = true;
        meshRef.current.scale.setScalar(0.1 + (progress - 0.45) * 5.0);
      } else {
        meshRef.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
};
