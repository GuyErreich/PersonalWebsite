import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const implosionDuration = 3.0;
const entryDelay = 4.8;
const totalPhaseTime = implosionDuration + entryDelay;

export const ImplosionPlasmaDust = () => {
  const [isDone, setIsDone] = useState(false);
  const dustRef = useRef<THREE.Points>(null);

  const { dustPositions, dustSpeeds } = useMemo(() => {
    const count = 600; // Drastically reduced so they don't overpower the scene
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for(let i = 0; i < count; i++) {
        const r = 4 + Math.random() * 8; // Start closer
        const theta = Math.random() * Math.PI * 2;
        // Form a flat accretion disk instead of a blinding complete sphere
        positions[i*3] = r * Math.cos(theta);
        positions[i*3+1] = (Math.random() - 0.5) * 0.8; // mostly flat on the Y axis
        positions[i*3+2] = r * Math.sin(theta);
        speeds[i] = 1.0 + Math.random() * 2.0; // Slower, more elegant pull
    }
    return { dustPositions: positions, dustSpeeds: speeds };
  }, []);
  const dustUniforms = useMemo(() => ({
    uOpacity:    { value: 0.0 },
    uIntensity:  { value: 1.0 },
    uSize:       { value: 3.0 },
    uAbsorption: { value: 0.0 }, // 0 = glowing plasma, 1 = light-consuming void
  }), []);
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

      // Plasma glow color
      vec3 coreColor  = vec3(0.98, 0.88, 1.0);
      vec3 outerColor = vec3(0.55, 0.1,  0.75);
      vec3 plasmaColor = mix(outerColor, coreColor, core) * uIntensity;

      // Absorbed void color — deep black with a faint dark-blue rim
      vec3 voidColor = vec3(0.0, 0.0, 0.02) * (1.0 - core * 0.5);

      // Lerp between plasma glow and absorbed void
      vec3 color = mix(plasmaColor, voidColor, uAbsorption);

      float alpha = (core * 0.95 + glow * 0.5) * uOpacity;
      gl_FragColor = vec4(color, alpha);
    }
  `;

  useFrame(({ clock }) => {
    if (isDone) return;
    const t = clock.elapsedTime;
    
    if (t > totalPhaseTime) {
      setIsDone(true);
      return;
    }

    if (t < entryDelay) {
      if (dustRef.current) dustRef.current.visible = false;
      return;
    } else {
      if (dustRef.current) dustRef.current.visible = true;
    }

    const activeT = t - entryDelay;
    const activeDuration = implosionDuration;
    const progress = activeT / activeDuration;
    const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;
    
    if (dustRef.current) {
      const positions = dustRef.current.geometry.attributes.position.array;
      for (let i = 0; i < dustPositions.length / 3; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        const dist = Math.sqrt(x * x + y * y + z * z);

        if (dist < 0.05 || progress > 0.98) {
          if (progress <= 0.92) {
            // Respawn at full radius
            const r = 8 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            positions[i * 3]     = r * Math.cos(theta);
            positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8;
            positions[i * 3 + 2] = r * Math.sin(theta);
          } else {
            // Past 0.92: accumulate at origin, finalPinch fades opacity
            positions[i * 3] = 0; positions[i * 3 + 1] = 0; positions[i * 3 + 2] = 0;
          }
        } else {
          // Gravity pull
          const condenseFactor = progress > 0.70 
            ? Math.min(2.2, 1.0 + Math.pow((progress - 0.70) / 0.30, 2.0) * 4.0)
            : 1.0;
          const speed = dustSpeeds[i] * 4.0 * condenseFactor;
          positions[i * 3]     -= (x / dist) * speed * 0.016;
          positions[i * 3 + 1] -= (y / dist) * speed * 0.016;
          positions[i * 3 + 2] -= (z / dist) * speed * 0.016;

          // Orbital swirl
          const baseSwirl = 0.005;
          const swirlSpeed = baseSwirl + (1.0 / dist) * 0.08 * condenseFactor;
          const cosS = Math.cos(swirlSpeed);
          const sinS = Math.sin(swirlSpeed);
          const nx = positions[i * 3] * cosS - positions[i * 3 + 2] * sinS;
          const nz = positions[i * 3] * sinS + positions[i * 3 + 2] * cosS;
          positions[i * 3] = nx;
          positions[i * 3 + 2] = nz;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;

      const mat = dustRef.current.material as THREE.ShaderMaterial;
      mat.uniforms.uOpacity.value = Math.min(1, activeT / 0.5) * (0.8 + Math.pow(progress, 2.0)) * finalPinch;
      mat.uniforms.uIntensity.value = 1.0 + Math.pow(progress, 2.0) * 5.0;
      mat.uniforms.uAbsorption.value = progress > 0.78 ? Math.min(1.0, (progress - 0.78) / 0.10) : 0.0;
    }
  });

  if (isDone) return null;

  return (
    <group>
      {/* Sucked-in Particle Dust - Plasma Embers with custom radial glow shader */}
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
    </group>
  );
};
