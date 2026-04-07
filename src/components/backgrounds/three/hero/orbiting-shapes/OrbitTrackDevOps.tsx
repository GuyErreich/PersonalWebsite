import { Float } from "@react-three/drei";
import { forwardRef } from "react";
import * as THREE from "three";

interface OrbitShape {
  x: number;
  z: number;
}

export const OrbitTrackDevOps = forwardRef<THREE.Group, { shapes: OrbitShape[]; visible: boolean }>(
  ({ shapes, visible }, ref) => {
    return (
      <group ref={ref} visible={visible}>
        {/* Physical orbit line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.98, 4.02, 64]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
        {shapes.map((pos, i) => (
          <Float key={`cube-${i}`} speed={4} rotationIntensity={4} floatIntensity={1}>
            <mesh position={[pos.x, 0, pos.z]}>
              {/* Dual-layered boxes looking highly technical */}
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial
                color="#60a5fa"
                emissive="#3b82f6"
                emissiveIntensity={1.5}
                wireframe
                transparent
                opacity={0.95}
              />
              <mesh>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={2.0} />
              </mesh>
            </mesh>
          </Float>
        ))}
      </group>
    );
  },
);
