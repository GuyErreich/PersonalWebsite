import { useRef, useEffect, useState, createContext } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Cookies from 'js-cookie';
import type { ReactNode } from 'react';
import { GameDevOverlay } from './GameDevOverlay';
import { DevOpsOverlay } from './DevOpsOverlay';

export type EntranceTheme = 'gamedev' | 'devops';

// ─────────────────────────────────────────────────────────────────────────────
//  🕹️  SECTION ENTRANCE MODE  ← change this one value to switch animation style
//
//   'overlay'   overlay on first visit  +  element stagger on scroll (most cinematic)
//   'elements'  element stagger only — no overlay at all
//   'both'      same as overlay (alias kept for clarity)                ← default
// ─────────────────────────────────────────────────────────────────────────────
export const ENTRANCE_MODE = 'both' as 'overlay' | 'elements' | 'both';

// Context consumed by child components to know when the overlay has finished
// so they can play their element entrance animations.
// Default true = no overlay wrapping, animate freely on scroll.
export const SectionRevealContext = createContext<boolean>(true);

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
  // Snapshot cookie at mount — before the hero sets it a few seconds later.
  const [hasCookie] = useState(() => !!Cookies.get(COOKIE_MAP[theme]));
  const [state, setState] = useState<'idle' | 'playing' | 'done'>('idle');
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if ((ENTRANCE_MODE === 'overlay' || ENTRANCE_MODE === 'both') && isInView && !hasCookie && state === 'idle') {
      setState('playing');
    }
  }, [isInView, hasCookie, state]);

  // Hold child element animations while the overlay is actively playing.
  const isRevealed = hasCookie || ENTRANCE_MODE === 'elements' || state !== 'playing';

  const handleDone = (cookieKey: string) => {
    Cookies.set(cookieKey, '1');
    setState('done');
  };

  return (
    <div ref={ref} className="relative">
      <SectionRevealContext.Provider value={isRevealed}>
        {children}
      </SectionRevealContext.Provider>
      <AnimatePresence>
        {(ENTRANCE_MODE === 'overlay' || ENTRANCE_MODE === 'both') && state === 'playing' &&
          (theme === 'gamedev' ? (
            <motion.div key="gd-overlay">
              <GameDevOverlay onDone={() => handleDone(COOKIE_MAP.gamedev)} />
            </motion.div>
          ) : (
            <motion.div key="do-overlay">
              <DevOpsOverlay onDone={() => handleDone(COOKIE_MAP.devops)} />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

