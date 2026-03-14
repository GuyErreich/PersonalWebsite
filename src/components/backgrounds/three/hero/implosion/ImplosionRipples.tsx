import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { implosionEvents } from './ImplosionConfig';

export const ImplosionRipples = () => {
    const proxy = implosionEvents.getProxy("ripples");
    
    const rippleRefs = useMemo(() => {
        return Array.from({ length: 6 }).map(() => ({
            ref: React.createRef<THREE.Mesh>(),
            startDelay: Math.random() * 1.5,
            speed: 1.2 + Math.random() * 2.0,
            scaleMultiplier: 12 + Math.random() * 6,
            rotX: (Math.random() - 0.5) * 0.5,
            rotY: (Math.random() - 0.5) * 0.5,
            tiltSpeed: (Math.random() - 0.5) * 2.0
        }));
    }, []);

    useFrame(() => {
        if (proxy.progress === 0 && proxy.activeT === 0) {
            rippleRefs.forEach(r => { if (r.ref.current) r.ref.current.scale.setScalar(0); });
            return;
        }

        const progress = proxy.progress;
        const activeT = proxy.activeT;
        const activeDuration = proxy.duration; 
        const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

        rippleRefs.forEach((ripple) => {
            const mesh = ripple.ref.current;
            if (!mesh) return;

            const rippleActiveT = activeT - ripple.startDelay;
            
            if (rippleActiveT < 0 || progress > 0.95) {
                mesh.scale.setScalar(0);
                return;
            }

            const rawCycle = rippleActiveT * ripple.speed;
            let cycle = rawCycle % 1.0; 

            if (progress > 0.82) {
                const timeAtLock = (0.82 * activeDuration) - ripple.startDelay;
                const lockLoop = Math.max(0, Math.floor(timeAtLock * ripple.speed));
                const currentLoop = Math.floor(rawCycle);
                
                if (currentLoop > lockLoop) {
                    cycle = 1.0; 
                } else {
                    const suckPhase = Math.min(1.0, (progress - 0.82) / 0.18); 
                    cycle = cycle + (1.0 - cycle) * Math.pow(suckPhase, 1.5); 
                }
            }
            
            const currentScale = Math.max(0, 1.0 - Math.pow(cycle, 0.5)) * ripple.scaleMultiplier;
            const warp = Math.pow(cycle, 2.0) * 0.2; 
            
            mesh.scale.set(
                currentScale * finalPinch * (1.0 + warp), 
                currentScale * finalPinch * (1.0 - warp), 
                currentScale * finalPinch
            );

            const mat = mesh.material as THREE.MeshBasicMaterial;
            if (mat) {
                const sceneClimaxPulse = Math.pow(progress, 3.0); 
                const intensity = 1.0 + Math.pow(cycle, 1.5) * 3.0 + (sceneClimaxPulse * 15.0);
                
                const startFade = cycle === 1.0 ? 0 : Math.min(1.0, cycle * 5.0);
                const endFade = Math.max(0, 1.0 - Math.pow(cycle, 3.0));
                const dynamicOpacity = 0.15 + (sceneClimaxPulse * 0.7);
                
                mat.opacity = startFade * endFade * dynamicOpacity * finalPinch;
                
                const glowColor = new THREE.Color("#60a5fa").multiplyScalar(intensity);
                mat.color.copy(glowColor);
            }
            
            mesh.rotation.z = rippleActiveT * ripple.tiltSpeed; 
            mesh.rotation.x = ripple.rotX;
            mesh.rotation.y = ripple.rotY;
        });
    });

    return (
        <group>
            {rippleRefs.map((ripple, i) => (
                <mesh key={`ripple-${i}`} ref={ripple.ref} scale={0}>
                    <ringGeometry args={[0.9, 0.905, 64]} />
                    <meshBasicMaterial 
                        transparent 
                        opacity={0} 
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </group>
    );
};
