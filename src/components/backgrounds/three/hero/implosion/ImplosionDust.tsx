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

  const { dustPositions, dustSpeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
      positions[i * 3 + 2] = r * Math.sin(theta);
      speeds[i] = 1.0 + Math.random() * 2.0;
    }
    return { dustPositions: positions, dustSpeeds: speeds };
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

    if (proxy.progress === 0 && proxy.activeT === 0) {
      dustRef.current.visible = false;
      return;
    } else {
      dustRef.current.visible = true;
    }

    const progress = proxy.progress;

    const positions = dustRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < dustPositions.length / 3; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);

      if (dist < 0.05) {
        if (progress <= 0.85) {
          const r = 8 + Math.random() * 4;
          const theta = Math.random() * Math.PI * 2;
          positions[i * 3] = r * Math.cos(theta);
          positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
          positions[i * 3 + 2] = r * Math.sin(theta);
        } else {
          // Park to center
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
        }
      } else {
        const condenseFactor =
          progress > 0.7 ? Math.min(2.2, 1.0 + ((progress - 0.7) / 0.3) ** 2.0 * 4.0) : 1.0;

        const speed = dustSpeeds[i] * 4.0 * condenseFactor;
        positions[i * 3] -= (x / dist) * speed * 0.016;
        positions[i * 3 + 1] -= (y / dist) * speed * 0.016;
        positions[i * 3 + 2] -= (z / dist) * speed * 0.016;

        const swarmBoost = progress > 0.7 ? 1.0 + ((progress - 0.7) / 0.3) ** 1.5 * 2.5 : 1.0;
        const spinSpeed = (3.0 / (dist + 0.1)) * swarmBoost;
        const oldX = positions[i * 3];
        const oldZ = positions[i * 3 + 2];
        positions[i * 3] = oldX * Math.cos(spinSpeed * 0.016) - oldZ * Math.sin(spinSpeed * 0.016);
        positions[i * 3 + 2] =
          oldX * Math.sin(spinSpeed * 0.016) + oldZ * Math.cos(spinSpeed * 0.016);
      }
    }
    dustRef.current.geometry.attributes.position.needsUpdate = true;

    // Final strict mathematical bounds replacing old physics leaps and opacity hacks
    const collapseScale = progress > 0.85 ? Math.max(0, 1.0 - (progress - 0.85) / 0.15) : 1.0;
    dustRef.current.scale.set(collapseScale, collapseScale, collapseScale);

    const mat = dustRef.current.material as THREE.ShaderMaterial;

    const absorptionProgress = progress > 0.7 ? Math.min(1.0, (progress - 0.7) / 0.15) : 0.0;

    mat.uniforms.uOpacity.value = Math.min(1.0, progress * 4.0) * 0.7;
    const prePeakGlow =
      progress > 0.65 && progress < 0.75
        ? Math.sin(((progress - 0.65) / 0.1) * Math.PI) * 4.0
        : 0.0;
    mat.uniforms.uIntensity.value = 1.0 + prePeakGlow;
    mat.uniforms.uAbsorption.value = absorptionProgress ** 1.5;

    // Shrink particle core sizes precisely to zero so origin 0,0,0 coordinate blobs disappear structurally
    mat.uniforms.uSize.value = 0.8 * collapseScale;
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
