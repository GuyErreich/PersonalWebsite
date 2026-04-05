import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import { playGameDevChime } from '../../lib/sound/entranceSounds';
import { Scanlines } from './Scanlines';

interface GameDevOverlayProps {
  onDone: () => void;
}

export const GameDevOverlay = ({ onDone }: GameDevOverlayProps) => {
  const handleDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    playGameDevChime();
    const timer = setTimeout(handleDone, 2500);
    return () => clearTimeout(timer);
  }, [handleDone]);

  return (
    <motion.div
      className="overlay-backdrop overlay-bg-gamedev"
      initial={{ y: 0 }}
      exit={{ y: '-100%', transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] } }}
    >
      <Scanlines />

      {/* Gamepad icon pop-in */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.25, 1], opacity: 1 }}
        transition={{ duration: 0.55, times: [0, 0.65, 1] }}
        className="mb-6 text-emerald-400 drop-shadow-[0_0_24px_rgba(52,211,153,0.6)]"
      >
        <Gamepad2 size={68} strokeWidth={1.4} />
      </motion.div>

      {/* Letter-stagger title */}
      <div className="flex mb-3" style={{ gap: 'clamp(2px, 0.4vw, 8px)' }}>
        {'GAME DEV'.split('').map((ch, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.48 + i * 0.065, ease: 'easeOut' }}
            className="font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-purple-400 select-none"
            style={{ fontSize: 'clamp(2.4rem, 7vw, 5rem)', letterSpacing: '0.06em' }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </motion.span>
        ))}
      </div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.2 }}
        className="text-[0.65rem] font-mono tracking-[0.5em] text-emerald-500/60 uppercase mb-8"
      >
        Section Loaded
      </motion.p>

      {/* Progress bar */}
      <div className="w-52 h-[2px] bg-gray-800/80 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-400 to-purple-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.2, delay: 0.65, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
};
