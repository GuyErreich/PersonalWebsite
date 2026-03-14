import { useEffect, useState } from 'react';
import { buildImplosionTimeline } from './implosion/ImplosionConfig';
import { ImplosionCore } from './implosion/ImplosionCore';
import { ImplosionRings } from './implosion/ImplosionRings';
import { ImplosionRipples } from './implosion/ImplosionRipples';
import { ImplosionDust } from './implosion/ImplosionDust';
import { ImplosionWormholes } from './implosion/ImplosionWormholes';
import { useImplosionSound } from './implosion/useImplosionSound';

export const Implosion = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    buildImplosionTimeline(skipIntro, () => {
      setIsDone(true);
    });
  }, [skipIntro]);
  
  useImplosionSound(skipIntro, 4.8, 3.0);

  if (isDone) return null;

  return (
    <group>
      <ImplosionRings />
      <ImplosionCore />
      <ImplosionRipples />
      <ImplosionWormholes />
      <ImplosionDust />
    </group>
  );
};
