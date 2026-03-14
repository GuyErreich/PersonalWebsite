import { useEffect } from 'react';

export const useImplosionSound = (skipIntro: boolean, entryDelay: number, implosionDuration: number = 3.0) => {
  useEffect(() => {
    if (skipIntro) return;
    
    let ctx: AudioContext | null = null;
    let isCancelled = false;

    const t = setTimeout(() => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;

        // Big implosion drone/suck sound starting at right now
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + implosionDuration); // pitch down heavily
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + implosionDuration * (2.0/3.0)); // gets louder as it sucks in
        gain.gain.linearRampToValueAtTime(0, now + implosionDuration); 

        // Rumbly noise 
        const bufferSize = ctx.sampleRate * implosionDuration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(100, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(800, now + implosionDuration * (2.5/3.0)); // opens up
        noiseFilter.frequency.exponentialRampToValueAtTime(40, now + implosionDuration); // closes abruptly

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + implosionDuration * (2.5/3.0));
        noiseGain.gain.linearRampToValueAtTime(0, now + implosionDuration * (2.8/3.0));

        osc.connect(gain);
        gain.connect(ctx.destination);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(ctx.destination);

        osc.start(now);
        noise.start(now);

        osc.stop(now + implosionDuration + 0.2);
        noise.stop(now + implosionDuration + 0.2);
      } catch(e) {}
    }, entryDelay * 1000);

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== 'closed') ctx.close().catch(()=>{});
    };
  }, [skipIntro, entryDelay, implosionDuration]);
};
