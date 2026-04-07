import { useFrame } from "@react-three/fiber";
import { useContext } from "react";
import type * as THREE from "three";
import { AnimationContext } from "../../../../../lib/AnimationContext";

export const CameraShake = () => {
  const orchestrator = useContext(AnimationContext);

  useFrame(({ camera, size }) => {
    if (!orchestrator) return;

    // Compute responsive base Z (mirror of ResponsiveCamera logic) — read from
    // the R3F state object so it's always the latest canvas size, no stale closure.
    const aspect = size.width / size.height;
    const baseZ = aspect < 1 ? 5 * (2.2 / aspect) : 5;

    // We register multiple proxies in ThreeHeroBackground, let's fetch them
    const dolly = orchestrator.getProxy("camera-dolly"); // 0 to 4.8
    const suck = orchestrator.getProxy("camera-suck"); // 4.8 to 6.8
    const climax = orchestrator.getProxy("camera-climax"); // 6.8 to 7.8
    const silence = orchestrator.getProxy("camera-silence"); // 7.8 to 8.6
    const bang = orchestrator.getProxy("camera-bang"); // 8.6 to 10.0

    let targetFov = 50;
    let targetZ = baseZ;
    let power = 0;

    // Phase 0: Taglines
    if (dolly.progress > 0 && suck.progress === 0) {
      targetZ = 5.0 + dolly.activeT * 0.15; // max 5.72
    }
    // Phase 1: Implosion Start
    else if (suck.progress > 0 && climax.progress === 0) {
      targetZ = 5.72;
      targetFov = 50 + suck.progress * 15; // FOV widening (stretching the edges) to 65
    }
    // Phase 2: Implosion Climax
    else if (climax.progress > 0 && silence.progress === 0) {
      const p = climax.progress;
      power = p ** 3 * 0.06; // Heavy rumble
      targetZ = 5.72 - p ** 2 * 3.5; // fly into the black hole!
      targetFov = 65 + p ** 3 * 40; // warp speed fov
    }
    // Phase 3: The Eerie Silence
    else if (silence.progress > 0 && bang.progress === 0) {
      targetZ = baseZ;
      targetFov = 50;
      power = 0;
    }
    // Phase 4: Big Bang
    else if (bang.progress > 0 && bang.progress < 1) {
      const trauma = 1.0 - bang.progress;
      power = trauma ** 3 * 0.25; // Massive hit
      targetZ = baseZ;
      targetFov = 50 - trauma ** 3 * 10; // Slight FOV punch inward on impact
    } else {
      targetZ = baseZ;
      targetFov = 50;
    }

    const pCam = camera as THREE.PerspectiveCamera;
    if (pCam.fov !== undefined && Math.abs(pCam.fov - targetFov) > 0.1) {
      pCam.fov += (targetFov - pCam.fov) * 0.1;
      pCam.updateProjectionMatrix();
    }

    pCam.position.z += (targetZ - pCam.position.z) * 0.1;

    if (power > 0) {
      camera.position.x = (Math.random() - 0.5) * power;
      camera.position.y = (Math.random() - 0.5) * power;
      camera.rotation.z = (Math.random() - 0.5) * power * 0.5;
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
      camera.rotation.z = 0;
    }
  });

  return null;
};
