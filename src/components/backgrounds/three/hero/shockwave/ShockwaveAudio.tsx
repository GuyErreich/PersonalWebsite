import { useEffect } from "react";

export const ShockwaveAudio = ({ skipIntro = false }: { skipIntro?: boolean }) => {
  useEffect(() => {
    if (skipIntro) return;

    let ctx: AudioContext | null = null;
    let isCancelled = false;

    // Trigger at 9.2s where the shockwave mesh scaling starts
    const t = setTimeout(() => {
      if (isCancelled) return;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === "suspended") ctx.resume();

        const now = ctx.currentTime;

        // Layer 1: The Core Detonation (Deep, physical punch like a massive kick drum)
        const subOsc1 = ctx.createOscillator();
        const subOsc2 = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc1.type = "sine";
        subOsc2.type = "triangle"; // Triangle adds a slightly harder mid-tone "knock"

        // Pitch envelope: Starts high and dives instantly to create a concussive "thud"
        subOsc1.frequency.setValueAtTime(250, now);
        subOsc1.frequency.exponentialRampToValueAtTime(20, now + 0.15);
        subOsc1.frequency.linearRampToValueAtTime(1, now + 8.0);

        subOsc2.frequency.setValueAtTime(200, now);
        subOsc2.frequency.exponentialRampToValueAtTime(15, now + 0.2);
        subOsc2.frequency.linearRampToValueAtTime(1, now + 8.0);

        // Extreme punch gain
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(5.0, now + 0.02); // Maximum blunt force
        subGain.gain.exponentialRampToValueAtTime(0.8, now + 1.2);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0);

        // Layer 2: The Erupting Core (Distorted Low-End)
        const tearOsc = ctx.createOscillator();
        const tearGain = ctx.createGain();
        tearOsc.type = "square"; // Square wave instead of Sawtooth to prevent bright buzzing

        tearOsc.frequency.setValueAtTime(35, now);
        tearOsc.frequency.linearRampToValueAtTime(5, now + 5.0); // Dropping to absolute rumbling clicks

        tearGain.gain.setValueAtTime(0, now);
        tearGain.gain.linearRampToValueAtTime(2.0, now + 0.1);
        tearGain.gain.exponentialRampToValueAtTime(0.2, now + 2.5);
        tearGain.gain.linearRampToValueAtTime(0, now + 5.0);

        // Muffle the square wave heavily so it sounds like deep pressure, not a synth
        const tearFilter = ctx.createBiquadFilter();
        tearFilter.type = "lowpass";
        tearFilter.Q.value = 5;
        tearFilter.frequency.setValueAtTime(300, now);
        tearFilter.frequency.exponentialRampToValueAtTime(30, now + 3.5);

        // Layer 3: Expanding Shockwave (Brownian Noise - heavy and dark like thunder, NO white noise sand)
        const bufferSize = ctx.sampleRate * 8.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          // Integrate white noise to create Brown Noise (favors low-end rumble, kills high-end hiss)
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.04 * white) / 1.04;
          lastOut = data[i];
          data[i] *= 3.5; // Compensate for volume drop from integration
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = "lowpass"; // Keep it strictly lowpass
        noiseFilter.Q.value = 0.5;

        // Keep the rumble dark and muffled (max 500Hz, no 3000Hz static allowed)
        noiseFilter.frequency.setValueAtTime(500, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 1.0);
        noiseFilter.frequency.linearRampToValueAtTime(10, now + 8.0);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(2.5, now + 0.1); // Heavy thunderous volume
        noiseGain.gain.exponentialRampToValueAtTime(0.8, now + 2.5);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 8.0);

        // Heavy Master Compressor to glue it into one single concussive boom
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 5;
        compressor.ratio.value = 20;
        compressor.attack.value = 0.001; // Crush instantly
        compressor.release.value = 0.3;

        // Routing
        subOsc1.connect(subGain);
        subOsc2.connect(subGain);
        subGain.connect(compressor);

        tearOsc.connect(tearFilter);
        tearFilter.connect(tearGain);
        tearGain.connect(compressor);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(compressor);

        compressor.connect(ctx.destination);

        subOsc1.start(now);
        subOsc2.start(now);
        tearOsc.start(now);
        noise.start(now);

        subOsc1.stop(now + 8.1);
        subOsc2.stop(now + 8.1);
        tearOsc.stop(now + 5.1);
        noise.stop(now + 8.1);
      } catch {}
    }, 9200);

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
    };
  }, [skipIntro]);
  return null;
};
