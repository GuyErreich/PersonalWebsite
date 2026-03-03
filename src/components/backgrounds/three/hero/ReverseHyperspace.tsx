import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ReverseHyperspace = () => {
  const linesRef = useRef<THREE.LineSegments>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const count = 400;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 6);
    for(let i=0; i<count; i++) {
        const r = 2 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        
        // start them slightly behind camera (+Z) and shoot them deep into -Z
        const zStart = 6 + Math.random() * 20;
        const length = 15 + Math.random() * 30;
        
        arr[i*6 + 0] = x;
        arr[i*6 + 1] = y;
        arr[i*6 + 2] = zStart;
        
        arr[i*6 + 3] = x;
        arr[i*6 + 4] = y;
        arr[i*6 + 5] = zStart - length;
    }
    return arr;
  }, [count]);

  const initialData = useMemo(() => {
    const data = [];
    for(let i=0; i<count; i++) {
      const r = 1 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      data.push({ x: r * Math.cos(theta), y: r * Math.sin(theta) });
    }
    return data;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (linesRef.current && materialRef.current) {
        const pos = linesRef.current.geometry.attributes.position.array as Float32Array;
        
        // 2 seconds max duration for the animation. speeds up drastically.
        const flightProgress = Math.max(0, Math.min(1, t / 1.8)); 
        const speed = 200 + Math.pow(flightProgress, 3) * 1500;
        
        for(let i=0; i<count; i++) {
            // move away from camera
            pos[i*6 + 2] -= speed * 0.016;
            pos[i*6 + 5] -= speed * 0.016;

            // if they are too far away, recycle them near camera
            if (pos[i*6 + 5] < -150) {
                const xy = initialData[i];
                const length = 10 + Math.random() * 20 + (flightProgress * 60); 
                
                pos[i*6 + 0] = xy.x / (1 + flightProgress * 0.5); // constrict towards center as they regress
                pos[i*6 + 1] = xy.y / (1 + flightProgress * 0.5);
                pos[i*6 + 2] = 10 + Math.random() * 20; // spawn behind camera
                
                pos[i*6 + 3] = pos[i*6 + 0];
                pos[i*6 + 4] = pos[i*6 + 1];
                pos[i*6 + 5] = pos[i*6 + 2] - length;
            }
        }
        linesRef.current.geometry.attributes.position.needsUpdate = true;
        
        // flash opacity up
        if (t < 0.2) {
           materialRef.current.opacity = t / 0.2;
        } else {
           materialRef.current.opacity = 1;
        }
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial ref={materialRef} color="#ffffff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
};
