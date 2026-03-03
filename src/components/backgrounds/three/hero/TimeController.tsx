import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export const TimeController = ({ skipIntro }: { skipIntro: boolean }) => {
  const { clock } = useThree();
  useEffect(() => {
    if (skipIntro) {
      clock.elapsedTime = 20;
      clock.startTime = performance.now() - 20000;
    } else {
      clock.elapsedTime = 0;
      clock.startTime = performance.now();
    }
  }, [skipIntro, clock]);
  return null;
};
