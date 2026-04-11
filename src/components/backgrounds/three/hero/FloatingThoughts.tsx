/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../lib/AnimationContext";
import { useThoughtsSound } from "./useThoughtsSound";

export const FloatingThoughts = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();
  const isMobile = size.width / size.height < 1;
  const fontSize = isMobile ? 0.165 : 0.25;
  const maxWidth = isMobile ? 1.85 : 3.5;
  const orchestrator = useOrchestrator();
  const thoughtsProxy = orchestrator.getProxy("thoughts");
  const suckProxy = orchestrator.getProxy("camera-suck");

  // Removed useRewindSound because it was creating a "doinq" sound right before the implosion
  // useRewindSound(skipIntro, orchestrator);

  const thoughts = useMemo(
    () => [
      "Strong foundations create smooth experiences.",
      "Building the foundation. Shaping the experience.",
      "Turning complexity into smooth experiences.",
      "From cloud platforms to player moments — built to feel right.",
      "I build things that just work — and feel great.",
    ],
    [],
  );

  useThoughtsSound(skipIntro, orchestrator, thoughts.length);

  const textItems = useMemo(() => {
    // Clamp positions to fit within a visible bounding box for all screens
    // These values are chosen to fit within a typical perspective camera view
    const basePositions = [
      { x: -2.2, y: 1.8, z: -2.5 },
      { x: 2.2, y: 1.0, z: -1.5 },
      { x: -2.0, y: 0.0, z: -1.0 },
      { x: 2.2, y: -1.0, z: -1.5 },
      { x: -2.2, y: -1.8, z: -2.5 },
    ];
    const mobilePositions = [
      { x: -0.42, y: 1.55, z: -3.8 },
      { x: 0.42, y: 0.72, z: -3.7 },
      { x: 0.0, y: -0.08, z: -3.6 },
      { x: -0.42, y: -0.88, z: -3.7 },
      { x: 0.42, y: -1.72, z: -3.8 },
    ];
    const positions = isMobile
      ? mobilePositions
      : [...basePositions]
          .map((pos) => ({
            x: pos.x,
            y: pos.y,
            z: pos.z,
          }))
          .sort(() => Math.random() - 0.5);

    return thoughts.map((text, i) => {
      const { x, y, z } = positions[i];
      const colors = ["#60a5fa", "#34d399", "#38bdf8", "#2dd4bf", "#4ade80"];
      return {
        text,
        x,
        y,
        z,
        color: colors[i % colors.length],
        ref: React.createRef<THREE.Group>(),
        textRef: React.createRef<THREE.Mesh>(),
        delay: i * 0.6,
      };
    });
  }, [thoughts, isMobile]);

  useFrame(() => {
    // Rely exclusively on orchestrator proxy time
    const activeT = thoughtsProxy.activeT;
    const collapseProgress = suckProxy.progress;

    textItems.forEach((item, i) => {
      const group = item.ref.current;
      const textMesh = item.textRef.current;
      if (!group || !textMesh) return;

      if (activeT < item.delay && collapseProgress === 0) {
        group.visible = false;
        return;
      }
      group.visible = true;

      const elementT = Math.max(0, activeT - item.delay);

      const floatAmp = isMobile ? 0.02 : 0.05;
      const floatX = Math.sin(elementT * 1.5 + i) * floatAmp;
      const floatY = Math.cos(elementT * 1.0 + i) * floatAmp;

      let currentX = item.x + floatX;
      let currentY = item.y + floatY;
      let currentZ = item.z;

      let introScale = 1.0;
      if (elementT < 0.8) {
        const x = elementT / 0.8;
        const c1 = 1.70158;
        const c3 = c1 + 1;
        introScale = Math.max(0, 1.0 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2);
      }

      let scale = introScale;
      const targetOpacity = 0.85;
      let opacity = Math.min(targetOpacity, (elementT / 0.8) * targetOpacity);

      // Suck into the black hole driven purely by the camera-suck proxy state!
      if (collapseProgress > 0) {
        const suckEase = collapseProgress ** 3;

        currentX = THREE.MathUtils.lerp(currentX, 0, suckEase);
        currentY = THREE.MathUtils.lerp(currentY, 0, suckEase);
        currentZ = THREE.MathUtils.lerp(currentZ, -5, suckEase); // Add z depth back to match origin

        scale = 1.0 - suckEase;
        opacity *= 1.0 - collapseProgress * 0.5;
      }

      group.position.set(currentX, currentY, currentZ);
      group.scale.setScalar(scale);

      if (textMesh.material) {
        const mat = textMesh.material as THREE.MeshBasicMaterial;
        mat.transparent = true;
        mat.opacity = opacity;
      }
    });

    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(activeT) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {textItems.map((item, i) => (
        <group key={i} ref={item.ref} visible={false}>
          <Text
            ref={item.textRef}
            fontSize={fontSize}
            maxWidth={maxWidth}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color={item.color}
            fontWeight="bold"
            letterSpacing={-0.05}
          >
            {item.text}
          </Text>
        </group>
      ))}
    </group>
  );
};
