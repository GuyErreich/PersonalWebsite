import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

export const ImplosionWormholes = ({ count = 400 }: { count?: number }) => {
  const orchestrator = useOrchestrator();
  // The "blueDust" proxy has a global duration, e.g. 0.8s * full sequence timescale
  const proxy = orchestrator.getProxy("blueDust");

  // An individual wormhole effect takes exactly 10% of total progress to complete its cycle.
  const WORMHOLE_EFFECT_DURATION = 0.1;

  const blueDustRef = useRef<THREE.Points>(null);
  const wormholeRef = useRef<THREE.LineSegments>(null);

  const { initialPositions, startProgresses, colors } = useMemo(() => {
    const _positions = new Float32Array(count * 3);
    const _startP = new Float32Array(count);
    const _colors = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      _positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      _positions[i * 3 + 1] = r * Math.cos(phi);
      _positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Give each particle a steady, completely even linear distribution
      // across the timeline, leaving exactly enough room for the final particles to finish
      const maxStartP = 1.0 - WORMHOLE_EFFECT_DURATION;
      _startP[i] = Math.random() * maxStartP;

      _colors[i] = Math.random() < 0.55 ? 0 : 1;
    }
    return {
      initialPositions: _positions,
      startProgresses: _startP,
      colors: _colors,
    };
  }, [count]);

  // We keep live arrays here to upload per-frame
  const { blueDustPositions, wormholePositions, wormholeAlphas, wormholeColors } = useMemo(() => {
    return {
      blueDustPositions: new Float32Array(count * 3),
      wormholePositions: new Float32Array(count * 6),
      wormholeAlphas: new Float32Array(count * 2),
      wormholeColors: new Float32Array(count * 6),
    };
  }, [count]);

  // Need to trigger needsUpdate on geometry whenever buffers completely swap due to a count change
  useEffect(() => {
    if (blueDustRef.current && wormholeRef.current) {
      blueDustRef.current.geometry.attributes.position.needsUpdate = true;
      wormholeRef.current.geometry.attributes.position.needsUpdate = true;
      wormholeRef.current.geometry.attributes.aAlpha.needsUpdate = true;
      wormholeRef.current.geometry.attributes.aColor.needsUpdate = true;
    }
  }, [count]);

  const blueDustUniforms = useMemo(() => ({ uOpacity: { value: 0.0 }, uSize: { value: 1.8 } }), []);

  const blueDustFragmentShader = `
        uniform float uOpacity;
        void main() {
            float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
            if (d > 1.0) discard;
            float core = 1.0 - smoothstep(0.0, 0.3, d);
            float glow = pow(1.0 - smoothstep(0.0, 1.0, d), 2.0);
            vec3 color = mix(vec3(0.05, 0.3, 0.9), vec3(0.7, 0.9, 1.0), core);
            gl_FragColor = vec4(color, (core * 0.9 + glow * 0.35) * uOpacity);
        }
    `;

  const dustVertexShader = `
        uniform float uSize;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = uSize * (300.0 / -mvPosition.z);
        }
    `;

  const wormholeUniforms = useMemo(() => ({ uOpacity: { value: 0.0 } }), []);

  const wormholeVertexShader = `
        attribute float aAlpha;
        attribute vec3  aColor;
        uniform float   uOpacity;
        varying float   vAlpha;
        varying vec3    vColor;
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vAlpha = aAlpha;
            vColor = aColor;
        }
    `;

  const wormholeFragmentShader = `
        uniform float uOpacity;
        varying float vAlpha;
        varying vec3  vColor;
        void main() {
            gl_FragColor = vec4(vColor, vAlpha * uOpacity);
        }
    `;

  useFrame(() => {
    if (!blueDustRef.current || !wormholeRef.current) return;

    if (proxy.progress === 0) {
      blueDustRef.current.visible = false;
      wormholeRef.current.visible = false;
      return;
    } else {
      blueDustRef.current.visible = true;
      wormholeRef.current.visible = true;
    }

    const progress = proxy.progress;
    const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

    const bPos = blueDustRef.current.geometry.attributes.position.array as Float32Array;
    const wPos = wormholeRef.current.geometry.attributes.position.array as Float32Array;
    const wAlpha = wormholeRef.current.geometry.attributes.aAlpha.array as Float32Array;
    const wColor = wormholeRef.current.geometry.attributes.aColor.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const startP = startProgresses[i];
      const localProgress = (progress - startP) / WORMHOLE_EFFECT_DURATION;

      const oX = initialPositions[i * 3];
      const oY = initialPositions[i * 3 + 1];
      const oZ = initialPositions[i * 3 + 2];

      // Setup colors statically once
      wColor[i * 6] = 1.0;
      wColor[i * 6 + 1] = 1.0;
      wColor[i * 6 + 2] = 1.0;
      if (colors[i] === 0) {
        wColor[i * 6 + 3] = 0.1;
        wColor[i * 6 + 4] = 0.55;
        wColor[i * 6 + 5] = 1.0;
      } else {
        wColor[i * 6 + 3] = 0.7;
        wColor[i * 6 + 4] = 0.1;
        wColor[i * 6 + 5] = 0.9;
      }

      if (localProgress < 0) {
        // Not started yet. Show as dust.
        bPos[i * 3] = oX;
        bPos[i * 3 + 1] = oY;
        bPos[i * 3 + 2] = oZ;
        // Line is collapsed at outer and invisible
        wPos[i * 6] = oX;
        wPos[i * 6 + 1] = oY;
        wPos[i * 6 + 2] = oZ;
        wPos[i * 6 + 3] = oX;
        wPos[i * 6 + 4] = oY;
        wPos[i * 6 + 5] = oZ;
        wAlpha[i * 2] = 0;
        wAlpha[i * 2 + 1] = 0;
      } else if (localProgress >= 1.0) {
        // Finished completely! Hide dust, hide line.
        bPos[i * 3] = 10000;
        bPos[i * 3 + 1] = 0;
        bPos[i * 3 + 2] = 0;
        wPos[i * 6] = 0;
        wPos[i * 6 + 1] = 0;
        wPos[i * 6 + 2] = 0;
        wPos[i * 6 + 3] = 0;
        wPos[i * 6 + 4] = 0;
        wPos[i * 6 + 5] = 0;
        wAlpha[i * 2] = 0;
        wAlpha[i * 2 + 1] = 0;
      } else {
        // In progress! Hide the dust point
        bPos[i * 3] = 10000;
        bPos[i * 3 + 1] = 0;
        bPos[i * 3 + 2] = 0;

        // localProgress goes 0.0 -> 1.0
        // Phase 1 (0 to 0.4): stretching head to center
        // Phase 2 (0.4 to 0.5): head sits at center
        // Phase 3 (0.5 to 1.0): fading out and tail linearly sucked into center

        if (localProgress < 0.5) {
          // Tail doesn't move yet
          wPos[i * 6] = oX;
          wPos[i * 6 + 1] = oY;
          wPos[i * 6 + 2] = oZ;
        } else {
          // Tail gets sucked mathematically straight into the singularity
          const tailAlpha = 1.0 - (localProgress - 0.5) / 0.5; // 1.0 down to 0.0
          wPos[i * 6] = oX * tailAlpha;
          wPos[i * 6 + 1] = oY * tailAlpha;
          wPos[i * 6 + 2] = oZ * tailAlpha;
        }

        if (localProgress < 0.4) {
          const l = localProgress / 0.4;
          const ease = 1.0 - (1.0 - l) ** 3;
          wPos[i * 6 + 3] = oX * (1 - ease);
          wPos[i * 6 + 4] = oY * (1 - ease);
          wPos[i * 6 + 5] = oZ * (1 - ease);
          wAlpha[i * 2] = 1.0;
          wAlpha[i * 2 + 1] = 0.7;
        } else if (localProgress < 0.5) {
          wPos[i * 6 + 3] = 0;
          wPos[i * 6 + 4] = 0;
          wPos[i * 6 + 5] = 0;
          wAlpha[i * 2] = 1.0;
          wAlpha[i * 2 + 1] = 0.7;
        } else {
          const f = (localProgress - 0.5) / 0.5;
          wPos[i * 6 + 3] = 0;
          wPos[i * 6 + 4] = 0;
          wPos[i * 6 + 5] = 0;
          wAlpha[i * 2] = Math.max(0, 1 - f / 0.55);
          wAlpha[i * 2 + 1] = Math.max(0, 1 - Math.max(0, f - 0.3) / 0.7);
        }
      }
    }

    blueDustRef.current.geometry.attributes.position.needsUpdate = true;
    wormholeRef.current.geometry.attributes.position.needsUpdate = true;
    wormholeRef.current.geometry.attributes.aAlpha.needsUpdate = true;
    wormholeRef.current.geometry.attributes.aColor.needsUpdate = true;

    const bMat = blueDustRef.current.material as THREE.ShaderMaterial;
    bMat.uniforms.uOpacity.value = Math.min(1.0, progress * 4.0) * 0.6 * finalPinch;

    const wMat = wormholeRef.current.material as THREE.ShaderMaterial;
    wMat.uniforms.uOpacity.value = Math.min(1.0, progress * 5.0) * finalPinch;
  });

  return (
    <group>
      <points ref={blueDustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[blueDustPositions, 3]}
            count={count}
            array={blueDustPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={blueDustUniforms}
          vertexShader={dustVertexShader}
          fragmentShader={blueDustFragmentShader}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <lineSegments ref={wormholeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[wormholePositions, 3]}
            count={count * 2}
            array={wormholePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aAlpha"
            args={[wormholeAlphas, 1]}
            count={count * 2}
            array={wormholeAlphas}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aColor"
            args={[wormholeColors, 3]}
            count={count * 2}
            array={wormholeColors}
            itemSize={3}
          />
        </bufferGeometry>
        <shaderMaterial
          uniforms={wormholeUniforms}
          vertexShader={wormholeVertexShader}
          fragmentShader={wormholeFragmentShader}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
