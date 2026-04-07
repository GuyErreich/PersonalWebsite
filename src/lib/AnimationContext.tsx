/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { createContext, useContext } from "react";
import type { AnimationOrchestrator } from "./AnimationOrchestrator";

export const AnimationContext = createContext<AnimationOrchestrator | null>(null);

export const useOrchestrator = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useOrchestrator must be used within an AnimationProvider");
  }
  return context;
};
