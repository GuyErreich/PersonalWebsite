/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ISourceOptions } from "@tsparticles/engine";

// Reusable base options that all particle configurations share
export const commonParticlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 120,
  detectRetina: true,
};
