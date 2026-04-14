/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createContext } from "react";

export type EntranceTheme = "gamedev" | "devops";

// ─────────────────────────────────────────────────────────────────────────────
//  🕹️  SECTION ENTRANCE MODE  ← change this one value to switch animation style
//
//   'overlay'   overlay on first visit  +  element stagger on scroll (most cinematic)
//   'elements'  element stagger only — no overlay at all
//   'both'      same as overlay (alias kept for clarity)                ← default
// ─────────────────────────────────────────────────────────────────────────────
export const ENTRANCE_MODE = "both" as "overlay" | "elements" | "both";

// Context consumed by child components to know when the overlay has finished
// so they can play their element entrance animations.
// Default true = no overlay wrapping, animate freely on scroll.
export const SectionRevealContext = createContext<boolean>(true);
