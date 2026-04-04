import { useRef, useEffect, useState, useCallback, createContext } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Cookies from 'js-cookie';
import { Gamepad2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type EntranceTheme = 'gamedev' | 'devops';

// ─────────────────────────────────────────────────────────────────────────────
//  🕹️  SECTION ENTRANCE MODE  ← change this one value to switch animation style
//
//   'overlay'   overlay on first visit  +  element stagger on scroll (most cinematic)
//   'elements'  element stagger only — no overlay at all
//   'both'      same as overlay (alias kept for clarity)                ← default
// ─────────────────────────────────────────────────────────────────────────────
export const ENTRANCE_MODE = 'both' as 'overlay' | 'elements' | 'both';

// Context consumed by child components to know when overlay has finished and
// they should play their element entrance animations.
// Default true = no overlay wrapping, animate freely on scroll.
export const SectionRevealContext = createContext<boolean>(true);

// ── Shared scanline pattern ────────────────────────────────────────────────
const Scanlines = () => (
  <div
    aria-hidden
    className="absolute inset-0 pointer-events-none z-10"
    style={{
      backgroundImage:
        'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
    }}
  />
);

// ── Shared audio helper ────────────────────────────────────────────────────
function getAudioCtx() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
  } catch {
    return null;
  }
}

// ── GameDev Overlay ────────────────────────────────────────────────────────
const GameDevOverlay = ({ onDone }: { onDone: () => void }) => {
  const handleDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    // 8-bit ascending chime: C5 E5 G5 C6
    const ctx = getAudioCtx();
    if (ctx) {
      [523, 659, 784, 1047].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const t = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.04, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }

    const timer = setTimeout(handleDone, 2500);
    return () => clearTimeout(timer);
  }, [handleDone]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 25% 60%, rgba(16,185,129,0.09) 0%, transparent 55%), radial-gradient(ellipse at 75% 40%, rgba(124,58,237,0.09) 0%, transparent 55%), #030712',
      }}
      initial={{ y: 0 }}
      exit={{
        y: '-100%',
        transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
      }}
    >
      <Scanlines />

      {/* Animated gamepad icon */}
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

// ── DevOps Terminal Overlay ────────────────────────────────────────────────
const TERMINAL_LINES = [
  '> INITIALIZING INFRASTRUCTURE...',
  '> MOUNTING PROJECT CLUSTERS...',
  '> SYSTEM ONLINE ■',
];

const DevOpsOverlay = ({ onDone }: { onDone: () => void }) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const handleDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    // Rising terminal beeps
    const ctx = getAudioCtx();
    if (ctx) {
      [0, 0.46, 0.92].forEach((t, i) => {
        const freq = i === 2 ? 880 : 440 + i * 80;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + t);
        gain.gain.setValueAtTime(0, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.15);
      });
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines((p) => p + 1), i * 480 + 150));
    });
    timers.push(setTimeout(handleDone, 2300));
    return () => timers.forEach(clearTimeout);
  }, [handleDone]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.07) 0%, transparent 65%), #030712',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.55 } }}
    >
      <Scanlines />

      <div className="font-mono text-sm md:text-base w-72 md:w-[30rem] space-y-3">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.22 }}
            className={
              i === TERMINAL_LINES.length - 1 && visibleLines === TERMINAL_LINES.length
                ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.55)]'
                : 'text-cyan-400/90'
            }
          >
            {line}
          </motion.p>
        ))}
        {/* Blinking cursor — always shown while overlay is live */}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.75, repeat: Infinity }}
          className="inline-block w-2 h-[1em] bg-cyan-400 align-middle"
        />
      </div>
    </motion.div>
  );
};

// ── Public wrapper ─────────────────────────────────────────────────────────
interface SectionEntranceOverlayProps {
  theme: EntranceTheme;
  children: ReactNode;
}

const COOKIE_MAP: Record<EntranceTheme, string> = {
  gamedev: 'gamedev_visited',
  devops: 'devops_visited',
};

export const SectionEntranceOverlay = ({ theme, children }: SectionEntranceOverlayProps) => {
  // Capture cookie value once at mount — snapshot of first-visit state before any animations set it.
  const [hasCookie] = useState(() => !!Cookies.get(COOKIE_MAP[theme]));
  const [state, setState] = useState<'idle' | 'playing' | 'done'>('idle');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if ((ENTRANCE_MODE === 'overlay' || ENTRANCE_MODE === 'both') && isInView && !hasCookie && state === 'idle') {
      setState('playing');
    }
  }, [isInView, hasCookie, state]);

  // Elements should wait: only hold when overlay is actively playing
  const isRevealed = hasCookie || ENTRANCE_MODE === 'elements' || state !== 'playing';

  return (
    <div ref={ref} className="relative">
      <SectionRevealContext.Provider value={isRevealed}>
        {children}
      </SectionRevealContext.Provider>
      <AnimatePresence>        {(ENTRANCE_MODE === 'overlay' || ENTRANCE_MODE === 'both') && state === 'playing' &&
          (theme === 'gamedev' ? (
            <GameDevOverlay key="gd-overlay" onDone={() => { Cookies.set(COOKIE_MAP.gamedev, '1'); setState('done'); }} />
          ) : (
            <DevOpsOverlay key="do-overlay" onDone={() => { Cookies.set(COOKIE_MAP.devops, '1'); setState('done'); }} />
          ))}
      </AnimatePresence>
    </div>
  );
};
