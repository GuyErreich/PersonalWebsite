import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Float } from '@react-three/drei';
import { ConstellationWeb } from './ConstellationWeb';

// Pre-calculate mathematically perfect spaced positions for our orbital shapes
const makeOrbitShapes = (radius: number, count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      angle
    };
  });
};

export const OrbitingShapes = () => {
  const orbit1Ref = useRef<THREE.Group>(null);
  const orbit2Ref = useRef<THREE.Group>(null);
  const orbit3Ref = useRef<THREE.Group>(null);

  // We have 3 orbital tracks
  const orbit1Shapes = useMemo(() => makeOrbitShapes(4, 5), []);
  const orbit2Shapes = useMemo(() => makeOrbitShapes(7, 8), []);
  const orbit3Shapes = useMemo(() => makeOrbitShapes(10, 12), []);

  useFrame(({ clock }) => {
    // Delay creation until after implosion
    const t = Math.max(0, clock.elapsedTime - 8.6);
    
    // Scale up the orbits from 0 to 1 just behind the sun's formation
    const orbitProgress = Math.min(1, Math.max(0, (t - 0.2) / 2.0));
    const orbitEase = 1 - Math.pow(1 - orbitProgress, 4);

    // Spin individual discs at different speeds and direction, mapping the scale ease as well
    if (orbit1Ref.current) {
       if (t === 0) { orbit1Ref.current.visible = false; } else { orbit1Ref.current.visible = true; }
       orbit1Ref.current.rotation.y = t * 0.15;
       orbit1Ref.current.scale.setScalar(orbitEase);
    }
    if (orbit2Ref.current) {
       if (t === 0) { orbit2Ref.current.visible = false; } else { orbit2Ref.current.visible = true; }
       orbit2Ref.current.rotation.y = t * 0.1;
       orbit2Ref.current.scale.setScalar(orbitEase);
    }
    if (orbit3Ref.current) {
       if (t === 0) { orbit3Ref.current.visible = false; } else { orbit3Ref.current.visible = true; }
       orbit3Ref.current.rotation.y = t * 0.08;
       orbit3Ref.current.scale.setScalar(orbitEase);
    }
  });

  return (
    <>
      {/* ORBIT TRACK 1: DevOps Cubes */}
      <group ref={orbit1Ref} visible={false}>
        {/* Physical orbit line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.98, 4.02, 64]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
        {orbit1Shapes.map((pos, i) => (
          <Float key={`cube-${i}`} speed={4} rotationIntensity={4} floatIntensity={1}>
            <mesh position={[pos.x, 0, pos.z]}>
              {/* Dual-layered boxes looking highly technical */}
              <boxGeometry args={[0.4, 0.4, 0.4]} />
              <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1.5} wireframe transparent opacity={0.95} />
              <mesh>
                <boxGeometry args={[0.2, 0.2, 0.2]} />
                <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={2.0} />
              </mesh>
            </mesh>
          </Float>
        ))}
      </group>

      {/* ORBIT TRACK 2: Game Dev Poly Shards */}
      <group ref={orbit2Ref} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[6.98, 7.02, 64]} />
          <meshBasicMaterial color="#34d399" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
        {orbit2Shapes.map((pos, i) => (
          <Float key={`cone-${i}`} speed={2} rotationIntensity={4} floatIntensity={2}>
             {/* Tilting the cones so they face forward dynamically */}
            <mesh position={[pos.x, 0, pos.z]} rotation={[pos.angle, 0.5, 0.5]}>
              <coneGeometry args={[0.3, 0.8, 4]} />
              <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.8} metalness={0.8} roughness={0.2} transparent opacity={0.95} />
            </mesh>
          </Float>
        ))}
      </group>

      {/* ORBIT TRACK 3: Data Core Spheres */}
      <group ref={orbit3Ref} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.98, 10.02, 64]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
        {orbit3Shapes.map((pos, i) => (
          <Float key={`sphere-${i}`} speed={3} rotationIntensity={1} floatIntensity={3}>
            <mesh position={[pos.x, 0, pos.z]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={2.0} transparent opacity={0.95} />
            </mesh>
          </Float>
        ))}
      </group>

      {/* Constellation Web connecting the orbital rings globally */}
      <ConstellationWeb 
        delay={8.6}
        orbitsInfo={[
          { ref: orbit1Ref, shapes: orbit1Shapes },
          { ref: orbit2Ref, shapes: orbit2Shapes },
          { ref: orbit3Ref, shapes: orbit3Shapes }
      ]} />
    </>
  );
};
