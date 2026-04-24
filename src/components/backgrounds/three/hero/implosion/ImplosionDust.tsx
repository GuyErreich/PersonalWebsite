/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

export const ImplosionDust = ({ count = 600 }: { count?: number }) => {
  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("dust");
  const dustRef = useRef<THREE.Points>(null);
  const respawnCursorRef = useRef(0);
  const lastVisibleRef = useRef(false);
  const lastScaleRef = useRef(-1);
  const lastOpacityRef = useRef(-1);
  const lastIntensityRef = useRef(-1);
  const lastAbsorptionRef = useRef(-1);
  const lastSizeRef = useRef(-1);

  const { dustPositions, dustSpeeds, respawnX, respawnY, respawnZ } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    const nextRespawnX = new Float32Array(count);
    const nextRespawnY = new Float32Array(count);
    const nextRespawnZ = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = r * Math.sin(theta);
      speeds[i] = 1.0 + Math.random() * 2.0;

      const respawnRadius = 8 + Math.random() * 4;
      const respawnTheta = Math.random() * Math.PI * 2;
      nextRespawnX[i] = respawnRadius * Math.cos(respawnTheta);
      nextRespawnY[i] = (Math.random() - 0.5) * 0.8;
      nextRespawnZ[i] = respawnRadius * Math.sin(respawnTheta);
    }

    return {
      dustPositions: positions,
      dustSpeeds: speeds,
      respawnX: nextRespawnX,
      respawnY: nextRespawnY,
      respawnZ: nextRespawnZ,
    };
  }, [count]);

  const dustUniforms = useMemo(
    () => ({
      uOpacity: { value: 0.0 },
      uIntensity: { value: 1.0 },
      uSize: { value: 3.0 },
      uAbsorption: { value: 0.0 },
    }),
    [],
  );

  const dustVertexShader = `
        uniform float uSize;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = uSize * (300.0 / -mvPosition.z);
        }
    `;

  const dustFragmentShader = `
        uniform float uOpacity;
        uniform float uIntensity;
        uniform float uAbsorption;

        void main() {
            float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
            if (d > 1.0) discard;

            float core = 1.0 - smoothstep(0.0, 0.25, d);
            float glow = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);

            vec3 coreColor  = vec3(0.98, 0.88, 1.0);
            vec3 outerColor = vec3(0.55, 0.1,  0.75);
            vec3 plasmaColor = mix(outerColor, coreColor, core) * uIntensity;

            vec3 voidColor = vec3(0.0, 0.0, 0.02) * (1.0 - core * 0.5);
            vec3 color = mix(plasmaColor, voidColor, uAbsorption);

            float alpha = (core * 0.95 + glow * 0.5) * uOpacity;
            gl_FragColor = vec4(color, alpha);
        }
    `;

  useFrame(() => {
    if (!dustRef.current) return;

    const shouldBeVisible = !(proxy.progress === 0 && proxy.activeT === 0);

    if (lastVisibleRef.current !== shouldBeVisible) {
      dustRef.current.visible = shouldBeVisible;
      lastVisibleRef.current = shouldBeVisible;
    }

    if (!shouldBeVisible) {
      return;
    }

    const progress = proxy.progress;
    const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
    const positionCount = dustPositions.length / 3;
    const deltaTime = 0.016;
    const condenseFactor =
      progress > 0.7 ? Math.min(2.2, 1.0 + ((progress - 0.7) / 0.3) ** 2.0 * 4.0) : 1.0;
    const swarmBoost = progress > 0.7 ? 1.0 + ((progress - 0.7) / 0.3) ** 1.5 * 2.5 : 1.0;
    const respawnAllowed = progress <= 0.85;

    for (let i = 0; i < positionCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const distSq = x * x + y * y + z * z;

      if (distSq < 0.0025) {
        if (respawnAllowed) {
          const respawnIndex = respawnCursorRef.current % count;
          positions[i * 3] = respawnX[respawnIndex];
          positions[i * 3 + 1] = respawnY[respawnIndex];
          positions[i * 3 + 2] = respawnZ[respawnIndex];
          respawnCursorRef.current++;
        } else {
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
      } else {
        const dist = Math.sqrt(distSq);
        const speed = dustSpeeds[i] * 4.0 * condenseFactor;
        const inverseDist = 1 / dist;
        positions[i * 3] -= x * inverseDist * speed * deltaTime;
        positions[i * 3 + 1] -= y * inverseDist * speed * deltaTime;
        positions[i * 3 + 2] -= z * inverseDist * speed * deltaTime;

        const spinSpeed = (3.0 / (dist + 0.1)) * swarmBoost;
        const spinAngle = spinSpeed * deltaTime;
        const cosSpin = Math.cos(spinAngle);
        const sinSpin = Math.sin(spinAngle);
        const oldX = positions[i * 3];
        const oldZ = positions[i * 3 + 2];
        positions[i * 3] = oldX * cosSpin - oldZ * sinSpin;
        positions[i * 3 + 2] = oldX * sinSpin + oldZ * cosSpin;
      }
    }
    dustRef.current.geometry.attributes.position.needsUpdate = true;

    const collapseScale = progress > 0.85 ? Math.max(0, 1.0 - (progress - 0.85) / 0.15) : 1.0;
    if (Math.abs(lastScaleRef.current - collapseScale) > 0.0001) {
      dustRef.current.scale.setScalar(collapseScale);
      lastScaleRef.current = collapseScale;
    }

    const mat = dustRef.current.material as THREE.ShaderMaterial;

    const absorptionProgress = progress > 0.7 ? Math.min(1.0, (progress - 0.7) / 0.15) : 0.0;
    const nextOpacity = Math.min(1.0, progress * 4.0) * 0.7;

    const prePeakGlow =
      progress > 0.65 && progress < 0.75
        ? Math.sin(((progress - 0.65) / 0.1) * Math.PI) * 4.0
        : 0.0;
    const nextIntensity = 1.0 + prePeakGlow;
    const nextAbsorption = absorptionProgress ** 1.5;
    const nextSize = 0.8 * collapseScale;

    if (Math.abs(lastOpacityRef.current - nextOpacity) > 0.0001) {
      mat.uniforms.uOpacity.value = nextOpacity;
      lastOpacityRef.current = nextOpacity;
    }

    if (Math.abs(lastIntensityRef.current - nextIntensity) > 0.0001) {
      mat.uniforms.uIntensity.value = nextIntensity;
      lastIntensityRef.current = nextIntensity;
    }

    if (Math.abs(lastAbsorptionRef.current - nextAbsorption) > 0.0001) {
      mat.uniforms.uAbsorption.value = nextAbsorption;
      lastAbsorptionRef.current = nextAbsorption;
    }

    if (Math.abs(lastSizeRef.current - nextSize) > 0.0001) {
      mat.uniforms.uSize.value = nextSize;
      lastSizeRef.current = nextSize;
    }
  });

  return (
    <points ref={dustRef} rotation={[0.5, 0.2, -0.3]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[dustPositions, 3]}
          count={dustPositions.length / 3}
          array={dustPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        uniforms={dustUniforms}
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
