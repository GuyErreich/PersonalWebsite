import { forwardRef } from 'react';
import * as THREE from 'three';

interface ImplosionRingProps {
  color: THREE.Color | string;
}

export const ImplosionRing = forwardRef<THREE.Mesh, ImplosionRingProps>(({ color, ...props }, ref) => (
  <mesh ref={ref} scale={0} {...props}>
    <torusGeometry args={[0.8, 0.008, 4, 16]} />
    <meshBasicMaterial 
      color={color} 
      transparent 
      opacity={0} 
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </mesh>
));
