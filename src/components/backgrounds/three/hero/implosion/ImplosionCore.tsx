import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { implosionEvents } from './ImplosionConfig';

export const ImplosionCore = () => {
    const voidRef = useRef<THREE.Mesh>(null);
    const horizonRef = useRef<THREE.Mesh>(null);

    const proxy = implosionEvents.getProxy("blackhole");

    useFrame(() => {
        if (!voidRef.current || !horizonRef.current) return;

        if (proxy.progress === 0 && proxy.activeT === 0) {
            voidRef.current.scale.setScalar(0);
            horizonRef.current.scale.setScalar(0);
            return;
        }

        const progress = proxy.progress;
        const activeT = proxy.activeT;

        let expandCollapse = 0;
        if (progress > 0.45 && progress <= 0.78) {
            const outProgress = (progress - 0.45) / 0.33;
            expandCollapse = Math.pow(outProgress, 2.0);
        } else if (progress > 0.78 && progress <= 0.88) {
            const inProgress = (0.88 - progress) / 0.10;
            expandCollapse = Math.pow(inProgress, 0.5); 
        }

        let introBounce = 1.0;
        if (activeT < 0.6) {
          const x = activeT / 0.6; 
          const c1 = 1.70158;
          const c3 = c1 + 1;
          introBounce = Math.max(0, 1.0 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2));
        }

        const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;
        const coreCollapse = 1.0 - Math.pow(progress, 2.5) * 0.9;
        const shake = 1.0 + (Math.sin(activeT * 40) * 0.03 * expandCollapse);

        voidRef.current.scale.setScalar(shake * coreCollapse * finalPinch * introBounce);
        voidRef.current.rotation.x = activeT * 1.5;
        voidRef.current.rotation.y = activeT * 2.0;

        horizonRef.current.scale.setScalar((shake * coreCollapse * 1.3 + (expandCollapse * 0.5)) * finalPinch * introBounce);
        horizonRef.current.rotation.x = -activeT * 2.5;
        horizonRef.current.rotation.y = -activeT * 1.8;
        (horizonRef.current.material as THREE.MeshBasicMaterial).opacity = (0.2 + expandCollapse * 0.8) * finalPinch;
    });

    return (
        <group>
            <mesh ref={horizonRef} scale={0}>
                <icosahedronGeometry args={[0.6, 0]} />
                <meshBasicMaterial color="#7c3aed" wireframe transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={voidRef} scale={0}>
                <icosahedronGeometry args={[0.58, 0]} />
                <meshBasicMaterial color="#000000" />
            </mesh>
        </group>
    );
};
