/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export const NetworkFlare = ({ offsetTime = 0 }: { offsetTime: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cycleRef = useRef(-1);

  // Shared materials for High Performance
  const nodeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f59e0b", // Rich amber
        emissive: "#d97706", // Darker amber glow
        emissiveIntensity: 3.0, // High intensity for a "hot" look
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#f87171", // slightly reddish/orange to contrast the core
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // Pre-calculate a looping "arch" structure (Prominence) of a network path with controlled splatter
  const { nodes, lineGeo } = useMemo(() => {
    const n: THREE.Vector3[] = [];
    const lPoints: THREE.Vector3[] = [];

    // Tighter, lower arc
    const pointsInArc = 9;
    const arcRadius = 1.3;

    const validBurstIndices = [3, 4, 5, 6];
    validBurstIndices.sort(() => Math.random() - 0.5);
    const burstLocations = validBurstIndices.slice(0, 2);

    for (let i = 0; i <= pointsInArc; i++) {
      const angle = (i / pointsInArc) * Math.PI;

      let x = Math.cos(angle) * 1.0;
      let y = Math.sin(angle) * 1.0;

      if (i !== 0 && i !== pointsInArc) {
        x += (Math.random() - 0.5) * 0.15;
        y += (Math.random() - 0.5) * 0.15;
      }

      const point = new THREE.Vector3(x, y + arcRadius, 0);
      n.push(point);

      if (i > 0) {
        lPoints.push(n[i - 1], point);
      }

      if (burstLocations.includes(i)) {
        const numSplatter = Math.random() > 0.6 ? 1 : 2;

        const xDir = (Math.random() - 0.5) * 0.5;
        const yDir = 0.3 + Math.random() * 0.4;
        const zDir = (Math.random() - 0.5) * 0.5;

        let prevSplatterNode = point;

        for (let s = 0; s < numSplatter; s++) {
          const splatterNode = new THREE.Vector3(
            prevSplatterNode.x + xDir,
            prevSplatterNode.y + yDir,
            prevSplatterNode.z + zDir,
          );

          n.push(splatterNode);
          lPoints.push(prevSplatterNode, splatterNode);
          prevSplatterNode = splatterNode;
        }
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(lPoints);
    return { nodes: n, lineGeo: geometry };
  }, []);

  useFrame(({ clock }) => {
    const cycleLength = 8;
    const totalT = clock.elapsedTime + offsetTime;
    const t = totalT % cycleLength;
    const currentCycle = Math.floor(totalT / cycleLength);

    if (groupRef.current) {
      if (currentCycle !== cycleRef.current) {
        cycleRef.current = currentCycle;
        groupRef.current.rotation.set(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        );
      }

      let scaleY = 0;
      let alpha = 0;

      if (t < 0.3) {
        const progress = t / 0.3;
        const easeOutBack = 1 + 1.2 * (progress - 1) ** 3 + 0.2 * (progress - 1) ** 2;
        scaleY = easeOutBack;
        alpha = progress;
      } else if (t < 2.5) {
        const progress = (t - 0.3) / 2.2;
        scaleY = 1.0 + Math.sin(progress * Math.PI) * 0.05;
        alpha = 1.0 - progress * 0.5;
      } else if (t < 3.0) {
        const progress = (t - 2.5) / 0.5;
        scaleY = 1.0 - progress ** 3;
        alpha = 0.5 * (1.0 - progress);
      }

      const baseScale = 0.9;
      groupRef.current.scale.set(baseScale, scaleY * baseScale, baseScale);
      groupRef.current.position.y = -0.3 + scaleY * 0.3;

      nodeMat.opacity = alpha;
      lineMat.opacity = alpha * 0.8;
    }
  });

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeo} material={lineMat} />
      {nodes.map((pos, i) => {
        let size = 0.025;
        if (i === 0 || i === 9) size = 0.015;

        return (
          <mesh key={`node-${i}`} position={pos} material={nodeMat}>
            <sphereGeometry args={[size, 8, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
