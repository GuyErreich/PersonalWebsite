/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

// Module-level constants — never allocated inside the frame loop
const TRACK_COLORS = [
  new THREE.Color("#3b82f6"), // index 0 — Cube Track Blue
  new THREE.Color("#10b981"), // index 1 — Shard Track Emerald
  new THREE.Color("#8b5cf6"), // index 2 — Sphere Track Purple
  new THREE.Color("#ffffff"), // fallback
] as const;
const _scratchVec = new THREE.Vector3();

// Orbital Constellations Web Component (Connects orbiting shapes within and across tracks)
export const ConstellationWeb = ({
  orbitsInfo,
  globalOpacityRef,
  connectionThreshold,
}: {
  orbitsInfo: {
    ref: React.RefObject<THREE.Group | null>;
    shapes: { x: number; z: number }[];
    opacity?: number;
  }[];
  globalOpacityRef?: React.RefObject<number>;
  connectionThreshold?: number;
}) => {
  const linesRef = useRef<THREE.LineSegments>(null);

  // High-performance geometry buffer
  const geomRef = useRef(new THREE.BufferGeometry());

  // Cranked max connections way up to allow a wildly dense web
  const MAX_CONNECTIONS = 2000;
  const positions = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);

  const maxPointCount = useMemo(
    () => orbitsInfo.reduce((sum, orbit) => sum + orbit.shapes.length, 0),
    [orbitsInfo],
  );
  const pointPositions = useMemo(() => new Float32Array(maxPointCount * 3), [maxPointCount]);
  const pointColors = useMemo(() => new Float32Array(maxPointCount * 3), [maxPointCount]);
  const pointOpacities = useMemo(() => new Float32Array(maxPointCount), [maxPointCount]);

  // BufferAttributes created once — only needsUpdate toggled in the frame loop
  const posAttr = useMemo(() => new THREE.BufferAttribute(positions, 3), [positions]);
  const colAttr = useMemo(() => new THREE.BufferAttribute(colors, 3), [colors]);

  useEffect(() => {
    geomRef.current.setAttribute("position", posAttr);
    geomRef.current.setAttribute("color", colAttr);
  }, [posAttr, colAttr]);

  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("orbits");

  useFrame(({ clock }) => {
    // If we're before our entry animation, output zero geometry
    if (proxy.progress === 0 && proxy.activeT === 0) {
      geomRef.current.setDrawRange(0, 0);
      return;
    }

    // We don't necessarily need linesRef, we update the geometry directly, but checking for safety

    // Use an animated pulsing threshold so the web organically "breathes"
    // Use activeT so syncs exactly when the proxy starts
    const t = proxy.activeT > 0 ? clock.elapsedTime : 0;

    // Increased base threshold enormously so lines almost ALWAYS cross-connect deep into other tracks
    const baseThreshold = connectionThreshold !== undefined ? connectionThreshold : 6.0;
    // Increased the breathing reach to make it sweep through the whole system
    const pulsingThreshold =
      connectionThreshold !== undefined
        ? connectionThreshold
        : baseThreshold + Math.sin(t * 0.5) * 1.5;

    if (!orbitsInfo.every((o) => o.ref.current)) return;

    let pointCount = 0;

    orbitsInfo.forEach((orbit, index) => {
      const group = orbit.ref.current;
      if (!group?.visible) return;

      // Reuse preallocated module-level color constant for this track
      const trackColor = TRACK_COLORS[index] ?? TRACK_COLORS[TRACK_COLORS.length - 1];

      orbit.shapes.forEach((pos: { x: number; z: number }) => {
        // Reuse scratch vec — store result as plain numbers to avoid per-shape Vector3
        _scratchVec.set(pos.x, 0, pos.z);
        _scratchVec.applyEuler(group.rotation);
        _scratchVec.multiplyScalar(group.scale.x);

        const p3 = pointCount * 3;
        pointPositions[p3] = _scratchVec.x;
        pointPositions[p3 + 1] = _scratchVec.y;
        pointPositions[p3 + 2] = _scratchVec.z;

        pointColors[p3] = trackColor.r;
        pointColors[p3 + 1] = trackColor.g;
        pointColors[p3 + 2] = trackColor.b;

        pointOpacities[pointCount] = orbit.opacity !== undefined ? orbit.opacity : 1;
        pointCount++;
      });
    });

    let lineIdx = 0;
    const globalFade = globalOpacityRef?.current !== undefined ? globalOpacityRef.current : 1.0;
    const thresholdSq = pulsingThreshold * pulsingThreshold;

    for (let i = 0; i < pointCount; i++) {
      for (let j = i + 1; j < pointCount; j++) {
        if (lineIdx >= MAX_CONNECTIONS) break;

        const i3 = i * 3;
        const j3 = j * 3;

        const dx = pointPositions[i3] - pointPositions[j3];
        const dy = pointPositions[i3 + 1] - pointPositions[j3 + 1];
        const dz = pointPositions[i3 + 2] - pointPositions[j3 + 2];
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < thresholdSq) {
          const dist = Math.sqrt(distSq);
          // Smoother, slightly more gracious alpha falloff to allow the dense web to look atmospheric
          const alphaRatio = 1.0 - dist / pulsingThreshold;
          const alpha = alphaRatio ** 1.2; // Less harsh dropoff so far lines still show

          positions[lineIdx * 6] = pointPositions[i3];
          positions[lineIdx * 6 + 1] = pointPositions[i3 + 1];
          positions[lineIdx * 6 + 2] = pointPositions[i3 + 2];
          positions[lineIdx * 6 + 3] = pointPositions[j3];
          positions[lineIdx * 6 + 4] = pointPositions[j3 + 1];
          positions[lineIdx * 6 + 5] = pointPositions[j3 + 2];

          // Color lines by dynamically blending the color of shape A and shape B based on distance
          const mixedOpacity = Math.min(pointOpacities[i], pointOpacities[j]);
          const brightness = alpha * 0.8 * mixedOpacity * globalFade; // Boost the brightness so colors show, scaling by point opacity and global fade

          const r = (pointColors[i3] + pointColors[j3]) * 0.5 * brightness;
          const g = (pointColors[i3 + 1] + pointColors[j3 + 1]) * 0.5 * brightness;
          const b = (pointColors[i3 + 2] + pointColors[j3 + 2]) * 0.5 * brightness;

          colors[lineIdx * 6] = r;
          colors[lineIdx * 6 + 1] = g;
          colors[lineIdx * 6 + 2] = b;
          colors[lineIdx * 6 + 3] = r;
          colors[lineIdx * 6 + 4] = g;
          colors[lineIdx * 6 + 5] = b;

          lineIdx++;
        }
      }
    }

    geomRef.current.setDrawRange(0, lineIdx * 2);
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef} geometry={geomRef.current}>
      <lineBasicMaterial
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
};
