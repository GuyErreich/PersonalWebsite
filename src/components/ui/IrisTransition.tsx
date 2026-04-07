/**
 * IrisTransition — scroll-driven camera-iris exit effect for the Hero section.
 *
 * Renders as a React Fragment (no wrapper element) so all layers participate
 * directly in the Hero section's stacking context at their declared z-indices.
 *
 * Layer stack (z-order):
 *   z-[56]  Dark cover      — fades in first to hide the WebGL canvas before iris starts
 *   z-[57]  Aperture blades — 6-blade conic shutter that rotates as iris closes
 *   z-[58]  Chromatic R/B   — R outside, B inside, mix-blend-screen
 *   z-[59]  Iris vignette   — main radial mask that shrinks to a pinhole
 *   z-[60]  Ring glow       — cyan/violet halo tracking the iris edge
 *   z-[61]  Central bloom   — wormhole-collapse light burst
 *   z-[62]  Final black     — full seal once pinhole closes
 *
 * Usage:
 *   <IrisTransition scrollProgress={heroExitProgress} />
 */

import type { MotionValue } from "framer-motion";
import { motion, useMotionTemplate, useTransform } from "framer-motion";

interface IrisTransitionProps {
  /** Framer Motion scroll progress value (0 = hero fills viewport, 1 = hero scrolled away) */
  scrollProgress: MotionValue<number>;
}

export const IrisTransition = ({ scrollProgress }: IrisTransitionProps) => {
  // ── Motion values ──────────────────────────────────────────────────────────
  // Dark cover: fades in before iris to hide galaxy without touching WebGL compositor
  const bgCoverOpacity = useTransform(scrollProgress, [0.32, 0.5], [0, 1]);

  // Iris aperture: transparent centre shrinks to a pinhole then seals
  const irisRadius = useTransform(scrollProgress, [0.48, 0.97], [100, 0]);
  // Final black fill once the iris is nearly closed
  const finalBlack = useTransform(scrollProgress, [0.93, 0.99], [0, 1]);

  // Aperture ring glow — cyan/violet halo tracking the iris edge
  const glowRadius = useTransform(scrollProgress, [0.48, 0.97], [104, 1]);
  const glowOpacity = useTransform(scrollProgress, [0.48, 0.68, 0.93], [0, 1, 0]);

  // Chromatic aberration — R channel slightly larger, B slightly smaller
  const chromaR = useTransform(scrollProgress, [0.48, 0.97], [102, 0.5]);
  const chromaB = useTransform(scrollProgress, [0.48, 0.97], [98, 0]);
  const chromaOpacity = useTransform(scrollProgress, [0.48, 0.72, 0.93], [0, 0.7, 0]);

  // Central bloom — brief wormhole-collapse light pulse
  const bloomOpacity = useTransform(scrollProgress, [0.48, 0.63, 0.82], [0, 1, 0]);
  const bloomRadius = useTransform(scrollProgress, [0.48, 0.82], [5, 26]);

  // Aperture blades — 6-blade conic shutter that rotates as the iris closes
  const bladeRotate = useTransform(scrollProgress, [0.48, 0.97], [0, 44]);
  const bladeOpacity = useTransform(scrollProgress, [0.48, 0.62, 0.93], [0, 0.22, 0]);

  // ── Gradient templates ─────────────────────────────────────────────────────
  const irisGradient = useMotionTemplate`radial-gradient(${irisRadius}% ${irisRadius}% at 50% 42%, transparent 60%, rgba(17,24,39,0.98) 100%)`;
  const glowGradient = useMotionTemplate`radial-gradient(${glowRadius}% ${glowRadius}% at 50% 42%, transparent 55%, rgba(80,210,255,0.6) 61%, rgba(180,110,255,0.35) 67%, transparent 75%)`;
  const chromaRGradient = useMotionTemplate`radial-gradient(${chromaR}% ${chromaR}% at 50% 42%, transparent 60%, rgba(255,60,80,0.22) 100%)`;
  const chromaBGradient = useMotionTemplate`radial-gradient(${chromaB}% ${chromaB}% at 50% 42%, transparent 60%, rgba(60,120,255,0.22) 100%)`;
  const bloomGradient = useMotionTemplate`radial-gradient(${bloomRadius}% ${bloomRadius}% at 50% 42%, rgba(210,240,255,0.9) 0%, rgba(130,195,255,0.45) 50%, transparent 100%)`;

  return (
    <>
      {/* Dark cover — hides galaxy before iris starts; never touches the WebGL canvas */}
      <motion.div
        className="iris-layer z-[56]"
        style={{ opacity: bgCoverOpacity, background: "#111827" }}
      />

      {/* Layer 1: 6-blade rotating aperture shutter */}
      <motion.div
        className="iris-layer z-[57]"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 42%, rgba(140,200,255,0.07) 0deg, transparent 30deg, rgba(140,200,255,0.07) 60deg, transparent 90deg, rgba(140,200,255,0.07) 120deg, transparent 150deg, rgba(140,200,255,0.07) 180deg, transparent 210deg, rgba(140,200,255,0.07) 240deg, transparent 270deg, rgba(140,200,255,0.07) 300deg, transparent 330deg)",
          rotate: bladeRotate,
          transformOrigin: "50% 42%",
          opacity: bladeOpacity,
        }}
      />

      {/* Layer 2: Chromatic aberration — R channel outside, B channel inside */}
      <motion.div
        className="iris-layer z-[58] mix-blend-screen"
        style={{ background: chromaRGradient, opacity: chromaOpacity }}
      />
      <motion.div
        className="iris-layer z-[58] mix-blend-screen"
        style={{ background: chromaBGradient, opacity: chromaOpacity }}
      />

      {/* Layer 3: Main iris vignette */}
      <motion.div className="iris-layer z-[59]" style={{ background: irisGradient }} />

      {/* Layer 4: Aperture ring glow — cyan/violet halo */}
      <motion.div
        className="iris-layer z-[60]"
        style={{ background: glowGradient, opacity: glowOpacity }}
      />

      {/* Layer 5: Central bloom — wormhole-collapse light burst */}
      <motion.div
        className="iris-layer z-[61]"
        style={{ background: bloomGradient, opacity: bloomOpacity }}
      />

      {/* Layer 6: Final black seal */}
      <motion.div
        className="iris-layer z-[62]"
        style={{ opacity: finalBlack, background: "#111827" }}
      />
    </>
  );
};
