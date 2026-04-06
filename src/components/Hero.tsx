import { Github, Linkedin, Mail, ChevronDown } from "lucide-react";

import { useState, useEffect, useRef } from 'react';

import Cookies from 'js-cookie';
import { HyperspaceLever } from "./HyperspaceLever";
import { RocketReplayButton } from "./RocketReplayButton";
import { ReverseHyperspace } from './backgrounds/three/hero/ReverseHyperspace';
import { motion, useMotionValue, useTransform, animate, AnimatePresence, useScroll, useMotionValueEvent, useMotionTemplate } from 'framer-motion';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ThreeHeroBackground } from './backgrounds/three/ThreeHeroBackground';
import { playTagHoverSound, playTagClickSound } from '../lib/sound/interactionSounds';
import { SectionEdge } from './ui/SectionEdge';

const ResponsiveCamera = () => {
  const { camera, size } = useThree();
  
  useEffect(() => {
    const aspect = size.width / size.height;
    
    // Always keep the natural FOV we built the scene with
    (camera as THREE.PerspectiveCamera).fov = 50;
    
    // Default base distance
    let targetZ = 5;
    
    // When the screen is narrow (portrait on mobile), the horizontal view frustum shrinks.
    // Instead of warping the lens (FOV), we simply physically pull the camera backwards 
    // down the Z-axis proportionally to how narrow the screen is.
    if (aspect < 1) {
      // Pull further back more drastically on mobile screens so the entire 
      // width of the animation particles are caught in frame.
      targetZ = 5 * (2.2 / aspect); 
    }
    
    camera.position.z = targetZ;
    camera.updateProjectionMatrix();

  }, [size, camera]);
  
  return null;
};

const TypewriterText = ({ text, delay, duration, className = "" }: { text: string, delay: number, duration: number, className?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) => text.slice(0, latest));

  useEffect(() => {
    const controls = animate(count, text.length, {
      type: "tween",
      delay: delay,
      duration: duration,
      ease: "linear",
    });
    return controls.stop;
  }, [count, text.length, delay, duration]);

  return <motion.span className={className}>{displayText}</motion.span>;
};

const devOpsBadges = ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Docker', 'Helm'];
const gameDevBadges = ['Unity', 'C#', 'Game Feel', 'Shaders', 'Godot'];

export const Hero = () => {
  const [hasCookie] = useState(() => !!Cookies.get('hero_visited'));
  const [skipIntro, setSkipIntro] = useState(hasCookie);
  const [isRewinding, setIsRewinding] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    Cookies.set('hero_visited', 'true', { expires: 7 });
  }, []);

  // Synced Audio/SFX track for the main intro animation
  useEffect(() => {
    // Only play if not rewinding and the intro isn't skipped
    if (isRewinding || skipIntro) return;

    let ctx: AudioContext | null = null;
    let isCancelled = false;

    const initAudio = () => {
      if (isCancelled) return;
      try {
        const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;

        const scheduleTone = (timeOffset: number, freq: number, type: OscillatorType, duration: number, vol: number) => {
           if (!ctx) return;
           const osc = ctx.createOscillator();
           const gain = ctx.createGain();
           osc.type = type;
           osc.frequency.setValueAtTime(freq, now + timeOffset);
           
           gain.gain.setValueAtTime(0, now + timeOffset);
           gain.gain.linearRampToValueAtTime(vol, now + timeOffset + Math.min(0.05, duration * 0.1));
           gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + duration);
           
           osc.connect(gain);
           gain.connect(ctx.destination);
           
           osc.start(now + timeOffset);
           osc.stop(now + timeOffset + duration);
        };
        
        const scheduleNoise = (timeOffset: number, duration: number, vol: number) => {
           if (!ctx) return;
           const bufferSize = ctx.sampleRate * duration;
           const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
           const data = buffer.getChannelData(0);
           for(let i=0; i<bufferSize; i++) data[i] = Math.random() * 2 - 1;
           
           const noise = ctx.createBufferSource();
           noise.buffer = buffer;
           const gain = ctx.createGain();
           
           gain.gain.setValueAtTime(0, now + timeOffset);
           gain.gain.linearRampToValueAtTime(vol, now + timeOffset + duration * 0.1);
           gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + duration);
           
           noise.connect(gain);
           gain.connect(ctx.destination);
           
           noise.start(now + timeOffset);
           noise.stop(now + timeOffset + duration);
        };

        // UI Sounds Start Post-Background Animation
        const uiOffset = 3.0;

        // 3. Big Title Stamp (13.0s)
        scheduleTone(13.0 + uiOffset, 80, 'square', 0.6, 0.2);
        scheduleNoise(13.0 + uiOffset, 0.4, 0.1);

        // 4. Shine Sweep (13.9s)
        scheduleTone(13.9 + uiOffset, 800, 'sine', 1.2, 0.05);
        scheduleTone(13.9 + uiOffset, 1200, 'sine', 1.2, 0.05);

        // 5. Name Fade In (14.1s)
        scheduleTone(14.1 + uiOffset, 400, 'triangle', 0.5, 0.05);
        scheduleTone(14.1 + uiOffset, 600, 'triangle', 0.5, 0.05);

        // 6. Typewriter UI sounds
        for(let i=0; i<25; i++) scheduleTone(14.7 + uiOffset + i*(1.8/25), 600 + (Math.random()*100), 'square', 0.03, 0.015);
        for(let i=0; i<15; i++) scheduleTone(16.7 + uiOffset + i*(1.2/15), 600 + (Math.random()*100), 'square', 0.03, 0.015);
        for(let i=0; i<20; i++) scheduleTone(18.1 + uiOffset + i*(1.6/20), 600 + (Math.random()*100), 'square', 0.03, 0.015);

        // 7. Badges Spawning
        for(let i=0; i<6; i++) scheduleTone(19.8 + uiOffset + i*0.07, 700 + i*40, 'sine', 0.15, 0.04);
        for(let i=0; i<5; i++) scheduleTone(20.3 + uiOffset + i*0.07, 900 + i*40, 'sine', 0.15, 0.04);

        // 8. Social Links popping in
        scheduleTone(20.7 + uiOffset, 440, 'sine', 2.0, 0.05); // A4
        scheduleTone(20.7 + uiOffset, 554, 'sine', 2.0, 0.05); // C#5
        scheduleTone(20.7 + uiOffset, 659, 'sine', 2.0, 0.05); // E5

        // 9. Chevron Down Arrow Ping
        scheduleTone(21.5 + uiOffset, 300, 'triangle', 0.5, 0.04);
        scheduleTone(21.7 + uiOffset, 400, 'triangle', 0.5, 0.04);

      } catch (e) {
        console.warn("Web audio not supported or blocked", e);
      }
    };

    const t = setTimeout(initAudio, 50);

    return () => {
      isCancelled = true;
      clearTimeout(t);
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    };
  }, [isRewinding, skipIntro, animationKey]);

  const handleReplay = () => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (_e) {
      // ignore
    }

    setIsRewinding(true);
    setSkipIntro(false);
    
    // Rewind lasts 2 seconds, then resets
    setTimeout(() => {
      setIsRewinding(false);
      setAnimationKey(prev => prev + 1);
    }, 2000);
  };

  const UI_DELAY_OFFSET = 3.0;
  const getDelay = (baseDelay: number) => Math.max(0, skipIntro ? 0 : baseDelay + UI_DELAY_OFFSET);

  const heroSectionRef = useRef<HTMLElement>(null);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', () => {
    if (!heroSectionRef.current) return;
    setIsHeroVisible(heroSectionRef.current.getBoundingClientRect().bottom > 0);
  });

  // Scroll-driven exit animations
  const { scrollYProgress: heroExitProgress } = useScroll({
    target: heroSectionRef,
    // 0 = hero fills viewport, 1 = hero bottom reaches viewport top
    offset: ['start start', 'end start'],
  });
  // Iris aperture: transparent centre shrinks to a pinhole then seals
  const irisRadius    = useTransform(heroExitProgress, [0.48, 0.97], [100, 0]);
  // Content defocus: card blurs as the iris closes in
  const contentBlur   = useTransform(heroExitProgress, [0.63, 0.93], [0, 10]);
  // Final black fill once the iris is nearly closed
  const finalBlack    = useTransform(heroExitProgress, [0.93, 0.99], [0, 1]);

  // Aperture ring glow — cyan/violet halo that tracks the iris edge
  const glowRadius    = useTransform(heroExitProgress, [0.48, 0.97], [104, 1]);
  const glowOpacity   = useTransform(heroExitProgress, [0.48, 0.68, 0.93], [0, 1, 0]);
  // Chromatic aberration — R channel slightly larger, B slightly smaller; splits as iris tightens
  const chromaR       = useTransform(heroExitProgress, [0.48, 0.97], [102, 0.5]);
  const chromaB       = useTransform(heroExitProgress, [0.48, 0.97], [98,  0]);
  const chromaOpacity = useTransform(heroExitProgress, [0.48, 0.72, 0.93], [0, 0.7, 0]);
  // Central bloom — brief wormhole-collapse light pulse
  const bloomOpacity  = useTransform(heroExitProgress, [0.48, 0.63, 0.82], [0, 1, 0]);
  const bloomRadius   = useTransform(heroExitProgress, [0.48, 0.82], [5, 26]);
  // Aperture blades — 6-blade conic shutter that rotates as the iris closes
  const bladeRotate   = useTransform(heroExitProgress, [0.48, 0.97], [0, 44]);
  const bladeOpacity  = useTransform(heroExitProgress, [0.48, 0.62, 0.93], [0, 0.22, 0]);

  const irisGradient      = useMotionTemplate`radial-gradient(${irisRadius}% ${irisRadius}% at 50% 42%, transparent 60%, rgba(17,24,39,0.98) 100%)`;
  const glowGradient      = useMotionTemplate`radial-gradient(${glowRadius}% ${glowRadius}% at 50% 42%, transparent 55%, rgba(80,210,255,0.6) 61%, rgba(180,110,255,0.35) 67%, transparent 75%)`;
  const chromaRGradient   = useMotionTemplate`radial-gradient(${chromaR}% ${chromaR}% at 50% 42%, transparent 60%, rgba(255,60,80,0.22) 100%)`;
  const chromaBGradient   = useMotionTemplate`radial-gradient(${chromaB}% ${chromaB}% at 50% 42%, transparent 60%, rgba(60,120,255,0.22) 100%)`;
  const bloomGradient     = useMotionTemplate`radial-gradient(${bloomRadius}% ${bloomRadius}% at 50% 42%, rgba(210,240,255,0.9) 0%, rgba(130,195,255,0.45) 50%, transparent 100%)`;
  const contentBlurFilter = useMotionTemplate`blur(${contentBlur}px)`;
  // Dark cover fades IN over the galaxy before the iris starts — no opacity on the WebGL canvas
  const bgCoverOpacity = useTransform(heroExitProgress, [0.32, 0.50], [0, 1]);

  return (
    <section id="about" className="section-hero" ref={heroSectionRef}>
      {/* Replay Background Animation Lever - Desktop Only (Floating) */}
      <div
        id="lever-panel"
        className="hidden min-[1300px]:block absolute inset-0 pointer-events-none z-[50]"
      >
        <HyperspaceLever key={`lever-${animationKey}`} onActivate={handleReplay} getDelay={getDelay} skipIntro={skipIntro} isVisible={isHeroVisible && !isRewinding} />
      </div>
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
        <AnimatePresence mode="wait">
          {isRewinding ? (
            <motion.div
              key="rewind"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 h-full w-full"
            >
              <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ResponsiveCamera />
                <ReverseHyperspace />
              </Canvas>
              <motion.div 
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1] }} 
                transition={{ duration: 2, times: [0, 0.9, 1] }}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`bg-${animationKey}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0 }}
              className="absolute inset-0 h-full w-full"
            >
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ResponsiveCamera />
                <ThreeHeroBackground skipIntro={skipIntro} />
              </Canvas>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Dark cover — fades in before iris, hides the galaxy without touching WebGL compositor */}
      <motion.div
        className="absolute inset-0 z-[56] pointer-events-none"
        style={{ opacity: bgCoverOpacity, background: '#111827' }}
      />
      {/* Readability overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900/40 via-transparent to-transparent pointer-events-none" />
      {/* Hero → GameDev shaped edge — jagged alien terrain silhouette */}
      <SectionEdge variant="terrain" fillColor="#111827" height={72} waveAmp={2.0} waveFreq={1.7} stormAmp={1.5} stormFreq={6} className="z-[60]" />

      {/* ── Scroll-exit iris overlay stack ─────────────────────────────── */}
      {/* Layer 1: 6-blade rotating aperture shutter — visible through the iris hole */}
      <motion.div
        className="absolute inset-0 z-[57] pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg at 50% 42%, rgba(140,200,255,0.07) 0deg, transparent 30deg, rgba(140,200,255,0.07) 60deg, transparent 90deg, rgba(140,200,255,0.07) 120deg, transparent 150deg, rgba(140,200,255,0.07) 180deg, transparent 210deg, rgba(140,200,255,0.07) 240deg, transparent 270deg, rgba(140,200,255,0.07) 300deg, transparent 330deg)',
          rotate: bladeRotate,
          transformOrigin: '50% 42%',
          opacity: bladeOpacity,
        }}
      />
      {/* Layer 2: Chromatic aberration — R channel outside, B channel inside */}
      <motion.div
        className="absolute inset-0 z-[58] pointer-events-none mix-blend-screen"
        style={{ background: chromaRGradient, opacity: chromaOpacity }}
      />
      <motion.div
        className="absolute inset-0 z-[58] pointer-events-none mix-blend-screen"
        style={{ background: chromaBGradient, opacity: chromaOpacity }}
      />
      {/* Layer 3: Main iris vignette */}
      <motion.div
        className="absolute inset-0 z-[59] pointer-events-none"
        style={{ background: irisGradient }}
      />
      {/* Layer 4: Aperture ring glow — cyan/violet halo tracks the iris edge */}
      <motion.div
        className="absolute inset-0 z-[60] pointer-events-none"
        style={{ background: glowGradient, opacity: glowOpacity }}
      />
      {/* Layer 5: Central bloom — wormhole-collapse light burst */}
      <motion.div
        className="absolute inset-0 z-[61] pointer-events-none"
        style={{ background: bloomGradient, opacity: bloomOpacity }}
      />
      {/* Layer 6: Final black seal */}
      <motion.div
        className="absolute inset-0 z-[62] pointer-events-none"
        style={{ opacity: finalBlack, background: '#111827' }}
      />
      {/* ──────────────────────────────────────────────────────────────── */}

      {/* Padding wrapper — outside the border so padding doesn't affect border thickness */}
      <AnimatePresence>
        {!isRewinding && (
          <motion.div
            key={`content-${animationKey}`}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="card-responsive-wrapper" style={{ perspective: '1200px', filter: contentBlurFilter }}
          >
      {/* Animated Gradient Border Wrapper */}
      <motion.div
        initial={{ 
          opacity: 0, 
          scale: 0.01, 
          z: -2000, 
          y: 200, 
          rotateX: 45, 
          filter: 'brightness(5) blur(20px)' 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          z: 0, 
          y: 0, 
          rotateX: 0, 
          filter: 'brightness(1) blur(0px)' 
        }}
        transition={{ 
          delay: getDelay(12.5), 
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 15,
          mass: 0.8
        }}
        className="relative rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.2)] md:shadow-[0_0_80px_rgba(59,130,246,0.3)] transform-gpu"
      >
        {/* Spinner is 200% size centered on card so rotation axis = card center, clipped by overflow-hidden */}
        <div
          className="absolute animate-spin-slow pointer-events-none"
          style={{
            inset: '-100%', // Increased negative inset so it extends much further past corners even on tall/narrow screens
            background: 'conic-gradient(from 0deg, #3b82f6, #7c3aed, #10b981, #f59e0b, #3b82f6)',
            opacity: 0.75,
          }}
        />
        {/* Soft bloom copy behind for glow depth */}
        <div
          className="absolute animate-spin-slow pointer-events-none blur-lg"
          style={{
            inset: '-100%', // Increased negative inset
            background: 'conic-gradient(from 0deg, #3b82f6, #7c3aed, #10b981, #f59e0b, #3b82f6)',
            opacity: 0.2,
          }}
        />

        {/* Card body — unified opacity mapping across breakpoints */}
        <motion.div
          initial={{ y: 0, scale: 1 }}
          animate={{
            y: [0, 20, -6, 0],
            scale: [1, 0.94, 1.02, 1],
          }}
          transition={skipIntro ? { duration: 0 } : {
            duration: 0.6,
            delay: getDelay(13.2),
            times: [0, 0.08, 0.4, 1],
            ease: "easeInOut"
          }}
          style={{ transformOrigin: 'bottom center', width: 'calc(100% - 3px)', height: 'calc(100% - 3px)' }}
          className="glass-card-body"
        >
          
          {/* Replay Background Animation Lever - Tablet/Medium screens (Inline, bottom right) */}
          <motion.div 
            id="lever-panel-mobile" 
            className={`lever-inline-wrapper ${isRewinding ? 'pointer-events-none' : 'pointer-events-auto'}`}
            animate={{ opacity: isRewinding ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <HyperspaceLever key={`lever-inline-${animationKey}`} onActivate={handleReplay} getDelay={getDelay} skipIntro={skipIntro} isInline={true} className="flex items-center gap-3 bg-[#0a0f1a]/80 backdrop-blur-xl border-[2px] border-cyan-900/40 rounded-2xl p-3 shadow-[0_0_15px_rgba(0,0,0,0.8)] scale-[0.45] origin-bottom-right" />
          </motion.div>

          {/* Simple Replay Button - Phones only (< 640px) to save space */}
          <motion.div
              className={`sm:hidden absolute top-4 right-4 z-50 flex ${isRewinding ? 'pointer-events-none' : 'pointer-events-auto'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isRewinding ? { opacity: 0 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: getDelay(14.5) }}
            >
              <RocketReplayButton onReplay={handleReplay} />
            </motion.div>

          {/* Big Title Tagline - Stamps in first */}
          <motion.h1
            initial={{ opacity: 0, scale: 5, y: -180, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.2, delay: getDelay(13.0), ease: 'easeIn' }}
            className="hero-title"
            style={{ transformOrigin: 'center center' }}
          >
            {/* Base static gradient text */}
            <span
              className="block text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #7c3aed)',
              }}
            >
              Engineer. Developer. Creator.
            </span>

            {/* White sweep / shine layer perfectly overlaid */}
            <motion.span
              initial={{ backgroundPosition: '200% 0', opacity: 0 }}
              animate={{ backgroundPosition: '-50% 0', opacity: 1 }}
              transition={{ 
                backgroundPosition: { duration: 1.2, delay: getDelay(13.9), ease: 'easeInOut' },
                opacity: { duration: 0.1, delay: getDelay(13.9) } 
              }}
              className="absolute inset-0 block text-transparent bg-clip-text pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(120deg, transparent 40%, rgba(255, 255, 255, 1) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
              aria-hidden="true"
            >
              Engineer. Developer. Creator.
            </motion.span>
          </motion.h1>

          {/* Name with cursor blink - fades in after shine */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: getDelay(14.1) }}
            className="hero-subtitle"
          >
            Hello, I'm <span className="text-white font-bold">Guy Erreich</span>
          </motion.h2>

          {/* Paragraph — staggered typing style line by line, sharing a jumping cursor */}
          <div className="hero-paragraph-box">
            <div className="w-full text-center space-y-1.5 sm:space-y-2 md:space-y-[1.5vh]">
              <p className="relative inline-flex items-center justify-center min-h-[28px] sm:min-h-[30px]">
                <TypewriterText text="DevOps engineer specializing in AWS, Kubernetes, Terraform, & CI/CD." delay={getDelay(14.7)} duration={1.8} />
                {/* Cursor jumps to line 1 */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={skipIntro ? { opacity: 0 } : { opacity: [0, 1, 0, 1, 0] }}
                   transition={{ delay: getDelay(14.7), duration: 1.8, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
              
              <p className="relative inline-flex items-center justify-center min-h-[28px] sm:min-h-[30px]">
                <TypewriterText text="Focused on reliability and clean architecture—by day." delay={getDelay(16.7)} duration={1.2} />
                {/* Cursor jumps to line 2 */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={skipIntro ? { opacity: 0 } : { opacity: [0, 1, 0, 1, 0] }}
                   transition={{ delay: getDelay(16.7), duration: 1.2, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
              
              <p className="relative inline-flex items-center justify-center min-h-[28px] sm:min-h-[30px]">
                <TypewriterText text="Game developer passionate about game feel & player experience." delay={getDelay(18.1)} duration={1.6} />
                {/* Cursor jumps to line 3 and then disappears after typing */}
                <motion.span 
                   initial={{ opacity: 0 }}
                   animate={skipIntro ? { opacity: 0 } : { opacity: [0, 1, 0, 1, 0] }}
                   transition={{ delay: getDelay(18.1), duration: 1.6, times: [0, 0.25, 0.5, 0.75, 1], ease: "linear" }}
                   className="absolute -right-3 w-[0.5em] h-[1em] bg-white align-middle"
                />
              </p>
            </div>
          </div>

          {/* Tech Badge Rows */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: getDelay(19.8) }}
            className="mb-4 md:mb-[2vh] space-y-2 md:space-y-[1.5vh]"
          >
            {/* DevOps badges — blue toned */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {devOpsBadges.map((badge, i) => (
                <motion.button
                  type="button"
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={playTagHoverSound}
                  onClick={playTagClickSound}
                  transition={{ duration: 0.3, delay: getDelay(19.8) + i * 0.07 }}
                  className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-colors cursor-pointer"
                >
                  {badge}
                </motion.button>
              ))}
            </div>
            {/* GameDev badges — emerald/purple toned */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {gameDevBadges.map((badge, i) => (
                <motion.button
                  type="button"
                  key={badge}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={playTagHoverSound}
                  onClick={playTagClickSound}
                  transition={{ duration: 0.3, delay: getDelay(20.3) + i * 0.07 }}
                  className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                >
                  {badge}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: getDelay(20.7) }}
            className="flex justify-center space-x-6"
          >
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playTagHoverSound}
              onClick={playTagClickSound}
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-3 rounded-full"
            >
              <span className="sr-only">GitHub</span>
              <Github className="w-7 h-7" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors bg-gray-800 hover:bg-[#0077b5]/20 p-3 rounded-full"
              style={{ ['--hover-color' as string]: '#0077b5' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#0077b5';
                playTagHoverSound();
              }}
              onMouseLeave={e => (e.currentTarget.style.color = '')}
              onClick={playTagClickSound}
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="w-7 h-7" />
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.2, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onMouseEnter={playTagHoverSound}
              onClick={playTagClickSound}
              href="mailto:hello@example.com"
              className="text-gray-400 hover:text-emerald-400 transition-colors bg-gray-800 hover:bg-emerald-500/10 p-3 rounded-full"
            >
              <span className="sr-only">Email</span>
              <Mail className="w-7 h-7" />
            </motion.a>
          </motion.div>
        </motion.div>
      </motion.div>
      </motion.div>
        )}
      </AnimatePresence>
      {/* end padding wrapper */}
      
      <AnimatePresence>
        {!isRewinding && (
          <motion.div 
            key={`chevron-${animationKey}`}
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: getDelay(21.5), duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10 hidden md:block"
      >
        <a href="#gamedev" className="text-gray-400 hover:text-white bg-gray-800/80 rounded-full p-2 block">
          <ChevronDown className="w-6 h-6" />
        </a>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
