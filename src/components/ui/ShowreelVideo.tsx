/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { Play } from "lucide-react";
import { useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";

interface ShowreelVideoProps {
  url: string | null;
  className?: string;
}

const TITLE_LETTERS = "SHOWREEL".split("");

const LETTER_GRADIENTS = [
  "from-cyan-300 to-blue-400",
  "from-blue-400 to-indigo-400",
  "from-indigo-400 to-purple-500",
  "from-purple-500 to-violet-400",
  "from-violet-400 to-fuchsia-400",
  "from-fuchsia-400 to-pink-400",
  "from-pink-400 to-emerald-400",
  "from-emerald-400 to-cyan-300",
];

export const ShowreelVideo = ({ url, className = "" }: ShowreelVideoProps) => {
  const hasCookie = !!Cookies.get("hero_visited");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    playClickSound();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0;
      videoRef.current.controls = true;
      void videoRef.current.play().catch(() => {});
    }
    setIsPlaying(true);
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: hasCookie ? 0 : 0.08,
        delayChildren: hasCookie ? 0 : 0.4,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.85 },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: hasCookie ? 0 : 0.55, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      initial={hasCookie ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: hasCookie ? 0 : 0.7 }}
      className={`w-full max-w-5xl mx-auto ${className}`}
    >
      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-cyan-300/20 bg-black shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_28px_80px_rgba(2,6,23,0.75)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] rounded-xl"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(34,211,238,0.25), inset 0 0 42px rgba(34,211,238,0.12), 0 0 58px rgba(16,185,129,0.12)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] rounded-xl"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(56,189,248,0.24) 0%, rgba(56,189,248,0) 42%), radial-gradient(120% 80% at 100% 100%, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0) 42%)",
          }}
        />
        {url ? (
          <>
            {/* Looping preview — blurred and dimmed until play */}
            <video
              ref={videoRef}
              src={url}
              autoPlay={!isPlaying}
              loop={!isPlaying}
              muted={!isPlaying}
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                !isPlaying
                  ? "blur-[5px] brightness-[0.3] scale-[1.06]"
                  : "blur-0 brightness-100 scale-100"
              }`}
            />

            {/* Cinematic scanlines overlay */}
            {!isPlaying && (
              <div
                aria-hidden="true"
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)",
                }}
              />
            )}

            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 py-6 md:py-8"
                >
                  {/* Animated per-letter SHOWREEL title */}
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-end mb-8 md:mb-12"
                    style={{ gap: "clamp(2px, 0.5vw, 8px)" }}
                  >
                    {TITLE_LETTERS.map((letter, i) => (
                      <motion.span
                        key={i}
                        variants={letterVariants}
                        className={`inline-block font-extrabold leading-none text-transparent bg-clip-text bg-gradient-to-br ${LETTER_GRADIENTS[i]} select-none`}
                        style={{
                          fontSize: "clamp(1.8rem, 6.8vw, 4.9rem)",
                          letterSpacing: "0.04em",
                          filter: "drop-shadow(0 0 18px rgba(34,211,238,0.35))",
                        }}
                      >
                        {letter}
                      </motion.span>
                    ))}
                  </motion.div>

                  {/* Play button */}
                  <motion.button
                    type="button"
                    aria-label="Play showreel"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlay();
                    }}
                    onMouseEnter={playHoverSound}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: {
                        delay: hasCookie ? 0 : 1.0,
                        duration: 0.4,
                        ease: "easeOut",
                      },
                    }}
                    whileHover={{
                      scale: 1.12,
                      boxShadow: "0px 0px 45px rgba(52,211,153,0.55)",
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-emerald-500/10 backdrop-blur-md border-[2px] border-emerald-400 flex items-center justify-center text-white shadow-[0_0_25px_rgba(52,211,153,0.3)]"
                  >
                    <Play
                      className="w-8 h-8 md:w-12 md:h-12 ml-1 md:ml-2 text-emerald-300"
                      fill="currentColor"
                    />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <Play className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-gray-400">Showreel not set</p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
