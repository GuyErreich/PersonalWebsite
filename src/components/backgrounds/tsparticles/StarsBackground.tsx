/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ISourceOptions } from "@tsparticles/engine";
import { useMemo } from "react";
import { ParticlesBase } from "./ParticlesBase";
import { commonParticlesOptions } from "./particlesConfig";

interface StarsBackgroundProps {
  id?: string;
  className?: string;
}

export const StarsBackground = ({ id = "stars-particles", className }: StarsBackgroundProps) => {
  const options = useMemo(
    (): ISourceOptions => ({
      ...commonParticlesOptions,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "bubble" },
        },
        modes: {
          bubble: { distance: 200, size: 4, duration: 0.3, opacity: 1 },
        },
      },
      particles: {
        color: { value: "#ffffff" },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: true,
          speed: 0.3,
          straight: false,
        },
        number: {
          density: { enable: true },
          value: 150,
        },
        opacity: {
          value: { min: 0.1, max: 1 },
          animation: { enable: true, speed: 1, sync: false },
        },
        shape: {
          type: "star", // requires loadSlim
        },
        size: {
          value: { min: 0.5, max: 2 },
        },
      },
    }),
    [],
  );

  return <ParticlesBase id={id} className={className} options={options} />;
};
