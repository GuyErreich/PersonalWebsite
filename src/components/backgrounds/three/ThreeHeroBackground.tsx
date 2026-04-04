import { useEffect } from 'react';
import { CameraShake } from './hero/core/CameraShake';
import { ScreenFlash } from './hero/core/ScreenFlash';
import { useCameraRumbleSound } from './hero/core/useCameraRumbleSound';
import { useScreenFlashSound } from './hero/core/useScreenFlashSound';

import { GalaxyCreation } from './hero/GalaxyCreation';
import { Implosion } from './hero/Implosion';
import { FloatingThoughts } from './hero/FloatingThoughts';
import { HyperspaceJump } from './hero/HyperspaceJump';
import { AnimationOrchestrator, useBuildOrchestrator } from '../../../lib/AnimationOrchestrator';
import { AnimationProvider } from '../../../lib/AnimationProvider';

// Empty component to host hooks that require orchestrator context
const CoreSoundFX = ({ skipIntro, orchestrator }: { skipIntro: boolean, orchestrator: AnimationOrchestrator }) => {
  useCameraRumbleSound(skipIntro, orchestrator);
  useScreenFlashSound(skipIntro, orchestrator);
  return null;
};

export const ThreeHeroBackground = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  // We set up a MASTER orchestrator that governs the full 20s timeline for global events
  const orchestrator = useBuildOrchestrator(() => {
    const o = new AnimationOrchestrator();
    o.setGlobalTiming(20.0, 0.0);

    // Register absolute timings for Camera Shake
    o.registerAbsolute("camera-dolly",   4.8, 0.0);
    o.registerAbsolute("camera-suck",    2.0, 4.8);
    o.registerAbsolute("camera-climax",  1.0, 6.8);
    o.registerAbsolute("camera-silence", 0.8, 7.8);
    o.registerAbsolute("camera-bang",    1.4, 8.6); 

    // Register absolute timings for Screen Flashes
    o.registerAbsolute("flash-implosion", 0.8, 4.8);
    o.registerAbsolute("flash-hole",      0.5, 7.3);
    o.registerAbsolute("flash-silence",   0.8, 7.8);
    o.registerAbsolute("flash-bang",      1.4, 8.6);
    o.registerAbsolute("flash-jump",      0.45, 15.45);

    // Register absolute timings for sub-components that read from master orchestrator
    o.registerAbsolute("hyperspace", 1.3, 14.2); // 14.2 to 15.5
    o.registerAbsolute("thoughts", 4.0, 0.5); // Provide 0.5 to 4.5 proxy for floating thoughts
    o.registerAbsolute("implosion_scene", 4.0, 3.8);
    o.registerAbsolute("galaxy_scene", 3.9, 8.0); // Starts slightly earlier to sync with the bang flash

    return o;
  });

  useEffect(() => {
    orchestrator.playScenario(skipIntro);
  }, [skipIntro, orchestrator]);

  return (
    <>
      <fog attach="fog" args={['#111827', 10, 25]} />
      <ambientLight intensity={0.2} />
      
      {/* 3 Point Lighting System */}
      <directionalLight position={[10, 10, 5]} intensity={1} color="#3b82f6" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#10b981" />
      <pointLight position={[0, 0, 0]} intensity={3} color="#f59e0b" distance={20} />

      <AnimationProvider orchestrator={orchestrator}>
        <CameraShake />
        <ScreenFlash />
        <CoreSoundFX skipIntro={skipIntro} orchestrator={orchestrator} />
        
        <FloatingThoughts skipIntro={skipIntro} />
        <HyperspaceJump skipIntro={skipIntro} />

        {/* Now Implosion and GalaxyCreation are wrapped in the same AnimationProvider */}
        <Implosion skipIntro={skipIntro} />
        <GalaxyCreation skipIntro={skipIntro} />
      </AnimationProvider>
    </>
  );
};
