import { useFrame } from "@react-three/fiber";
import React, { useMemo } from "react";
import * as THREE from "three";
import { useOrchestrator } from "../../../../../lib/AnimationContext";

export const ImplosionRings = () => {
  const orchestrator = useOrchestrator();
  const proxy = orchestrator.getProxy("rings");
  const masterProxy = orchestrator.getProxy("master");

  const rings = useMemo(() => {
    const fixedRotations = [
      { rotX: Math.PI / 2, rotY: 0 },
      { rotX: Math.PI / 4, rotY: Math.PI / 4 },
      { rotX: -Math.PI / 4, rotY: Math.PI / 4 },
    ];
    return [0, 1, 2].map((i) => {
      const baseColor = new THREE.Color(["#f59e0b", "#3b82f6", "#10b981"][i]);
      baseColor.multiplyScalar(2.5);
      return {
        ref: React.createRef<THREE.Mesh>(),
        rotX: fixedRotations[i].rotX,
        rotY: fixedRotations[i].rotY,
        spinDirTargetX: (i % 2 === 0 ? 1 : -1) * (1.0 + i * 0.2),
        spinDirTargetY: (i % 2 !== 0 ? 1 : -1.5) * (1.0 + i * 0.3),
        color: baseColor,
      };
    });
  }, []);

  const targetColor = useMemo(() => new THREE.Color(), []);
  const whiteHot = useMemo(() => new THREE.Color(0xffffff), []);

  useFrame(() => {
    if (proxy.progress === 0 && proxy.activeT === 0) {
      rings.forEach((r) => {
        if (r.ref.current) r.ref.current.scale.setScalar(0);
      });
      return;
    }

    const progress = proxy.progress;
    const activeT = proxy.activeT;

    let expandCollapse = 0;
    if (progress > 0.45 && progress <= 0.78) {
      const outProgress = (progress - 0.45) / 0.33;
      expandCollapse = outProgress ** 2.0;
    } else if (progress > 0.78 && progress <= 0.88) {
      const inProgress = (0.88 - progress) / 0.1;
      expandCollapse = inProgress ** 0.5;
    }

    let ringBounce = 1.0;
    if (activeT < 0.6) {
      const rx = activeT / 0.6;
      const c1 = 1.70158;
      const c3 = c1 + 1;
      ringBounce = Math.max(0, 1.0 + c3 * (rx - 1) ** 3 + c1 * (rx - 1) ** 2);
    }

    const currentScale = (1.0 + expandCollapse * 1.8) * ringBounce;
    const finalPinch = progress > 0.88 ? Math.max(0, 1 - (progress - 0.88) * (1 / 0.12)) : 1;

    rings.forEach((ring) => {
      const mesh = ring.ref.current;
      if (!mesh) return;

      let zStretch = 1.0;
      if (progress > 0.75) {
        zStretch = 1.0 + Math.min(1.0, (progress - 0.75) / 0.13) ** 3.0 * 8.0;
      }
      mesh.scale.set(
        currentScale * finalPinch,
        currentScale * finalPinch,
        currentScale * finalPinch * zStretch,
      );

      const t = masterProxy.activeT > 0 ? 4.8 + masterProxy.activeT : 0;
      const baseSpinSpeed = t * 0.4;
      const frenzySpeed = progress ** 3 * 20.0;

      mesh.rotation.x =
        ring.rotX +
        baseSpinSpeed * ring.spinDirTargetX +
        frenzySpeed * Math.sign(ring.spinDirTargetX);
      mesh.rotation.y =
        ring.rotY +
        baseSpinSpeed * ring.spinDirTargetY +
        frenzySpeed * Math.sign(ring.spinDirTargetY);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        const fadeIn = Math.min(1, activeT / 0.3);
        mat.opacity = fadeIn * (0.6 + expandCollapse * 0.4) * finalPinch;

        let intensity = 1.0 + expandCollapse ** 2.0 * 8.0;
        let whiteMix = 0.0;

        if (progress > 0.75) {
          const burnProgress = Math.min(1.0, (progress - 0.75) / 0.13);
          intensity += burnProgress ** 3.0 * 50.0;
          whiteMix = burnProgress ** 2.0;
        }

        targetColor.copy(ring.color).multiplyScalar(intensity);
        if (whiteMix > 0) {
          whiteHot.set(0xffffff).multiplyScalar(intensity);
          targetColor.lerp(whiteHot, whiteMix);
        }

        mat.color.copy(targetColor);
      }
    });
  });

  return (
    <group>
      {rings.map((ring, i) => (
        <mesh key={i} ref={ring.ref} scale={0}>
          <torusGeometry args={[0.8, 0.008, 4, 16]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};
