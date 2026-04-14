/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, useInView } from "framer-motion";
import Cookies from "js-cookie";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useScrollContainer } from "../../../../lib/ScrollContainerContext";
import { DevOpsOverlay } from "../../devops/common/overlays/DevOpsOverlay";
import { GameDevOverlay } from "../../gamedev/common/overlays/GameDevOverlay";
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
  const container = useScrollContainer();
  const isInView = useInView(ref, {
    once: true,
    amount: 0.3,
    root: container ?? undefined,
  });

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
    Cookies.set(cookieKey, "1", {
      expires: 365,
      sameSite: "strict",
      secure: window.location.protocol === "https:",
    });
    setState("done");
  };

  return (
    <div ref={ref} className="relative">
      <SectionRevealContext.Provider value={isRevealed}>{children}</SectionRevealContext.Provider>
      <AnimatePresence>
        {(ENTRANCE_MODE === "overlay" || ENTRANCE_MODE === "both") &&
          state === "playing" &&
          (theme === "gamedev" ? (
            <GameDevOverlay key="gd-overlay" onDone={() => handleDone(COOKIE_MAP.gamedev)} />
          ) : (
            <DevOpsOverlay key="do-overlay" onDone={() => handleDone(COOKIE_MAP.devops)} />
          ))}
      </AnimatePresence>
    </div>
  );
};
