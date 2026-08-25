/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import type * as THREE from "three";
import { ReverseHyperspace } from "./backgrounds/three/hero/ReverseHyperspace";
import { ThreeHeroBackground } from "./backgrounds/three/ThreeHeroBackground";

const ResponsiveCamera = () => {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;

    (camera as THREE.PerspectiveCamera).fov = 50;

    let targetZ = 5;

    if (aspect < 1) {
      targetZ = Math.max(5, 4.72 / aspect);
    }

    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [size, camera]);

  return null;
};

export interface HeroWebGlBackgroundProps {
  mode: "cinematic" | "rewind";
  skipIntro: boolean;
  canvasDPR: number | [number, number];
  eventSource: HTMLElement;
}

/**
 * R3F hero canvas stack — dynamically imported from Hero so Three.js stays off the critical path.
 * AnimatePresence wrappers stay in Hero so exit/`mode="wait"` keys remain direct children.
 */
export const HeroWebGlBackground = ({
  mode,
  skipIntro,
  canvasDPR,
  eventSource,
}: HeroWebGlBackgroundProps) => {
  if (mode === "rewind") {
    return (
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} dpr={canvasDPR} eventSource={eventSource}>
        <ResponsiveCamera />
        <ReverseHyperspace />
      </Canvas>
    );
  }

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={canvasDPR} eventSource={eventSource}>
      <ResponsiveCamera />
      <ThreeHeroBackground skipIntro={skipIntro} />
    </Canvas>
  );
};
