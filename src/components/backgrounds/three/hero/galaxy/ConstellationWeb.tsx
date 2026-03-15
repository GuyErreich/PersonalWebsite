import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOrchestrator } from '../../../../../lib/AnimationContext';

// Orbital Constellations Web Component (Connects orbiting shapes within and across tracks)
export const ConstellationWeb = ({ orbitsInfo, globalOpacityRef, connectionThreshold }: { 
    orbitsInfo: { ref: React.RefObject<THREE.Group | null>, shapes: any[], opacity?: number }[],
    globalOpacityRef?: React.RefObject<number>,
    connectionThreshold?: number
}) => {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  // High-performance geometry buffer
  const geomRef = useRef(new THREE.BufferGeometry());
  
  // Cranked max connections way up to allow a wildly dense web
  const MAX_CONNECTIONS = 2000; 
  const positions = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);
  const colors = useMemo(() => new Float32Array(MAX_CONNECTIONS * 2 * 3), []);

  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("orbits");

  useFrame(({ clock }) => {
    // If we're before our entry animation, output zero geometry
    if (proxy.progress === 0 && proxy.activeT === 0) {
        geomRef.current.setDrawRange(0, 0);
        return;
    }

    // We don't necessarily need linesRef, we update the geometry directly, but checking for safety
    
    // Use an animated pulsing threshold so the web organically "breathes" 
    // Use activeT so syncs exactly when the proxy starts
    const t = proxy.activeT > 0 ? clock.elapsedTime : 0;
    
    // Increased base threshold enormously so lines almost ALWAYS cross-connect deep into other tracks
    const baseThreshold = connectionThreshold !== undefined ? connectionThreshold : 6.0;
    // Increased the breathing reach to make it sweep through the whole system
    const pulsingThreshold = connectionThreshold !== undefined ? connectionThreshold : baseThreshold + Math.sin(t * 0.5) * 1.5; 

    const allPoints: { pos: THREE.Vector3, color: THREE.Color, opacity: number }[] = [];
    
    if (!orbitsInfo.every(o => o.ref.current)) return;

    orbitsInfo.forEach((orbit, index) => {
       const group = orbit.ref.current;
       if (!group || !group.visible) return;
       
       // Map orbit index colors identically across the tracks
       let trackColor = new THREE.Color("#ffffff");
       if (index === 0) trackColor = new THREE.Color("#3b82f6"); // Cube Track Blue
       else if (index === 1) trackColor = new THREE.Color("#10b981"); // Shard Track Emerald
       else if (index === 2) trackColor = new THREE.Color("#8b5cf6"); // Sphere Track Purple

       orbit.shapes.forEach((pos: any) => {
         const v = new THREE.Vector3(pos.x, 0, pos.z);
         v.applyEuler(group.rotation);
         v.multiplyScalar(group.scale.x); 
         allPoints.push({ pos: v, color: trackColor, opacity: orbit.opacity !== undefined ? orbit.opacity : 1 });
       });
    });

    let lineIdx = 0;
    const globalFade = globalOpacityRef?.current !== undefined ? globalOpacityRef.current : 1.0;

    for (let i = 0; i < allPoints.length; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
            if (lineIdx >= MAX_CONNECTIONS) break;
            
            const p1 = allPoints[i].pos;
            const p2 = allPoints[j].pos;
            
            const dist = p1.distanceTo(p2);
            
            if (dist < pulsingThreshold) {
                // Smoother, slightly more gracious alpha falloff to allow the dense web to look atmospheric
                let alphaRatio = 1.0 - (dist / pulsingThreshold);
                const alpha = Math.pow(alphaRatio, 1.2); // Less harsh dropoff so far lines still show

                positions[lineIdx * 6] = p1.x;
                positions[lineIdx * 6 + 1] = p1.y;
                positions[lineIdx * 6 + 2] = p1.z;
                positions[lineIdx * 6 + 3] = p2.x;
                positions[lineIdx * 6 + 4] = p2.y;
                positions[lineIdx * 6 + 5] = p2.z;

                // Color lines by dynamically blending the color of shape A and shape B based on distance
                const mixedOpacity = Math.min(allPoints[i].opacity, allPoints[j].opacity);
                const brightness = alpha * 0.8 * mixedOpacity * globalFade; // Boost the brightness so colors show, scaling by point opacity and global fade

                // Blend the color of node i with node j
                const mixedColor = allPoints[i].color.clone().lerp(allPoints[j].color, 0.5);

                const r = mixedColor.r * brightness; 
                const g = mixedColor.g * brightness;
                const b = mixedColor.b * brightness;

                colors[lineIdx * 6] = r; colors[lineIdx * 6 + 1] = g; colors[lineIdx * 6 + 2] = b;
                colors[lineIdx * 6 + 3] = r; colors[lineIdx * 6 + 4] = g; colors[lineIdx * 6 + 5] = b;

                lineIdx++;
            }
        }
    }

    geomRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geomRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geomRef.current.setDrawRange(0, lineIdx * 2);
    
    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.attributes.color.needsUpdate = true;
  });

  return (
    <lineSegments ref={linesRef} geometry={geomRef.current}>
      <lineBasicMaterial 
        vertexColors 
        transparent 
        blending={THREE.AdditiveBlending} 
        depthWrite={false} 
      />
    </lineSegments>
  );
};
