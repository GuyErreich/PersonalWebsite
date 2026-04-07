import { Float } from "@react-three/drei";
import { forwardRef } from "react";
import * as THREE from "three";

interface OrbitShape {
  x: number;
  z: number;
}

export const OrbitTrackDataCore = forwardRef<
  THREE.Group,
  { shapes: OrbitShape[]; visible: boolean }
>(({ shapes, visible }, ref) => {
  return (
    <group ref={ref} visible={visible}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.98, 10.02, 64]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {shapes.map((pos, i) => (
        <Float key={`sphere-${i}`} speed={3} rotationIntensity={1} floatIntensity={3}>
          <mesh position={[pos.x, 0, pos.z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color="#a78bfa"
              emissive="#8b5cf6"
              emissiveIntensity={2.0}
              transparent
              opacity={0.95}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
});
