import { forwardRef } from 'react';
import * as THREE from 'three';

export const ImplosionHorizon = forwardRef<THREE.Mesh>((props, ref) => (
  <mesh ref={ref} scale={0} {...props}>
    <icosahedronGeometry args={[0.6, 0]} />
    <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
  </mesh>
));

export const ImplosionVoid = forwardRef<THREE.Mesh>((props, ref) => (
  <mesh ref={ref} scale={0} {...props}>
    <icosahedronGeometry args={[0.58, 0]} />
    <meshBasicMaterial color="#000000" />
  </mesh>
));
