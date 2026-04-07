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
const _scratchColor = new THREE.Color();
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

    const allPoints: {
      x: number;
      y: number;
      z: number;
      color: THREE.Color;
      opacity: number;
    }[] = [];

    if (!orbitsInfo.every((o) => o.ref.current)) return;

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
        allPoints.push({
          x: _scratchVec.x,
          y: _scratchVec.y,
          z: _scratchVec.z,
          color: trackColor,
          opacity: orbit.opacity !== undefined ? orbit.opacity : 1,
        });
      });
    });

    let lineIdx = 0;
    const globalFade = globalOpacityRef?.current !== undefined ? globalOpacityRef.current : 1.0;

    for (let i = 0; i < allPoints.length; i++) {
      for (let j = i + 1; j < allPoints.length; j++) {
        if (lineIdx >= MAX_CONNECTIONS) break;

        const p1 = allPoints[i];
        const p2 = allPoints[j];

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < pulsingThreshold) {
          // Smoother, slightly more gracious alpha falloff to allow the dense web to look atmospheric
          const alphaRatio = 1.0 - dist / pulsingThreshold;
          const alpha = alphaRatio ** 1.2; // Less harsh dropoff so far lines still show

          positions[lineIdx * 6] = p1.x;
          positions[lineIdx * 6 + 1] = p1.y;
          positions[lineIdx * 6 + 2] = p1.z;
          positions[lineIdx * 6 + 3] = p2.x;
          positions[lineIdx * 6 + 4] = p2.y;
          positions[lineIdx * 6 + 5] = p2.z;

          // Color lines by dynamically blending the color of shape A and shape B based on distance
          const mixedOpacity = Math.min(p1.opacity, p2.opacity);
          const brightness = alpha * 0.8 * mixedOpacity * globalFade; // Boost the brightness so colors show, scaling by point opacity and global fade

          // Blend the color of node i with node j — reuse scratch to avoid clone()
          _scratchColor.copy(p1.color).lerp(p2.color, 0.5);

          const r = _scratchColor.r * brightness;
          const g = _scratchColor.g * brightness;
          const b = _scratchColor.b * brightness;

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
