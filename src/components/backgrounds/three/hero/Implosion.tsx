import { useEffect, useState, useMemo } from 'react';
import { ImplosionCore } from './implosion/ImplosionCore';
import { ImplosionRings } from './implosion/ImplosionRings';
import { ImplosionRipples } from './implosion/ImplosionRipples';
import { ImplosionDust } from './implosion/ImplosionDust';
import { ImplosionWormholes } from './implosion/ImplosionWormholes';
import { useImplosionSound } from './implosion/useImplosionSound';
import { AnimationOrchestrator } from '../../../../lib/AnimationOrchestrator';
import { AnimationProvider } from '../../../../lib/AnimationContext';

// Base timing configs
const IMPLOSION_DURATION = 3.0;
const ENTRY_DELAY = 4.8;

export const Implosion = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const [isDone, setIsDone] = useState(false);

  // Initialize the orchestrator globally once per mount
  const orchestrator = useMemo(() => {
    const o = new AnimationOrchestrator();
    o.setGlobalTiming(IMPLOSION_DURATION, ENTRY_DELAY);
    
    // Config properties natively instantiated for the subcomponents to hook into!
    o.register("implosionSound", 1.0,  0.00);

    o.register("blackhole",      0.8,  0.05);
    o.register("ripples",        0.82, 0.10);
    o.register("dust",           0.95, 0.00);
    o.register("rings",          0.75, 0.05);
    o.register("blueDust",       0.8,  0.00);

    return o;
  }, []);

  useEffect(() => {
    orchestrator.playScenario(skipIntro, () => {
      setIsDone(true);
    });
  }, [skipIntro, orchestrator]);
  
  // SFX hook autonomously reads the "implosionSound" proxy internally!
  useImplosionSound(skipIntro, orchestrator);

  if (isDone) return null;

  return (
    <AnimationProvider orchestrator={orchestrator}>
      <group>
        <ImplosionRings />
        <ImplosionCore />
        <ImplosionRipples />
        <ImplosionWormholes />
        <ImplosionDust />
      </group>
    </AnimationProvider>
  );
};
