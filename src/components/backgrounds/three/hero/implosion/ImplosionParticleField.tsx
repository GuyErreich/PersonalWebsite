// @ts-nocheck
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ImplosionParticleField = () => {
  const [isDone, setIsDone] = useState(false);
  const blueDustRef = useRef<THREE.Points>(null);
  const wormholeRef = useRef<THREE.LineSegments>(null);

  // Static blue dust cloud — scattered anchor points that wormhole lasers fire from
  const blueDustPositions = useMemo(() => {
    const count = 400;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 28; // 10–38 units: fills the whole visible volume
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

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


  // --------------- Wormhole line system ---------------

  // Per-line state machine: 0=idle, 1=stretching, 2=hold, 3=fading
  const wormholeState = useRef(
    Array.from({ length: 50 }, (_, si) => ({
      phase: 0 as 0 | 1 | 2 | 3,
      t: 0,
      idleT: si * 0.05 + Math.random() * 0.08, // spread initial burst over ~2.5s
      triggerInterval: 0.04 + Math.random() * 0.08, // short re-fire — guarantees 400+ fires
      outerX: 0, outerY: 0, outerZ: 0,
      dustIdx: -1,
      color: Math.random() < 0.55 ? 0 : 1,
    }))
  );

  // Pool of unconsumed blue dust indices — shuffled so firing order is random
  const availablePool = useRef<number[]>(Array.from({ length: 400 }, (_, i) => i).sort(() => Math.random() - 0.5));
  const poolDrained = useRef(false); // one-shot flag to hide all remaining specks at collapse

  // 2 vertices per line
  const wormholePositions = useMemo(() => new Float32Array(50 * 6), []);
  const wormholeAlphas    = useMemo(() => new Float32Array(50 * 2), []);
  const wormholeColors    = useMemo(() => new Float32Array(50 * 6), []);

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

  // Custom plasma ember shader — soft radial glow per particle, driven fully by GPU

  const dustVertexShader = `
    uniform float uSize;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = uSize * (300.0 / -mvPosition.z);
    }
  `;


  useFrame(({ clock }) => {
    if (isDone) return;
    const t = clock.elapsedTime;
    const entryDelay = 4.8;
    const implosionDuration = 3.0;
    
    if (t < entryDelay) return;
    
    if (t > entryDelay + implosionDuration) {
      setIsDone(true);
      return;
    }

    const activeT = t - entryDelay;
    const progress = Math.max(0, activeT / implosionDuration);
    const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

    // Wormhole laser lines — randomly fired beams that stretch from a far point to the core then fade
    if (wormholeRef.current) {
      const STRETCH = 0.12;
      const HOLD    = 0.03;
      const FADE    = 0.15;
      const posArr   = wormholeRef.current.geometry.attributes.position.array as Float32Array;
      const alphaArr = wormholeRef.current.geometry.attributes.aAlpha.array   as Float32Array;
      const colorArr = wormholeRef.current.geometry.attributes.aColor.array   as Float32Array;
      const dt = 0.016;

      wormholeState.current.forEach((wl, i) => {
        wl.t += dt;

        if (wl.phase === 0) {
          // IDLE: invisible, waiting
          posArr.fill(0, i * 6, i * 6 + 6);
          alphaArr[i * 2] = alphaArr[i * 2 + 1] = 0;
          if (wl.t >= wl.idleT && progress > 0.04 && progress < 0.92) {
            // Pick the next unconsumed blue dust speck from the pool
            const pool = availablePool.current;
            if (pool.length === 0) return; // all consumed, stay idle
            const pick = pool.pop()!;
            wl.dustIdx = pick;
            wl.outerX = blueDustPositions[pick * 3];
            wl.outerY = blueDustPositions[pick * 3 + 1];
            wl.outerZ = blueDustPositions[pick * 3 + 2];
            // Hide the consumed dust speck immediately
            if (blueDustRef.current) {
              const bd = blueDustRef.current.geometry.attributes.position.array as Float32Array;
              bd[pick * 3] = 10000; bd[pick * 3 + 1] = 0; bd[pick * 3 + 2] = 0;
              blueDustRef.current.geometry.attributes.position.needsUpdate = true;
            }
            wl.phase = 1; wl.t = 0;
          }
        } else if (wl.phase === 1) {
          // STRETCHING: inner end shoots from outer position to origin (ease-out cubic)
          const ease = 1.0 - Math.pow(1.0 - Math.min(1, wl.t / STRETCH), 3);
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = wl.outerX * (1 - ease);
          posArr[i * 6 + 4] = wl.outerY * (1 - ease);
          posArr[i * 6 + 5] = wl.outerZ * (1 - ease);
          alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
          if (wl.t >= STRETCH) { wl.phase = 2; wl.t = 0; }
        } else if (wl.phase === 2) {
          // HOLD: full line from outer to core
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
          alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
          if (wl.t >= HOLD) { wl.phase = 3; wl.t = 0; }
        } else if (wl.phase === 3) {
          // FADING: outer (dust/star) end fades first, inner (core) end fades after
          const f = Math.min(1, wl.t / FADE);
          posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
          posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
          alphaArr[i * 2]     = Math.max(0, 1 - f / 0.55);          // outer gone by 55%
          alphaArr[i * 2 + 1] = Math.max(0, 1 - Math.max(0, f - 0.3) / 0.7); // inner lags
          if (wl.t >= FADE) { wl.phase = 0; wl.t = 0; wl.idleT = wl.triggerInterval; }
        }

        // Colors: outer vertex = white hot tip, inner = coloured glow
        colorArr[i * 6]     = 1.0; colorArr[i * 6 + 1] = 1.0; colorArr[i * 6 + 2] = 1.0;
        if (wl.color === 0) { // electric blue tail
          colorArr[i * 6 + 3] = 0.1; colorArr[i * 6 + 4] = 0.55; colorArr[i * 6 + 5] = 1.0;
        } else {              // purple-white tail
          colorArr[i * 6 + 3] = 0.7; colorArr[i * 6 + 4] = 0.1;  colorArr[i * 6 + 5] = 0.9;
        }
      });

      wormholeRef.current.geometry.attributes.position.needsUpdate = true;
      wormholeRef.current.geometry.attributes.aAlpha.needsUpdate    = true;
      wormholeRef.current.geometry.attributes.aColor.needsUpdate    = true;

      const wMat = wormholeRef.current.material as THREE.ShaderMaterial;
      wMat.uniforms.uOpacity.value = Math.pow(Math.min(1, progress * 4), 2) * finalPinch;
    }

    // Blue dust opacity — fades in with the scene, geometry-drained at 0.90 as safety net
    if (blueDustRef.current) {
      if (progress >= 0.90 && !poolDrained.current) {
        poolDrained.current = true;
        const bd = blueDustRef.current.geometry.attributes.position.array as Float32Array;
        availablePool.current.forEach(idx => {
          bd[idx * 3] = 10000; bd[idx * 3 + 1] = 0; bd[idx * 3 + 2] = 0;
        });
        availablePool.current = [];
        blueDustRef.current.geometry.attributes.position.needsUpdate = true;
      }
      const bMat = blueDustRef.current.material as THREE.ShaderMaterial;
      bMat.uniforms.uOpacity.value = Math.pow(Math.min(1, progress * 3), 2) * 0.6 * finalPinch;
    }


  });

  if (isDone) return null;

  return (
    <group>
      {/* Static blue dust cloud — anchor points that wormhole lasers originate from */}
      <points ref={blueDustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[blueDustPositions, 3]} count={blueDustPositions.length / 3} array={blueDustPositions} itemSize={3} />
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
      {/* Wormhole laser lines — randomly fired beams that stretch from a dust point to the core then vanish */}
      <lineSegments ref={wormholeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[wormholePositions, 3]} count={wormholePositions.length / 3} array={wormholePositions} itemSize={3} />
          <bufferAttribute attach="attributes-aAlpha"   args={[wormholeAlphas,   1]} count={wormholeAlphas.length}          array={wormholeAlphas}    itemSize={1} />
          <bufferAttribute attach="attributes-aColor"   args={[wormholeColors,   3]} count={wormholeColors.length / 3}      array={wormholeColors}    itemSize={3} />
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
