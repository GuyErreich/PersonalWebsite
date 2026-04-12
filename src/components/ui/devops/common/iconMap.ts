/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import {
  Cloud,
  Container,
  Database,
  GitBranch,
  Monitor,
  Network,
  Server,
  Shield,
  Terminal,
  Workflow,
} from "lucide-react";
import type { ElementType } from "react";

export const devOpsIconMap: Record<string, ElementType> = {
  Server,
  Cloud,
  Database,
  Terminal,
  GitBranch,
  Container,
  Workflow,
  Monitor,
  Network,
  Shield,
};

// Icon accent colours — cycled by absolute project index so each card gets
// a distinct colour even across pages.
export const ICON_COLORS = [
  "text-blue-400",
  "text-emerald-400",
  "text-violet-400",
  "text-orange-400",
  "text-cyan-400",
  "text-pink-400",
];
