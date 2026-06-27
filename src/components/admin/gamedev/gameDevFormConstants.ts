/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import {
  Code2,
  Cpu,
  Database,
  Gamepad2,
  Globe,
  Monitor,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const GAMEDEV_AVAILABLE_ICONS: Array<{ id: string; icon: LucideIcon; label: string }> = [
  { id: "gamepad", icon: Gamepad2, label: "Game" },
  { id: "code", icon: Code2, label: "Code" },
  { id: "server", icon: Server, label: "Server" },
  { id: "globe", icon: Globe, label: "Web" },
  { id: "cpu", icon: Cpu, label: "Hardware" },
  { id: "database", icon: Database, label: "Database" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "shield", icon: Shield, label: "Security" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "wrench", icon: Wrench, label: "Tool" },
  { id: "smartphone", icon: Smartphone, label: "Mobile" },
  { id: "monitor", icon: Monitor, label: "Desktop" },
];

export const GAMEDEV_BODY_TEMPLATE = [
  "## Overview",
  "",
  "Write the problem, goal, or design intent here.",
  "",
  "![Feature media](https://your-r2-media-url)",
  "",
  "## Critical Implementation",
  "",
  "```ts",
  "// Paste critical code here",
  "```",
  "",
  "## Breakdown",
  "",
  "Explain the system, tradeoffs, and interesting results.",
  "",
  "![Another media shot](https://your-r2-media-url)",
  "",
  "```cpp",
  "// Another key snippet",
  "```",
  "",
].join("\n");
