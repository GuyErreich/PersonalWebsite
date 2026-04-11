/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useOrchestrator } from "../../../../lib/AnimationContext";
import { AnimationOrchestrator, useBuildOrchestrator } from "../../../../lib/AnimationOrchestrator";
import { AnimationProvider } from "../../../../lib/AnimationProvider";
import { ImplosionCore } from "./implosion/ImplosionCore";
import { ImplosionDust } from "./implosion/ImplosionDust";
import { ImplosionRings } from "./implosion/ImplosionRings";
import { ImplosionRipples } from "./implosion/ImplosionRipples";
import { ImplosionWormholes } from "./implosion/ImplosionWormholes";
import { useBlackholeSuckSound } from "./implosion/useBlackholeSuckSound";
import { useImplosionSound } from "./implosion/useImplosionSound";

export const Implosion = ({
  skipIntro = false,
  blueDustParticleCount = 400,
  dustParticleCount = 600,
}: {
  skipIntro?: boolean;
  blueDustParticleCount?: number;
  dustParticleCount?: number;
}) => {
  const { size } = useThree();
  const isMobile = size.width / size.height < 1;
  const masterOrchestrator = useOrchestrator();
  const masterProxy = masterOrchestrator.getProxy("implosion_scene");

  const orchestrator = useBuildOrchestrator(() => {
    const o = new AnimationOrchestrator();
    o.setGlobalTiming(masterProxy.duration, 0);

    o.register("implosionSound", 1.0, 0.0);
    o.register("blackhole", 0.8, 0.05);
    o.register("ripples", 0.65, 0.1);
    o.register("dust", 0.85, 0.1);
    o.register("rings", 0.75, 0.05);
    o.register("blueDust", 0.6, 0.2); // <-- Change this to test it instantly!

    return o;
  }, [masterProxy.duration]);

  // Sync internal orchestrator properties to the master proxy!
  useFrame(() => {
    // Master proxy activeT is exactly real-time seconds (0 to 3.0)
    if (masterProxy.activeT >= 0) {
      orchestrator.mainTimeline.time(masterProxy.activeT);
    }
  });

  useImplosionSound(skipIntro, orchestrator);
  useBlackholeSuckSound(skipIntro, orchestrator);

  return (
    <AnimationProvider orchestrator={orchestrator}>
      <group scale={isMobile ? 0.6 : 1}>
        <ImplosionRings />
        <ImplosionCore />
        <ImplosionRipples />
        <ImplosionWormholes count={blueDustParticleCount} />
        <ImplosionDust count={dustParticleCount} />
      </group>
    </AnimationProvider>
  );
};
