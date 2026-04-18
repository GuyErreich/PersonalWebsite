/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Float, Wireframe } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const ThreeDevOpsGraphics = () => {
  const group = useRef<THREE.Group>(null);

  // Rotate the entire constellation slowly
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.1;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Non-indexed BoxGeometry so <Wireframe> doesn't need to convert it at runtime
  const boxGeo = useMemo(() => {
    const indexed = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const nonIndexed = indexed.toNonIndexed();
    indexed.dispose();
    return nonIndexed;
  }, []);

  // Create a memoized network pattern
  const lines = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const numPoints = 20;
    for (let i = 0; i < numPoints; i++) {
      points.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 5,
        ),
      );
    }
    return points;
  }, []);

  return (
    <group ref={group}>
      {/* Central Core (representing a cluster/server) */}
      <Float speed={2} rotationIntensity={1} floatIntensity={2}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[1.5, 0]} />
          <meshStandardMaterial color="#3b82f6" wireframe />
          {/* Inner solid core */}
          <mesh>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={0.5} />
          </mesh>
        </mesh>
      </Float>

      {/* Orbiting Satellites (representing containers/nodes) */}
      {[...Array(5)].map((_, i) => (
        <Float key={i} speed={3 + i} rotationIntensity={2} floatIntensity={3}>
          <mesh
            position={[
              Math.cos((i / 5) * Math.PI * 2) * 4,
              Math.sin(i) * 2,
              Math.sin((i / 5) * Math.PI * 2) * 4,
            ]}
          >
            <primitive object={boxGeo} attach="geometry" />
            <meshStandardMaterial color="#10b981" />
            <Wireframe thickness={0.05} stroke={"#34d399"} />
          </mesh>
        </Float>
      ))}

      {/* Background network dots */}
      {lines.map((pos, i) => (
        <mesh key={`dot-${i}`} position={pos}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#6366f1" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
};
