import type { ISourceOptions } from "@tsparticles/engine";
import { useMemo } from "react";
import { ParticlesBase } from "./ParticlesBase";
import { commonParticlesOptions } from "./particlesConfig";

interface CodeBackgroundProps {
  id?: string;
  className?: string;
  textValues?: string[];
}

export const CodeBackground = ({
  id = "code-particles",
  className,
  textValues = ["Docker", "K8s", "AWS", "Terraform", "CI/CD", "Linux"],
}: CodeBackgroundProps) => {
  const options = useMemo(
    (): ISourceOptions => ({
      ...commonParticlesOptions,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
        },
        modes: {
          repulse: { distance: 100, duration: 0.4 },
        },
      },
      particles: {
        color: { value: ["#10b981", "#3b82f6", "#f59e0b"] }, // emerald, blue, amber
        move: {
          direction: "top", // Code flows upwards like the Matrix
          enable: true,
          outModes: { default: "out" },
          random: false,
          speed: 1,
          straight: true,
        },
        number: {
          density: { enable: true },
          value: 40,
        },
        opacity: {
          value: { min: 0.3, max: 0.8 },
        },
        shape: {
          type: "char",
          options: {
            char: {
              value: textValues,
              font: "monospace",
              style: "",
              weight: "400",
            },
          },
        },
        size: {
          value: { min: 10, max: 20 },
        },
      },
    }),
    [textValues],
  );

  return <ParticlesBase id={id} className={className} options={options} />;
};
