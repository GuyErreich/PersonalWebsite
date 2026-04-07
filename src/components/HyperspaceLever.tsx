/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion, useMotionValue, useTransform } from "framer-motion";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface HyperspaceLeverProps {
  onActivate: () => void;
  getDelay: (base: number) => number;
  skipIntro: boolean;
  className?: string;
  isInline?: boolean;
  /** Controls quick show/hide independent of the entrance animation timeline */
  isVisible?: boolean;
}

export const HyperspaceLever: React.FC<HyperspaceLeverProps> = ({
  onActivate,
  getDelay,
  skipIntro,
  className,
  isInline = false,
  isVisible = true,
}) => {
  const [energy, setEnergy] = useState(0);
  const dragY = useMotionValue(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) audioContextRef.current = new AudioCtx();
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }

    return () => {
      stopSound();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  const playChargeSound = (pitchMultiplier: number) => {
    if (!audioContextRef.current) return;
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    if (!oscillatorRef.current) {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();

      osc.type = "sine";
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);

      osc.start();
      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
    }

    const freq = 60 + pitchMultiplier * 120;
    oscillatorRef.current.frequency.setTargetAtTime(freq, audioContextRef.current.currentTime, 0.1);

    const volume = 0.02 + pitchMultiplier * 0.15;
    gainNodeRef.current?.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
  };

  const playJumpSound = () => {
    if (!audioContextRef.current) return;

    stopSound();

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    const now = audioContextRef.current.currentTime;

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, now + 1.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    osc.start(now);
    osc.stop(now + 1.2);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        /* ignore */
      }
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  useEffect(() => {
    if (energy > 0.02 && energy < 1) {
      playChargeSound(energy);
    } else if (energy === 0) {
      stopSound();
    }
  }, [energy]);

  const maxPull = 140; // Total track height minus handle height

  dragY.onChange((y) => {
    const pullAmount = Math.max(0, Math.min(y, maxPull));
    const normalized = pullAmount / maxPull;
    setEnergy(normalized);
  });

  const handleDragEnd = () => {
    if (energy > 0.85) {
      playJumpSound();
      dragY.set(maxPull);
      setEnergy(1);

      setTimeout(() => {
        onActivate();
        setTimeout(() => {
          dragY.set(0);
          setEnergy(0);
        }, 3000);
      }, 300);
    } else {
      dragY.set(0);
      setEnergy(0);
    }
  };

  const TextOpacity = useTransform(dragY, [0, maxPull * 0.4, maxPull], [0.6, 1, 0]);

  // --- 3D PERSPECTIVE PHYSICS ---
  // The center of the track (Pivot Point) is at y = 112px
  // Handle center visual starts at y = 28px and maxes at 168px
  const rodTop = useTransform(dragY, (y) => Math.min(Number(y) + 28, 112));
  const rodHeight = useTransform(dragY, (y) => Math.max(Math.abs(112 - (Number(y) + 28)), 0));

  // Angle tilts forward/backward based on placement to fake the 3D rotating arc
  const handleRotateX = useTransform(dragY, [0, 70, 140], [35, 0, -35]);
  const handleScale = useTransform(dragY, [0, 70, 140], [0.93, 1.05, 0.93]);

  const defaultClassName =
    "absolute right-0 top-1/2 -translate-y-1/2 pointer-events-auto items-center gap-4 md:gap-6 bg-[#0a0f1a]/80 backdrop-blur-xl border-l-[3px] border-y-[3px] border-cyan-900/40 rounded-l-3xl p-3 md:p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] origin-right scale-75 xl:scale-100 hidden min-[1300px]:flex";

  return (
    // Visibility wrapper: fast 0.3s fade, no delay — separate from the 22s entrance animation
    <motion.div
      animate={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={skipIntro ? false : { opacity: 0, ...(isInline ? { y: 20 } : { x: 100 }) }}
        animate={{ opacity: 1, x: 0, ...(isInline ? { y: 0 } : {}) }}
        transition={{
          delay: getDelay(isInline ? 14.5 : 22.5),
          type: "spring",
          stiffness: 80,
        }}
        className={className || defaultClassName}
      >
        {/* Hide the Engage Timeshift text bubble if it's the inline/small lever */}
        {!isInline && (
          <motion.div
            style={{ opacity: TextOpacity }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur border border-cyan-500/30 rounded-xl text-xs font-bold font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.2)] text-cyan-400 w-32 text-center pointer-events-none transition-transform group-hover:-translate-y-1 hidden min-[1300px]:block"
          >
            ENGAGE
            <br />
            TIMESHIFT
            <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-black/80"></div>
          </motion.div>
        )}

        <div className="flex gap-5 items-center">
          {/* Lever Mechanism Panel - Added perspective parameter */}
          <div
            className="relative w-24 h-56 flex justify-center py-4 bg-gray-800 rounded-xl shadow-[inset_0_4px_15px_rgba(0,0,0,0.9)] border border-gray-900"
            style={{ perspective: 500 }}
          >
            {/* 2 Cavities/Tracks */}
            <div className="absolute left-[16px] top-4 bottom-4 w-3 bg-black/95 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,1)] border border-gray-950" />
            <div className="absolute right-[16px] top-4 bottom-4 w-3 bg-black/95 rounded-full shadow-[inset_0_4px_10px_rgba(0,0,0,1)] border border-gray-950" />

            {/* Left Dynamic 3D Rod connecting Handle to the Panel Pivot */}
            <motion.div
              className="absolute left-[18.5px] w-[8px] bg-gradient-to-b from-gray-500 via-gray-300 to-gray-800 rounded z-0 shadow-[0_0_10px_rgba(0,0,0,0.8)]"
              style={{ top: rodTop, height: rodHeight }}
            />

            {/* Right Dynamic 3D Rod connecting Handle to the Panel Pivot */}
            <motion.div
              className="absolute right-[18.5px] w-[8px] bg-gradient-to-b from-gray-500 via-gray-300 to-gray-800 rounded z-0 shadow-[0_0_10px_rgba(0,0,0,0.8)]"
              style={{ top: rodTop, height: rodHeight }}
            />

            {/* Draggable Handle Assembly */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: maxPull }}
              dragElastic={0.05}
              dragSnapToOrigin={true}
              onDragEnd={handleDragEnd}
              style={{ y: dragY }}
              className="absolute top-2 w-[calc(100%+16px)] h-12 left-[-8px] cursor-grab active:cursor-grabbing flex flex-col justify-start z-10 group"
            >
              {/* Main Thick Handle Bar with hardware 3D transformation */}
              <motion.div
                style={{
                  rotateX: handleRotateX,
                  scale: handleScale,
                  transformStyle: "preserve-3d",
                }}
                className="relative w-full h-10 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 rounded flex items-center justify-between px-2 z-20 shadow-[0_15px_30px_rgba(0,0,0,0.8),inset_0_2px_rgba(255,255,255,0.9)] border border-gray-500"
              >
                {/* Left grip ribbing */}
                <div className="w-5 h-full flex justify-evenly py-1 opacity-40">
                  <div className="w-[2px] h-full bg-black/80 border-r border-white/30" />
                  <div className="w-[2px] h-full bg-black/80 border-r border-white/30" />
                </div>

                {/* Center energy core warning light */}
                <motion.div
                  className="w-12 h-2.5 rounded-full"
                  style={{
                    background: energy > 0.9 ? "#06b6d4" : "#1f2937",
                    boxShadow:
                      energy > 0.9
                        ? "0 0 10px #06b6d4, 0 0 20px #06b6d4"
                        : "inset 0 1px 3px rgba(0,0,0,1)",
                  }}
                />

                {/* Right grip ribbing */}
                <div className="w-5 h-full flex justify-evenly py-1 opacity-40">
                  <div className="w-[2px] h-full bg-black/80 border-r border-white/30" />
                  <div className="w-[2px] h-full bg-black/80 border-r border-white/30" />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Dedicated Energy Meter Array (next to lever) */}
          <div className="w-6 h-56 bg-[#050505] rounded-md shadow-[inset_0_2px_10px_rgba(0,0,0,1)] border border-gray-800 p-[3px] flex flex-col justify-end relative overflow-hidden">
            {/* The rising energy gel */}
            <motion.div
              className="w-full bg-gradient-to-t from-blue-600 via-cyan-400 to-cyan-300 rounded-sm"
              style={{
                height: `${energy * 100}%`,
                boxShadow: `0px 0px ${energy * 15}px rgba(6, 182, 212, ${energy})`,
              }}
            />
            {/* Segment overlay grid */}
            <div className="absolute inset-0 flex flex-col justify-evenly py-1 pointer-events-none opacity-50 mix-blend-overlay">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="w-full h-[2px] bg-black"></div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
