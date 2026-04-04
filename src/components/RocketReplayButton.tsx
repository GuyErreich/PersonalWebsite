import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';
import { playHoverSound } from '../lib/sound/interactionSounds';

interface RocketReplayButtonProps {
  onReplay: () => void;
}

export const RocketReplayButton = ({ onReplay }: RocketReplayButtonProps) => {
  const [isMobileLaunching, setIsMobileLaunching] = useState(false);
  const [isMobileHovering, setIsMobileHovering] = useState(false);
  const launchCtxRef = useRef<AudioContext | null>(null);
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timeouts = timeoutRefs.current;
    return () => {
      timeouts.forEach(clearTimeout);
      if (launchCtxRef.current && launchCtxRef.current.state !== 'closed') {
        launchCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleLaunch = () => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      launchCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
      
      // Deep Exhaust Roar
      const bufferSize = ctx.sampleRate * 2.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(3000, ctx.currentTime);
      noiseFilter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 1.2);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      setTimeout(() => { ctx.close().catch(() => {}); launchCtxRef.current = null; }, 2000);
    } catch {}
    
    // Trigger local launch animation, delay the overall replay and reset
    setIsMobileLaunching(true);
    const t1 = setTimeout(() => {
      onReplay();
      const t2 = setTimeout(() => setIsMobileLaunching(false), 2000);
      timeoutRefs.current.push(t2);
    }, 600);
    timeoutRefs.current.push(t1);
  };

  const handleMouseEnter = () => {
    setIsMobileHovering(true);
    if (!isMobileLaunching) playHoverSound();
  };

  const handleMouseLeave = () => {
    setIsMobileHovering(false);
  };

  return (
    <motion.button
      id="replay-button-phone"
      className="relative flex items-center justify-center flex-col h-12 w-12 rounded-full bg-cyan-950/80 backdrop-blur-md border-[2px] border-b-cyan-500 border-t-cyan-300 text-cyan-50 shadow-[0_4px_15px_rgba(6,182,212,0.4)] overflow-visible group"
      onClick={handleLaunch}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title="Engage Timeshift"
      animate={{ 
        y: [0, -4, 0],
        boxShadow: ["0px 10px 20px rgba(6,182,212,0.2)", "0px 15px 30px rgba(6,182,212,0.4)", "0px 10px 20px rgba(6,182,212,0.2)"]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Launch Animation Wrapper (Moves Diagonally Top-Right) */}
      <motion.div 
        className="relative w-full h-full flex items-center justify-center z-10 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
        animate={isMobileLaunching ? { x: 150, y: -150, scale: 0.5, opacity: 0 } : { x: 0, y: 0, scale: 1, opacity: 1 }}
        transition={isMobileLaunching ? { duration: 0.5, ease: "easeIn" } : { duration: 0.3 }}
      >
        {/* Rotational Frame for Rocket and Flame (rotated 45deg to align perfectly with lucide's icon angle constraint) */}
        <div className="relative flex flex-col items-center justify-center rotate-45">
          
          {/* Rocket Icon (Unrotated visually so it points along the container's straight UP axis) */}
          <Rocket className="-rotate-45 w-5 h-5 shrink-0 relative z-10 text-cyan-50 drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
          
          {/* Engine Flame (Points strictly DOWN along container's axis, scaling on hover/launch) */}
          <motion.div 
            className="absolute top-[calc(50%+6px)] left-1/2 w-2 -translate-x-1/2 origin-top bg-gradient-to-b from-white via-amber-500 to-transparent blur-[1px] rounded-full z-0 pointer-events-none"
            style={{ height: "12px" }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={
              isMobileLaunching ? {
                scaleY: [2, 8],
                opacity: [1, 0],
                transition: { duration: 0.5, ease: "easeOut" }
              } : isMobileHovering ? {
                scaleY: [1, 2.5, 1],
                opacity: [0.8, 1, 0.8],
                transition: { duration: 0.15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }
              } : {
                scaleY: 0,
                opacity: 0,
                transition: { duration: 0.2 }
              }
            }
          />
        </div>
      </motion.div>
      
      {/* Floating Tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 pointer-events-none">
        <span className="font-mono text-xs font-bold text-cyan-100 tracking-wider bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)] block shadow-lg">REPLAY</span>
      </div>
    </motion.button>
  );
};
