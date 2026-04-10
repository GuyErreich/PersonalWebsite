/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

export const IcosahedronSun = () => {
  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("sun");
  const sunRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (sunRef.current) {
      if (proxy.progress === 0 && proxy.activeT === 0) {
        sunRef.current.visible = false;
        return;
      } else {
        sunRef.current.visible = true;
      }

      // Bursts from scale 0 to 1 scaling perfectly to proxy progress
      const formationEase = 1 - (1 - proxy.progress) ** 4;

      // Infinite idle spin and breathing pulse
      const t = proxy.activeT > 0 ? clock.elapsedTime : 0;
      const pulse = 1 + Math.sin(t * 2) * 0.05;

      sunRef.current.scale.setScalar(formationEase * pulse);

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
