import { useEffect } from 'react';

export const FloatingThoughtsAudio = ({ skipIntro = false, thoughtsLength }: { skipIntro?: boolean; thoughtsLength: number }) => {
  useEffect(() => {
    if (skipIntro) return;

    let ctx: AudioContext | null = null;
    let isCancelled = false;

    const t = setTimeout(() => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        
        // Ethereal subtle chimes mapping to the floating texts spawning
        for (let i = 0; i < thoughtsLength; i++) {
            const delay = i * 0.6; // Matches the stagger from useMemo
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'sine';
            // Increase pitch for each subsequent thought that appears
            osc.frequency.setValueAtTime(300 + (i * 150), now + delay);
            
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(0.04, now + delay + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 2.0);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now + delay);
            osc.stop(now + delay + 2.0);
        }
      } catch {}
    }, 50);

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== 'closed') ctx.close().catch(()=>{});
    }
  }, [skipIntro, thoughtsLength]);
  return null;
};
