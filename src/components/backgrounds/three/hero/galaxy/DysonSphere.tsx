import { Float } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";
import { NetworkFlare } from "./NetworkFlare";

export const DysonSphere = () => {
  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("dyson");
  const dysonSphereRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (dysonSphereRef.current) {
      if (proxy.progress === 0 && proxy.activeT === 0) {
        dysonSphereRef.current.visible = false;
        return;
      } else {
        dysonSphereRef.current.visible = true;
      }

      // Expand slowly as the proxy dictates
      const dysonEase = proxy.progress;

      const t = clock.elapsedTime;
      // Inverse breathe relative to the sun
      const inversePulse = 1 - Math.sin(t * 2) * 0.02;

      dysonSphereRef.current.scale.setScalar(dysonEase * inversePulse);

      // Spin slowly in the exact opposite direction to the sun
      dysonSphereRef.current.rotation.y = -t * 0.1;
      dysonSphereRef.current.rotation.x = -t * 0.05;
    }
  });

  return (
    <group ref={dysonSphereRef} visible={false}>
      <Float speed={2} rotationIntensity={0} floatIntensity={0.5}>
        <mesh>
          {/* Uses an icosahedron geometry with much higher detail (2) to create a sphere made of connected triangles */}
          <icosahedronGeometry args={[2.2, 2]} />
          {/* We render ONLY the wireframe to make it a network net */}
          <meshBasicMaterial
            color="#ef4444" // Deep sinister Red
            wireframe
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Outer faint glowing shell to give the sphere volume */}
        <mesh>
          <sphereGeometry args={[2.15, 32, 32]} />
          <meshBasicMaterial
            color="#991b1b" // Darker blood red
            transparent
            opacity={0.03}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Float>

      {/* Network Solar Flares (moved from Sun to the surface of the sphere map) */}
      <group scale={1.5}>
        {" "}
        {/* Scaling it slightly to ensure it arcs cleanly outside the sphere's bounds */}
        <NetworkFlare offsetTime={0} />
        <NetworkFlare offsetTime={2.5} />
        <NetworkFlare offsetTime={5.0} />
        <NetworkFlare offsetTime={7.5} />
      </group>
    </group>
  );
};
