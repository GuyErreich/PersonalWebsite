/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useContext, useRef } from "react";
import type * as THREE from "three";
import { AnimationContext } from "../../../../../lib/AnimationContext";

export const ScreenFlash = () => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const orchestrator = useContext(AnimationContext);

  useFrame(() => {
    if (!orchestrator || !materialRef.current) return;

    let opacity = 0;
    let hex = "#ffffff";

    const flashImplosion = orchestrator.getProxy("flash-implosion"); // 4.6 to 5.4
    const flashHole = orchestrator.getProxy("flash-hole"); // 7.3 to 7.8
    const flashSilence = orchestrator.getProxy("flash-silence"); // 7.8 to 8.6
    const flashBang = orchestrator.getProxy("flash-bang"); // 8.6 to 10.0
    const flashJump = orchestrator.getProxy("flash-jump"); // 15.45 to 15.9

    // Flash 1: Taglines dying, Implosion starts
    if (flashImplosion.progress > 0 && flashHole.progress === 0) {
      if (flashImplosion.progress < 0.25) {
        // 0.2s ramp up
        opacity = (flashImplosion.progress / 0.25) * 0.4;
      } else {
        // 0.6s fade out
        opacity = (1.0 - (flashImplosion.progress - 0.25) / 0.75) * 0.4;
      }
      hex = "#4c1d95"; // Deep purple
    }
    // Flash 2: Light Absorption into Singularity
    else if (flashHole.progress > 0 && flashSilence.progress === 0) {
      // 7.3 to 7.6 is absorption (0 to 0.6 progress), 7.6 to 7.8 is singularity blowout (0.6 to 1.0 progress)
      if (flashHole.progress < 0.6) {
        opacity = (flashHole.progress / 0.6) ** 1.5 * 0.72;
        hex = "#000000";
      } else {
        const p = (flashHole.progress - 0.6) / 0.4;
        opacity = 0.72 + p * (0.9 - 0.72); // cross-fade from dark to blinding
        hex = "#e0f2fe";
      }
    }
    // The Eerie Silence Gap
    else if (flashSilence.progress > 0 && flashBang.progress === 0) {
      opacity = 1.0 - flashSilence.progress ** 2;
      hex = "#000000";
    }
    // Flash 3: The Big Bang
    // Removed the visual white flash for the bang so the galaxy particle creation is visible purely
    /*
    else if (flashBang.progress > 0 && flashBang.progress < 1) {
      if (flashBang.progress < 0.05) {
        opacity = flashBang.progress / 0.05; 
      } else {
        opacity = Math.pow(1 - ((flashBang.progress - 0.05) / 0.95), 3); 
      }
      hex = '#ffffff';
    }
    */
    // Flash 4: Hyperspace Exit Flash
    else if (flashJump.progress > 0 && flashJump.progress < 1) {
      if (flashJump.progress < 0.1) {
        opacity = (flashJump.progress / 0.1) * 0.8;
      } else {
        opacity = (1 - (flashJump.progress - 0.1) / 0.9) ** 2 * 0.8;
      }
      hex = "#e0ecff"; // slight blue-ish white
    }

    materialRef.current.opacity = opacity;
    materialRef.current.color.set(hex);
  });

  return (
    <mesh position={[0, 0, 4.8]}>
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial
        ref={materialRef}
        transparent={true}
        opacity={0}
        color="#ffffff"
        depthWrite={false}
      />
    </mesh>
  );
};
