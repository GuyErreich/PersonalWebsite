/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import Cookies from "js-cookie";
import { Maximize2, Minimize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import {
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { formatVolumePercent } from "../../../../../lib/format";
import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import {
  createSteppedSliderAnimator,
  type SteppedSliderAnimator,
} from "../../../../../lib/steppedSliderAnimator";
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
const VOLUME_STEP = 1;
const VOLUME_STEP_INTERVAL_MS = 12;
const VOLUME_POPUP_CLOSE_DELAY_MS = 180;

const formatTime = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const ShowreelVideo = ({ url, className = "" }: ShowreelVideoProps) => {
  const hasCookie = !!Cookies.get("hero_visited");
  const volumePopupId = useId();

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sliderVolume, setSliderVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isVolumePopupOpen, setIsVolumePopupOpen] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumePopupCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeAnimatorRef = useRef<SteppedSliderAnimator | null>(null);
  const volumePopupRef = useRef<HTMLDivElement>(null);
  const timeUpdateRafRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const pendingVideoReadyCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const touchQuery = window.matchMedia("(pointer: coarse)");

    const updateTouchMode = () => {
      setIsTouchDevice(touchQuery.matches);
    };

    updateTouchMode();
    touchQuery.addEventListener("change", updateTouchMode);

    return () => {
      touchQuery.removeEventListener("change", updateTouchMode);
    };
  }, []);

  useEffect(() => {
    volumeAnimatorRef.current = createSteppedSliderAnimator({
      initialValue: DEFAULT_VOLUME,
      min: 0,
      max: 100,
      step: VOLUME_STEP,
      intervalMs: VOLUME_STEP_INTERVAL_MS,
      onStep: (nextVolume) => {
        setSliderVolume(nextVolume);
        setIsMuted(false);
      },
    });

    return () => {
      volumeAnimatorRef.current?.stop();
      volumeAnimatorRef.current = null;
    };
  }, []);

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
      if (!Number.isNaN(v) && v >= 0 && v <= 100) {
        setSliderVolume(v);
        volumeAnimatorRef.current?.setImmediate(v);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply volume in native browser range 0-100.
  const applyVolumeToGraph = useCallback((sliderVal: number, muted: boolean) => {
    if (!videoRef.current) return;

    videoRef.current.volume = muted ? 0 : Math.max(0, Math.min(sliderVal, 100)) / 100;
  }, []);

  useEffect(() => {
    applyVolumeToGraph(sliderVolume, isMuted);
  }, [sliderVolume, isMuted, applyVolumeToGraph]);

  // Cleanup hide timer on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (volumePopupCloseTimerRef.current) clearTimeout(volumePopupCloseTimerRef.current);
      if (timeUpdateRafRef.current !== null) cancelAnimationFrame(timeUpdateRafRef.current);

      pendingVideoReadyCleanupRef.current?.();
      pendingVideoReadyCleanupRef.current = null;
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const scheduleHide = () => {
    if (isTouchDevice || isVolumePopupOpen) return;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handlePlay = async () => {
    playClickSound();
    if (videoRef.current) {
      const syncDurationFromVideo = () => {
        if (!isMountedRef.current) return;

        const rawDuration = videoRef.current?.duration ?? 0;
        const safeDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
        setDuration(safeDuration);
      };

      const waitForVideoReady = async (video: HTMLVideoElement) => {
        if (video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0) {
          return;
        }

        video.preload = "auto";
        video.load();

        await new Promise<void>((resolve) => {
          let timeoutId: number | null = null;

          const handleDone = () => {
            syncDurationFromVideo();
            cleanup();
            resolve();
          };

          const cleanup = () => {
            if (timeoutId !== null) {
              window.clearTimeout(timeoutId);
            }
            video.removeEventListener("loadedmetadata", handleDone);
            video.removeEventListener("durationchange", handleDone);
            video.removeEventListener("canplay", handleDone);
            video.removeEventListener("error", handleDone);

            if (pendingVideoReadyCleanupRef.current === cleanup) {
              pendingVideoReadyCleanupRef.current = null;
            }
          };

          pendingVideoReadyCleanupRef.current = cleanup;
          timeoutId = window.setTimeout(handleDone, 1800);

          video.addEventListener("loadedmetadata", handleDone, { once: true });
          video.addEventListener("durationchange", handleDone, { once: true });
          video.addEventListener("canplay", handleDone, { once: true });
          video.addEventListener("error", handleDone, { once: true });
        });
      };

      videoRef.current.muted = false;
      await waitForVideoReady(videoRef.current);
      videoRef.current.currentTime = 0;
      applyVolumeToGraph(sliderVolume, isMuted);
      try {
        await videoRef.current.play();
      } catch {
        // intentional — leave UI in pre-play state on decode/format failure
        return;
      }
    }
    setIsPlaying(true);
    setIsVolumePopupOpen(false);
    setShowControls(true);
    scheduleHide();
  };

  const handlePlayPause = () => {
    playClickSound();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      void videoRef.current.play().catch(() => {}); // intentional
      scheduleHide();
    } else {
      videoRef.current.pause();
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  };

  const handleVolumeChange = (val: number) => {
    volumeAnimatorRef.current?.setImmediate(val);
  };

  const handleVolumeMute = () => {
    playClickSound();
    handleMute();
  };

  const handleVolumeEnter = () => {
    if (volumePopupCloseTimerRef.current) clearTimeout(volumePopupCloseTimerRef.current);

    setShowControls(true);
    setIsVolumePopupOpen(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const handleVolumeFocus = () => {
    if (volumePopupCloseTimerRef.current) clearTimeout(volumePopupCloseTimerRef.current);

    setShowControls(true);
    setIsVolumePopupOpen(true);

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  const handleVolumeBlur = (e: FocusEvent<HTMLDivElement>) => {
    const nextFocus = e.relatedTarget;
    if (nextFocus instanceof Node && volumePopupRef.current?.contains(nextFocus)) {
      return;
    }

    setIsVolumePopupOpen(false);

    if (isTouchDevice) return;

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
  };

  const handleVolumePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse") return;
    handleVolumeEnter();
  };

  const handleVolumeLeave = () => {
    if (volumePopupCloseTimerRef.current) clearTimeout(volumePopupCloseTimerRef.current);

    volumePopupCloseTimerRef.current = setTimeout(() => {
      setIsVolumePopupOpen(false);

      if (isTouchDevice) return;

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowControls(false), 2500);
    }, VOLUME_POPUP_CLOSE_DELAY_MS);
  };

  const handleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    applyVolumeToGraph(sliderVolume, next);
  };

  const handleSeek = (t: number) => {
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const handleFullscreen = () => {
    playClickSound();
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

  const handleTouchStart = () => {
    setShowControls(true);
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
  const volFill = `${(effectiveVol / 100) * 100}%`;

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
        onTouchStart={handleTouchStart}
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
              preload="metadata"
              playsInline
              onTimeUpdate={() => {
                if (timeUpdateRafRef.current !== null) return;
                timeUpdateRafRef.current = requestAnimationFrame(() => {
                  setCurrentTime(videoRef.current?.currentTime ?? 0);
                  timeUpdateRafRef.current = null;
                });
              }}
              onLoadedMetadata={() => {
                const rawDuration = videoRef.current?.duration ?? 0;
                const safeDuration =
                  Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
                setDuration(safeDuration);
              }}
              onDurationChange={() => {
                const rawDuration = videoRef.current?.duration ?? 0;
                const safeDuration =
                  Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
                setDuration(safeDuration);
              }}
              onCanPlay={() => {
                const rawDuration = videoRef.current?.duration ?? 0;
                const safeDuration =
                  Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
                if (safeDuration > 0 && duration === 0) {
                  setDuration(safeDuration);
                }
              }}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
              onEnded={() => {
                if (!videoRef.current) return;

                videoRef.current.currentTime = 0;
                setCurrentTime(0);
                setIsPaused(true);
                setIsPlaying(false);
                setIsVolumePopupOpen(false);
                setShowControls(true);

                if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              }}
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
                      void handlePlay();
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
                <motion.button
                  type="button"
                  aria-label={isPaused ? "Play" : "Pause"}
                  onClick={handlePlayPause}
                  onMouseEnter={playHoverSound}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="showreel-ctrl-btn"
                >
                  {isPaused ? (
                    <Play className="w-4 h-4 text-cyan-300" fill="currentColor" />
                  ) : (
                    <Pause className="w-4 h-4 text-cyan-300" fill="currentColor" />
                  )}
                </motion.button>

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
                  style={{ "--seek-pct": seekPct } as CSSProperties}
                />

                {/* Time display */}
                <span className="showreel-time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Volume popup control — hover to show, click to mute */}
                <div
                  ref={volumePopupRef}
                  className="showreel-volume-control"
                  role="toolbar"
                  aria-label="Volume control"
                  onMouseEnter={handleVolumeEnter}
                  onMouseLeave={handleVolumeLeave}
                  onFocusCapture={handleVolumeFocus}
                  onBlurCapture={handleVolumeBlur}
                  onPointerDown={handleVolumePointerDown}
                >
                  <motion.button
                    type="button"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                    aria-expanded={isVolumePopupOpen}
                    aria-controls={volumePopupId}
                    onClick={handleVolumeMute}
                    onMouseEnter={playHoverSound}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="showreel-ctrl-btn"
                  >
                    {isMuted || sliderVolume === 0 ? (
                      <VolumeX className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-cyan-300" />
                    )}
                  </motion.button>

                  {isVolumePopupOpen && (
                    <div id={volumePopupId} className="showreel-volume-popup">
                      <input
                        type="range"
                        aria-label="Volume"
                        min={0}
                        max={100}
                        step={1}
                        value={effectiveVol}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="showreel-volume-popup-slider"
                        style={{ "--vol-fill": volFill } as CSSProperties}
                      />

                      <span className="showreel-volume-popup-value">
                        {formatVolumePercent(effectiveVol)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Fullscreen toggle */}
                <motion.button
                  type="button"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  onClick={handleFullscreen}
                  onMouseEnter={playHoverSound}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="showreel-ctrl-btn"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4 text-cyan-300" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-cyan-300" />
                  )}
                </motion.button>
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
