/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion, useInView } from "framer-motion";
import Cookies from "js-cookie";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { DevOpsOverlay } from "./DevOpsOverlay";
import { GameDevOverlay } from "./GameDevOverlay";
import type { EntranceTheme } from "./sectionRevealContext";
import { ENTRANCE_MODE, SectionRevealContext } from "./sectionRevealContext";

// ── Public wrapper ─────────────────────────────────────────────────────────
interface SectionEntranceOverlayProps {
  theme: EntranceTheme;
  children: ReactNode;
}

const COOKIE_MAP: Record<EntranceTheme, string> = {
  gamedev: "gamedev_visited",
  devops: "devops_visited",
};

export const SectionEntranceOverlay = ({ theme, children }: SectionEntranceOverlayProps) => {
  // Snapshot cookie at mount — before the hero sets it a few seconds later.
  const [hasCookie] = useState(() => !!Cookies.get(COOKIE_MAP[theme]));
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    if (
      (ENTRANCE_MODE === "overlay" || ENTRANCE_MODE === "both") &&
      isInView &&
      !hasCookie &&
      state === "idle"
    ) {
      setState("playing");
    }
  }, [isInView, hasCookie, state]);

  // Hold child element animations while the overlay is actively playing.
  const isRevealed = hasCookie || ENTRANCE_MODE === "elements" || state !== "playing";

  const handleDone = (cookieKey: string) => {
    Cookies.set(cookieKey, "1");
    setState("done");
  };

  return (
    <div ref={ref} className="relative">
      <SectionRevealContext.Provider value={isRevealed}>{children}</SectionRevealContext.Provider>
      <AnimatePresence>
        {(ENTRANCE_MODE === "overlay" || ENTRANCE_MODE === "both") &&
          state === "playing" &&
          (theme === "gamedev" ? (
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
