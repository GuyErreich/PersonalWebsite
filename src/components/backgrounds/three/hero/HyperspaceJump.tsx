import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const HyperspaceJump = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  
  const count = 300;
  
  // 2 vertices per line for the streaks
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 6);
    for(let i=0; i<count; i++) {
        // distribute them in a ring so they don't cover the very center
        const r = 3 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        // start them very far back
        const zStart = -50 - Math.random() * 100;
        const length = 5 + Math.random() * 25;
        
        arr[i*6 + 0] = x;
        arr[i*6 + 1] = y;
        arr[i*6 + 2] = zStart;
        
        arr[i*6 + 3] = x;
        arr[i*6 + 4] = y;
        arr[i*6 + 5] = zStart + length;
    }
    return arr;
  }, [count]);

  // Use raw array refs for fast resetting
  const initialData = useMemo(() => {
    const data = [];
    for(let i=0; i<count; i++) {
      const r = 2 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      data.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return data;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    
    // The Hero UI drops at 12.5s.
    // The hyperspace should start at ~11.8s, rapidly accelerate, and flash/brake at 12.5s.
    const startT = 11.5;
    const endT = 12.7;

    if (t < startT || t > endT) {
        if (linesRef.current) linesRef.current.visible = false;
        return;
    }

    if (linesRef.current && materialRef.current) {
        linesRef.current.visible = true;
        
        const pos = linesRef.current.geometry.attributes.position.array as Float32Array;
        
        // As it approaches 12.5, speed goes absolutely crazy
        // at 11.5 progress is 0. at 12.5 progress is 1.0.
        const flightProgress = Math.max(0, Math.min(1, (t - startT) / (12.5 - startT)));
        
        // Speeds up exponentially
        const speed = 30 + Math.pow(flightProgress, 4) * 800;
        
        for(let i=0; i<count; i++) {
            // Move Z towards camera (positive Z)
            pos[i*6 + 2] += speed * 0.016;
            pos[i*6 + 5] += speed * 0.016;

            // if the tail passes the camera, recycle it far back
            if (pos[i*6 + 2] > 10) {
                const xy = initialData[i];
                // the faster we go, the longer the streaks get
                const length = 5 + Math.random() * 20 + (flightProgress * 60); 
                
                pos[i*6 + 0] = xy.x * (1 + flightProgress * 0.5); // expand outward slightly as we go faster
                pos[i*6 + 1] = xy.y * (1 + flightProgress * 0.5);
                pos[i*6 + 2] = -150 - Math.random() * 50; // spawn far back
                
                pos[i*6 + 3] = pos[i*6 + 0];
                pos[i*6 + 4] = pos[i*6 + 1];
                pos[i*6 + 5] = pos[i*6 + 2] + length;
            }
        }
        linesRef.current.geometry.attributes.position.needsUpdate = true;

        // Opacity fading
        // Fade in from 11.5 to 11.8
        let opacity = 1;
        if (t < 11.8) {
            opacity = (t - 11.5) / 0.3;
        }
        // Suddenly blink out right after 12.5
        if (t > 12.5) {
            opacity = Math.max(0, 1.0 - ((t - 12.5) / 0.2));
        }
        materialRef.current.opacity = opacity;
    }
  });

  return (
    <lineSegments ref={linesRef} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};
