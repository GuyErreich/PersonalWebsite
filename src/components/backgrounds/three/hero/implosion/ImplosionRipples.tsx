import * as THREE from 'three';

export const ImplosionRipples = ({ ripples }: { ripples: any[] }) => (
  <>
    {ripples.map((ripple, i) => (
      <mesh key={`ripple-${i}`} ref={ripple.ref} scale={0}>
        <ringGeometry args={[0.9, 0.905, 64]} />
        <meshBasicMaterial 
          transparent 
          opacity={0} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    ))}
  </>
);
