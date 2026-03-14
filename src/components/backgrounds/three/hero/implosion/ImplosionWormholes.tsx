import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { implosionEvents } from './ImplosionConfig';

export const ImplosionWormholes = () => {
    const proxy = implosionEvents.getProxy("blueDust");
    
    const blueDustRef = useRef<THREE.Points>(null);
    const wormholeRef = useRef<THREE.LineSegments>(null);

    const blueDustPositions = useMemo(() => {
        const count = 400;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = 10 + Math.random() * 28; 
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

    const dustVertexShader = `
        uniform float uSize;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = uSize * (300.0 / -mvPosition.z);
        }
    `;

    const wormholeState = useRef(
        Array.from({ length: 50 }, (_, si) => ({
            phase: 0 as 0 | 1 | 2 | 3,
            t: 0,
            idleT: si * 0.05 + Math.random() * 0.08, 
            triggerInterval: 0.04 + Math.random() * 0.08, 
            outerX: 0, outerY: 0, outerZ: 0,
            dustIdx: -1,
            color: Math.random() < 0.55 ? 0 : 1,
        }))
    );

    const availablePool = useRef<number[]>(Array.from({ length: 400 }, (_, i) => i).sort(() => Math.random() - 0.5));
    const poolDrained = useRef(false);

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

    useFrame(() => {
        if (proxy.progress === 0 && proxy.activeT === 0) {
            if (blueDustRef.current) blueDustRef.current.visible = false;
            if (wormholeRef.current) wormholeRef.current.visible = false;
            return;
        } else {
            if (blueDustRef.current) blueDustRef.current.visible = true;
            if (wormholeRef.current) wormholeRef.current.visible = true;
        }

        const progress = proxy.progress;
        const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

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
                    posArr.fill(0, i * 6, i * 6 + 6);
                    alphaArr[i * 2] = alphaArr[i * 2 + 1] = 0;
                    if (wl.t >= wl.idleT && progress > 0.04 && progress < 0.92) {
                        const pool = availablePool.current;
                        if (pool.length === 0) return; 
                        const pick = pool.pop()!;
                        wl.dustIdx = pick;
                        wl.outerX = blueDustPositions[pick * 3];
                        wl.outerY = blueDustPositions[pick * 3 + 1];
                        wl.outerZ = blueDustPositions[pick * 3 + 2];
                        if (blueDustRef.current) {
                            const bd = blueDustRef.current.geometry.attributes.position.array as Float32Array;
                            bd[pick * 3] = 10000; bd[pick * 3 + 1] = 0; bd[pick * 3 + 2] = 0;
                            blueDustRef.current.geometry.attributes.position.needsUpdate = true;
                        }
                        wl.phase = 1; wl.t = 0;
                    }
                } else if (wl.phase === 1) {
                    const ease = 1.0 - Math.pow(1.0 - Math.min(1, wl.t / STRETCH), 3);
                    posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
                    posArr[i * 6 + 3] = wl.outerX * (1 - ease);
                    posArr[i * 6 + 4] = wl.outerY * (1 - ease);
                    posArr[i * 6 + 5] = wl.outerZ * (1 - ease);
                    alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
                    if (wl.t >= STRETCH) { wl.phase = 2; wl.t = 0; }
                } else if (wl.phase === 2) {
                    posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
                    posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
                    alphaArr[i * 2] = 1.0; alphaArr[i * 2 + 1] = 0.7;
                    if (wl.t >= HOLD) { wl.phase = 3; wl.t = 0; }
                } else if (wl.phase === 3) {
                    const f = Math.min(1, wl.t / FADE);
                    posArr[i * 6]     = wl.outerX; posArr[i * 6 + 1] = wl.outerY; posArr[i * 6 + 2] = wl.outerZ;
                    posArr[i * 6 + 3] = 0; posArr[i * 6 + 4] = 0; posArr[i * 6 + 5] = 0;
                    alphaArr[i * 2]     = Math.max(0, 1 - f / 0.55);          
                    alphaArr[i * 2 + 1] = Math.max(0, 1 - Math.max(0, f - 0.3) / 0.7); 
                    if (wl.t >= FADE) { wl.phase = 0; wl.t = 0; wl.idleT = wl.triggerInterval; }
                }

                colorArr[i * 6]     = 1.0; colorArr[i * 6 + 1] = 1.0; colorArr[i * 6 + 2] = 1.0;
                if (wl.color === 0) { 
                    colorArr[i * 6 + 3] = 0.1; colorArr[i * 6 + 4] = 0.55; colorArr[i * 6 + 5] = 1.0;
                } else {              
                    colorArr[i * 6 + 3] = 0.7; colorArr[i * 6 + 4] = 0.1;  colorArr[i * 6 + 5] = 0.9;
                }
            });

            wormholeRef.current.geometry.attributes.position.needsUpdate = true;
            wormholeRef.current.geometry.attributes.aAlpha.needsUpdate    = true;
            wormholeRef.current.geometry.attributes.aColor.needsUpdate    = true;

            const wMat = wormholeRef.current.material as THREE.ShaderMaterial;
            wMat.uniforms.uOpacity.value = Math.pow(Math.min(1, progress * 4), 2) * finalPinch;
        }

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

    return (
        <group>
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

            <lineSegments ref={wormholeRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[wormholePositions, 3]} count={wormholePositions.length / 3} array={wormholePositions} itemSize={3} />
                    <bufferAttribute attach="attributes-aAlpha"   args={[wormholeAlphas,    1]} count={wormholeAlphas.length}          array={wormholeAlphas}    itemSize={1} />
                    <bufferAttribute attach="attributes-aColor"   args={[wormholeColors,    3]} count={wormholeColors.length / 3}      array={wormholeColors}    itemSize={3} />
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
