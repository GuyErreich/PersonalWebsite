/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

// Preallocated — never constructed inside useFrame
const _white = new THREE.Color("#ffffff");
const _yellow = new THREE.Color("#fbbf24");
const _orange = new THREE.Color("#ea580c");

export const Shockwave = () => {
  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("shockwave");
  const explosionRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (explosionRef.current) {
      if (proxy.progress === 0 && proxy.activeT === 0) {
        explosionRef.current.visible = false;
        explosionRef.current.scale.setScalar(0);
      } else if (proxy.progress < 1.0) {
        explosionRef.current.visible = true;

        // proxy.progress smoothly guides us from 0 to 1 over the duration given in the orchestrator
        const progress = proxy.progress;
        const easeOut = 1 - (1 - progress) ** 3;
        const scale = easeOut * 25;

        explosionRef.current.scale.setScalar(scale);

        // Color transition: White -> Bright Yellow -> Deep Orange
        const mat = explosionRef.current.material as THREE.MeshBasicMaterial;

        if (progress < 0.2) {
          mat.color.lerpColors(_white, _yellow, progress / 0.2);
        } else {
          mat.color.lerpColors(_yellow, _orange, (progress - 0.2) / 0.8);
        }

        // Fade from 1 down to 0
        mat.opacity = 1 - easeOut;
      } else {
        explosionRef.current.visible = false; // Turn off entirely after explosion finishes
      }
    }
  });

  return (
    <mesh ref={explosionRef} visible={false}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color="#f59e0b"
        transparent
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide} /* Allows us to be inside the explosion sphere */
      />
    </mesh>
  );
};
