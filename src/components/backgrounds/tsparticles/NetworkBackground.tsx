/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ISourceOptions } from "@tsparticles/engine";
import { useMemo } from "react";
import { ParticlesBase } from "./ParticlesBase";
import { commonParticlesOptions } from "./particlesConfig";

interface NetworkBackgroundProps {
  id?: string;
  className?: string;
}

export const NetworkBackground = ({
  id = "network-particles",
  className,
}: NetworkBackgroundProps) => {
  const options = useMemo(
    (): ISourceOptions => ({
      ...commonParticlesOptions,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.5 } },
        },
      },
      particles: {
        color: { value: ["#3b82f6", "#10b981", "#8b5cf6"] },
        links: {
          color: "#334155",
          distance: 150,
          enable: true,
          opacity: 1,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: { default: "bounce" },
          random: false,
          speed: 0.8,
          straight: false,
        },
        number: {
          density: { enable: true },
          value: 200,
        },
        opacity: { value: 0.5 },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
    }),
    [],
  );

  return <ParticlesBase id={id} className={className} options={options} />;
};
