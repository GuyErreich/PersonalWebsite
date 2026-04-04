import { useMemo } from 'react';
import { ParticlesBase } from './ParticlesBase';
import { commonParticlesOptions } from './particlesConfig';
import type { ISourceOptions } from '@tsparticles/engine';

interface GeometryBackgroundProps {
  id?: string;
  className?: string;
}

export const GeometryBackground = ({ id = "geometry-particles", className }: GeometryBackgroundProps) => {
  const options = useMemo((): ISourceOptions => ({
    ...commonParticlesOptions,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "grab" },
        onClick: { enable: true, mode: "push" },
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.5 } },
        push: { quantity: 4 },
      },
    },
    particles: {
      color: { value: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"] }, // Colorful mix
      links: {
        color: "random",
        distance: 150,
        enable: true,
        opacity: 0.3,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: true,
        speed: 1.5,
        straight: false,
      },
      number: {
        density: { enable: true },
        value: 40,
      },
      opacity: {
        value: { min: 0.3, max: 0.8 },
      },
      shape: {
        type: ["circle", "square", "triangle", "polygon"],
        options: {
          polygon: { sides: 6 } // Hexagons
        }
      },
      size: {
        value: { min: 4, max: 15 },
      },
    },
  }), []);

  return <ParticlesBase id={id} className={className} options={options} />;
};
