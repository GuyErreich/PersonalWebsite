import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationOrchestrator } from '../../../../../lib/AnimationOrchestrator';

// ============================================================================
// CHOOSE YOUR TRANSITION SOUND STYLE HERE
// Options:
// "CINEMATIC"     - (Current) Deep sub bass, glassy sweep, and a cinematic noise riser.
// "WARP"          - Rapid sci-fi "reverse gravity" frequency sweep with stuttering at the end.
// "DIGITAL_DRAIN" - Glitchy, cyberpunk data-deletion sound.
// "VOID_CHOIR"    - Ghostly/ethereal voices turning into a dissonant descending chord.
// ============================================================================
type SoundStyleType = "CINEMATIC" | "WARP" | "DIGITAL_DRAIN" | "VOID_CHOIR";
// <-- CHANGE THE STRING BELOW TO TRY DIFFERENT SOUNDS
const SOUND_STYLE = 'VOID_CHOIR' as SoundStyleType;

export const useBlackholeSuckSound = (skipIntro: boolean, orchestrator: AnimationOrchestrator) => {
  const proxy = orchestrator.getProxy("blackhole");
  const played = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useFrame(() => {
    if (skipIntro) return;
    
    if (!played.current && proxy.activeT > 0) {
      played.current = true;
      try {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        const ctx = audioCtxRef.current || new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const duration = proxy.duration;

        // --- MASTER COMPRESSOR TO PREVENT CLIPPING ---
        const masterComp = ctx.createDynamicsCompressor();
        masterComp.threshold.value = -10;
        masterComp.ratio.value = 12;
        masterComp.connect(ctx.destination);

        switch (SOUND_STYLE) {
          case "CINEMATIC": {
            // 1. Ethereal Glassy Sweep
            const glassOsc = ctx.createOscillator();
            glassOsc.type = 'triangle';
            glassOsc.frequency.setValueAtTime(600, now);
            glassOsc.frequency.exponentialRampToValueAtTime(2500, now + duration);
            
            const glassGain = ctx.createGain();
            glassGain.gain.setValueAtTime(0, now);
            glassGain.gain.linearRampToValueAtTime(0.15, now + duration * 0.6);
            glassGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            glassOsc.connect(glassGain);
            glassGain.connect(masterComp);
            glassOsc.start(now);
            glassOsc.stop(now + duration);

            // 2. Cosmic Void / Sub-bass pull
            const subOsc = ctx.createOscillator();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(50, now);
            subOsc.frequency.exponentialRampToValueAtTime(10, now + duration);
            
            const subGain = ctx.createGain();
            subGain.gain.setValueAtTime(0, now);
            subGain.gain.linearRampToValueAtTime(0.7, now + duration * 0.8);
            subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            subOsc.connect(subGain);
            subGain.connect(masterComp);
            subOsc.start(now);
            subOsc.stop(now + duration);

            // 3. Tension Whoosh
            const bufferSize = ctx.sampleRate * duration;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const noise = ctx.createBufferSource();
            noise.buffer = noiseBuffer;

            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.Q.value = 1.5;
            noiseFilter.frequency.setValueAtTime(100, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(4000, now + duration);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.2, now + duration * 0.8);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterComp);
            noise.start(now);
            noise.stop(now + duration);
            break;
          }

          case "WARP": {
            // Rapid sci-fi gravity warp building up to the singularity
            const warpOsc1 = ctx.createOscillator();
            const warpOsc2 = ctx.createOscillator();
            warpOsc1.type = 'sine';
            warpOsc2.type = 'sine';
            
            // Dissonant pairing rising rapidly
            warpOsc1.frequency.setValueAtTime(80, now);
            warpOsc1.frequency.exponentialRampToValueAtTime(3000, now + duration);
            warpOsc2.frequency.setValueAtTime(85, now);
            warpOsc2.frequency.exponentialRampToValueAtTime(3100, now + duration);

            const warpGain = ctx.createGain();
            warpGain.gain.setValueAtTime(0, now);
            warpGain.gain.linearRampToValueAtTime(0.4, now + duration * 0.5);
            warpGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

            // Stutter effect towards the end using an LFO on an AM node
            const amOsc = ctx.createOscillator();
            amOsc.type = 'square';
            amOsc.frequency.setValueAtTime(4, now);
            amOsc.frequency.exponentialRampToValueAtTime(40, now + duration); // Gets faster
            
            const amGain = ctx.createGain();
            amGain.gain.setValueAtTime(1, now);
            // Engage stutter heavily at the end
            amGain.gain.linearRampToValueAtTime(1, now + duration * 0.7);
            
            // Connections
            warpOsc1.connect(warpGain);
            warpOsc2.connect(warpGain);
            
            const finalStutterGain = ctx.createGain();
            finalStutterGain.gain.value = 0;
            
            // Map AM Osc to Gain 0-1 for stutter
            const amOffset = ctx.createGain();
            amOsc.connect(amOffset);
            amOffset.gain.value = 0.5; // Scale -1-1 to -0.5-0.5
            // The stutter effect
            amOffset.connect(finalStutterGain.gain);

            warpGain.connect(finalStutterGain);
            finalStutterGain.connect(masterComp);

            warpOsc1.start(now);
            warpOsc2.start(now);
            amOsc.start(now);
            warpOsc1.stop(now + duration);
            warpOsc2.stop(now + duration);
            amOsc.stop(now + duration);
            break;
          }

          case "DIGITAL_DRAIN": {
            // Glitchy / Data Deletion cyberpunk style
            for (let i = 0; i < 5; i++) {
              const glitchOsc = ctx.createOscillator();
              glitchOsc.type = i % 2 === 0 ? 'square' : 'sawtooth';
              
              const startFreq = 2000 + Math.random() * 3000; // High frequency
              glitchOsc.frequency.setValueAtTime(startFreq, now);
              // Drops rapidly off a cliff randomly over the duration
              glitchOsc.frequency.exponentialRampToValueAtTime(20, now + duration * (0.5 + Math.random() * 0.5));
              
              const glitchGain = ctx.createGain();
              glitchGain.gain.setValueAtTime(0, now);
              // Burst in quickly, fade out cleanly
              glitchGain.gain.linearRampToValueAtTime(0.05, now + 0.1);
              glitchGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

              // LFO to make it choppy
              const chopper = ctx.createOscillator();
              chopper.type = 'square';
              chopper.frequency.value = 15 + Math.random() * 20; // 15-35hz chop
              const chopGain = ctx.createGain();
              chopGain.gain.value = 0.5;
              
              // Wiring Chopper -> volume
              chopper.connect(chopGain);
              glitchOsc.connect(chopGain);
              chopGain.connect(glitchGain);
              glitchGain.connect(masterComp);

              glitchOsc.start(now);
              chopper.start(now);
              glitchOsc.stop(now + duration);
              chopper.stop(now + duration);
            }
            break;
          }

          case "VOID_CHOIR": {
            // Spooky dissonant "choral" chord that detunes downwards
            const pitches = [400, 480, 560]; // Minor/spooky chord
            pitches.forEach((pitch, i) => {
              const choirOsc = ctx.createOscillator();
              choirOsc.type = 'triangle';
              choirOsc.frequency.setValueAtTime(pitch, now);
              
              // Drastic downward detune
              choirOsc.frequency.exponentialRampToValueAtTime(pitch / 4, now + duration);

              const choirGain = ctx.createGain();
              choirGain.gain.setValueAtTime(0, now);
              choirGain.gain.linearRampToValueAtTime(0.15, now + duration * 0.4);
              choirGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

              // Soft LFO for vibrato
              const vibrato = ctx.createOscillator();
              vibrato.frequency.value = 6 + i; // slightly different vibrato per string
              const vibratoGain = ctx.createGain();
              vibratoGain.gain.value = 10;
              vibrato.connect(vibratoGain);
              vibratoGain.connect(choirOsc.frequency);

              choirOsc.connect(choirGain);
              choirGain.connect(masterComp);

              choirOsc.start(now);
              vibrato.start(now);
              choirOsc.stop(now + duration);
              vibrato.stop(now + duration);
            });
            break;
          }
        }

      } catch { /* ignore */  /* ignore */ 
        console.error("Blackhole suck sound error:");
      }
    }
  });

  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);
};
