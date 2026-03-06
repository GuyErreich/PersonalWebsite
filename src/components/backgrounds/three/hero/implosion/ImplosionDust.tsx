import { forwardRef } from 'react';
import * as THREE from 'three';

interface DustProps {
  positions: Float32Array;
  uniforms: any;
  vertexShader: string;
  fragmentShader: string;
}

export const ImplosionBlueDust = forwardRef<THREE.Points, DustProps>(({ positions, uniforms, vertexShader, fragmentShader, ...props }, ref) => (
  <points ref={ref} {...props}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
    </bufferGeometry>
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent={true}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </points>
));

export const ImplosionParticleDust = forwardRef<THREE.Points, DustProps>(({ positions, uniforms, vertexShader, fragmentShader, ...props }, ref) => (
  <points ref={ref} rotation={[0.5, 0.2, -0.3]} {...props}>
    <bufferGeometry>
      <bufferAttribute
        attach="attributes-position"
        args={[positions, 3]}
        count={positions.length / 3}
        array={positions}
        itemSize={3}
      />
    </bufferGeometry>
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent={true}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </points>
));
