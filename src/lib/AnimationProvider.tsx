import type React from "react";
import { AnimationContext } from "./AnimationContext";
import type { AnimationOrchestrator } from "./AnimationOrchestrator";

export const AnimationProvider = ({
  orchestrator,
  children,
}: {
  orchestrator: AnimationOrchestrator;
  children: React.ReactNode;
}) => <AnimationContext.Provider value={orchestrator}>{children}</AnimationContext.Provider>;
