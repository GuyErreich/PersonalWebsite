import { useMemo } from 'react';
import { ParticlesBase } from './ParticlesBase';
import { commonParticlesOptions } from './particlesConfig';
import type { ISourceOptions } from '@tsparticles/engine';

interface GamingIconsBackgroundProps {
  id?: string;
  className?: string;
}

export const GamingIconsBackground = ({ id = "gaming-particles", className }: GamingIconsBackgroundProps) => {
  const options = useMemo((): ISourceOptions => ({
    ...commonParticlesOptions,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "bubble" },
      },
      modes: {
        bubble: { distance: 200, size: 30, duration: 2, opacity: 1 },
      },
    },
    particles: {
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: true,
        speed: 1,
        straight: false,
      },
      number: { 
        density: { enable: true },
        value: 20,
      },
      opacity: { value: 0.8 },
      shape: {
        type: ["char", "image"],
        options: {
          char: [
            { value: "△", font: "sans-serif", weight: "700", style: "", fill: true, close: true },
            { value: "○", font: "sans-serif", weight: "700", style: "", fill: true },
            { value: "✕", font: "sans-serif", weight: "700", style: "", fill: true },
            { value: "□", font: "sans-serif", weight: "700", style: "", fill: true }
          ],
          image: [
            { src: "https://raw.githubusercontent.com/devicons/devicon/master/icons/unity/unity-original.svg", width: 32, height: 32 },
            { src: "https://raw.githubusercontent.com/devicons/devicon/master/icons/unrealengine/unrealengine-original.svg", width: 32, height: 32 },
            { src: "https://raw.githubusercontent.com/devicons/devicon/master/icons/godot/godot-original.svg", width: 32, height: 32 },
            { src: "https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/gamepad-2.svg", width: 32, height: 32 },
            { src: "https://cdn.jsdelivr.net/npm/lucide-static@0.344.0/icons/ghost.svg", width: 32, height: 32 }
          ]
        }
      },
      color: {
        value: ["#00FF00", "#FF0000", "#0000FF", "#FF00FF"]
      },
      size: { value: { min: 14, max: 28 } },
    },
  }), []);

  return <ParticlesBase id={id} className={className} options={options} />;
};
