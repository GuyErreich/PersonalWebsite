/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { supabase } from "../../../../../lib/supabase";

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

const DEFAULT_VOLUME = 10; // 10% — safe starting point before DB value loads

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const ShowreelVideo = ({ url, className = "" }: ShowreelVideoProps) => {
  const hasCookie = !!Cookies.get("hero_visited");

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sliderVolume, setSliderVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load default volume from DB
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "showreel_default_volume")
        .single();
      if (!isMounted || error || !data) return;
      const v = Number(data.value);
      if (!Number.isNaN(v) && v >= 0 && v <= 300) setSliderVolume(v);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Cleanup AudioContext and hide timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (audioCtxRef.current) {
        void audioCtxRef.current.close().catch(() => {}); // intentional
        audioCtxRef.current = null;
        gainNodeRef.current = null;
      }
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Apply volume: 0-100 = native volume (gain=1), 101-300 = gain amplification (volume=1)
  const applyVolumeToGraph = (sliderVal: number, muted: boolean) => {
    if (!videoRef.current) return;
    if (muted) {
      videoRef.current.volume = 0;
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 0;
      return;
    }
    if (sliderVal <= 100) {
      videoRef.current.volume = sliderVal / 100;
      if (gainNodeRef.current) gainNodeRef.current.gain.value = 1;
    } else {
      videoRef.current.volume = 1;
      if (gainNodeRef.current) gainNodeRef.current.gain.value = sliderVal / 100;
    }
  };

  // Setup Web Audio graph once on first play — creates GainNode for >100% amplification
  const setupAudioGraph = () => {
    if (audioCtxRef.current || !videoRef.current) return;
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    const source = ctx.createMediaElementSource(videoRef.current);
    source.connect(gain);
    gain.connect(ctx.destination);
    audioCtxRef.current = ctx;
    gainNodeRef.current = gain;
  };

  const scheduleHide = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const ensureAudioContextRunning = async () => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === "suspended") {
      await audioCtxRef.current.resume();
    }
  };

  const handlePlay = () => {
    playClickSound();
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.currentTime = 0;
      setupAudioGraph();
      void ensureAudioContextRunning().catch(() => {}); // intentional
      applyVolumeToGraph(sliderVolume, isMuted);
      void videoRef.current.play().catch(() => {}); // intentional
    }
    setIsPlaying(true);
    setShowControls(true);
    scheduleHide();
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void ensureAudioContextRunning().catch(() => {}); // intentional
      void videoRef.current.play().catch(() => {}); // intentional
      scheduleHide();
    } else {
      videoRef.current.pause();
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  };

  const handleVolumeChange = (val: number) => {
    void ensureAudioContextRunning().catch(() => {}); // intentional
    setSliderVolume(val);
    setIsMuted(false);
    applyVolumeToGraph(val, false);
  };

  const handleMute = () => {
    void ensureAudioContextRunning().catch(() => {}); // intentional
    const next = !isMuted;
    setIsMuted(next);
    applyVolumeToGraph(sliderVolume, next);
  };

  const handleSeek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen().catch(() => {}); // intentional
    } else {
      void document.exitFullscreen().catch(() => {}); // intentional
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (isPlaying && !isPaused) scheduleHide();
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

  // Derived values for slider visuals
  const effectiveVol = isMuted ? 0 : sliderVolume;
  const seekPct = `${duration ? (currentTime / duration) * 100 : 0}%`;
  const volFill = `${(effectiveVol / 300) * 100}%`;
  const volLabelClass =
    !isMuted && sliderVolume > 200
      ? "text-red-400"
      : !isMuted && sliderVolume > 100
        ? "text-amber-400"
        : "text-cyan-300/80";

  return (
    <motion.div
      initial={hasCookie ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: hasCookie ? 0 : 0.7 }}
      className={`w-full max-w-5xl mx-auto ${className}`}
    >
      <section
        ref={containerRef}
        aria-label="Showreel video player"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying && !isPaused) scheduleHide();
        }}
        className="showreel-container relative w-full aspect-video overflow-hidden rounded-xl border border-cyan-300/20 bg-black shadow-[0_0_0_1px_rgba(56,189,248,0.18),0_28px_80px_rgba(2,6,23,0.75)]"
      >
        {/* Decorative glows */}
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
            {/* Video — no native controls; custom controls bar handles everything */}
            <video
              ref={videoRef}
              src={url}
              autoPlay={!isPlaying}
              loop={!isPlaying}
              muted={!isPlaying}
              playsInline
              onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
              onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                !isPlaying
                  ? "blur-[5px] brightness-[0.3] scale-[1.06]"
                  : "blur-0 brightness-100 scale-100"
              }`}
            />

            {/* Cinematic scanlines overlay (preview only) */}
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

            {/* SHOWREEL title + initial play button */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.5 } }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 py-6 md:py-8"
                >
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
                      boxShadow: "0px 0px 45px rgba(56,189,248,0.55)",
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-cyan-400/10 backdrop-blur-md border-[2px] border-cyan-400 flex items-center justify-center text-white shadow-[0_0_25px_rgba(56,189,248,0.3)]"
                  >
                    <Play
                      className="w-8 h-8 md:w-12 md:h-12 ml-1 md:ml-2 text-cyan-300"
                      fill="currentColor"
                    />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom controls bar — auto-hides after 2.5s of inactivity */}
            {isPlaying && (
              <div
                className={`showreel-controls ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                {/* Play / Pause */}
                <button
                  type="button"
                  aria-label={isPaused ? "Play" : "Pause"}
                  onClick={handlePlayPause}
                  onMouseEnter={playHoverSound}
                  className="showreel-ctrl-btn"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4 text-cyan-300" fill="currentColor" />
                  ) : (
                    <Pause className="w-4 h-4 text-cyan-300" fill="currentColor" />
                  )}
                </button>

                {/* Seek bar */}
                <input
                  type="range"
                  aria-label="Seek"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="showreel-seek-slider"
                  style={{ "--seek-pct": seekPct } as React.CSSProperties}
                />

                {/* Time display */}
                <span className="showreel-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Mute toggle */}
                <button
                  type="button"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  onClick={handleMute}
                  onMouseEnter={playHoverSound}
                  className="showreel-ctrl-btn"
                >
                  {isMuted || sliderVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-300" />
                  )}
                </button>

                {/* Volume slider — 0 to 300% with GainNode amplification above 100% */}
                <input
                  type="range"
                  aria-label="Volume"
                  min={0}
                  max={300}
                  step={1}
                  value={effectiveVol}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="showreel-volume-slider"
                  style={{ "--vol-fill": volFill } as React.CSSProperties}
                />

                <span className={`showreel-volume-label ${volLabelClass}`}>{effectiveVol}%</span>

                {/* Fullscreen toggle */}
                <button
                  type="button"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  onClick={handleFullscreen}
                  onMouseEnter={playHoverSound}
                  className="showreel-ctrl-btn"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-cyan-300" />
                  )}
                </button>
              </div>
            )}
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
      </section>
    </motion.div>
  );
};
