import { useRef } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

/**
 * Scroll-driven reveal with viewport-anchored fade zones.
 *
 * Enter: fades in as the section's top travels through the bottom 20% of the
 * viewport. Exit: fades out as the section's bottom travels through the top
 * 20% of the viewport. Both zones are a fixed ~20vh regardless of section
 * height, so the animation feels consistent on every screen size.
 *
 * No spring — scrub is 1:1 with scroll for crisp, immediate feedback.
 *
 * Attach `ref` to the section element and spread `motionStyle` onto a
 * motion.div wrapping the section's content (NOT the background).
 */
export const useScrollReveal = () => {
  const ref = useRef<HTMLElement>(null);

  // 0→1 as section top travels through the bottom 20% of the viewport
  const { scrollYProgress: enterProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.8'],
  });

  // 0→1 as section bottom travels through the top 20% of the viewport
  const { scrollYProgress: exitProgress } = useScroll({
    target: ref,
    offset: ['end 0.2', 'end start'],
  });

  // Full opacity when fully entered and not yet exiting
  const opacity = useTransform(
    [enterProgress, exitProgress] as MotionValue[],
    ([enter, exit]: number[]) => Math.min(enter as number, 1 - (exit as number))
  );

  return { ref, motionStyle: { opacity } };
};
