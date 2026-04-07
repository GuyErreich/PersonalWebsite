/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Float } from "@react-three/drei";
import { forwardRef } from "react";
import * as THREE from "three";

interface OrbitShape {
  x: number;
  z: number;
  angle: number;
}

export const OrbitTrackGameDev = forwardRef<
  THREE.Group,
  { shapes: OrbitShape[]; visible: boolean }
>(({ shapes, visible }, ref) => {
  return (
    <group ref={ref} visible={visible}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.98, 7.02, 64]} />
        <meshBasicMaterial color="#34d399" transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {shapes.map((pos, i) => (
        <Float key={`cone-${i}`} speed={2} rotationIntensity={4} floatIntensity={2}>
          {/* Tilting the cones so they face forward dynamically */}
          <mesh position={[pos.x, 0, pos.z]} rotation={[pos.angle, 0.5, 0.5]}>
            <coneGeometry args={[0.3, 0.8, 4]} />
            <meshStandardMaterial
              color="#34d399"
              emissive="#10b981"
              emissiveIntensity={1.8}
              metalness={0.8}
              roughness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
});
