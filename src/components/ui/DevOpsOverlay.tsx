/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { playDevOpsBeeps } from "../../lib/sound/entranceSounds";
import { Scanlines } from "./Scanlines";

interface DevOpsOverlayProps {
  onDone: () => void;
}

const TERMINAL_LINES = [
  "> INITIALIZING INFRASTRUCTURE...",
  "> MOUNTING PROJECT CLUSTERS...",
  "> SYSTEM ONLINE ■",
];

export const DevOpsOverlay = ({ onDone }: DevOpsOverlayProps) => {
  const [visibleLines, setVisibleLines] = useState(0);
  const handleDone = useCallback(onDone, [onDone]);

  useEffect(() => {
    playDevOpsBeeps();
    const timers: ReturnType<typeof setTimeout>[] = [];
    TERMINAL_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleLines((p) => p + 1), i * 480 + 150));
    });
    timers.push(setTimeout(handleDone, 2300));
    return () => timers.forEach(clearTimeout);
  }, [handleDone]);

  return (
    <motion.div
      className="overlay-backdrop overlay-bg-devops"
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
                ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.55)]"
                : "text-cyan-400/90"
            }
          >
            {line}
          </motion.p>
        ))}
        {/* Blinking cursor */}
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.75, repeat: Infinity }}
          className="inline-block w-2 h-[1em] bg-cyan-400 align-middle"
        />
      </div>
    </motion.div>
  );
};
