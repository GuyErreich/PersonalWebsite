import { forwardRef } from 'react';
import * as THREE from 'three';

interface WormholeProps {
  positions: Float32Array;
  alphas: Float32Array;
  colors: Float32Array;
  uniforms: any;
  vertexShader: string;
  fragmentShader: string;
}

export const ImplosionWormholes = forwardRef<THREE.LineSegments, WormholeProps>(({ positions, alphas, colors, uniforms, vertexShader, fragmentShader, ...props }, ref) => (
  <lineSegments ref={ref} {...props}>
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} count={alphas.length} array={alphas} itemSize={1} />
      <bufferAttribute attach="attributes-aColor" args={[colors, 3]} count={colors.length / 3} array={colors} itemSize={3} />
    </bufferGeometry>
    <shaderMaterial
      uniforms={uniforms}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      transparent={true}
      blending={THREE.AdditiveBlending}
      depthWrite={false}
    />
  </lineSegments>
));
