import type { ISourceOptions } from '@tsparticles/engine';

// Reusable base options that all particle configurations share
export const commonParticlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 120,
  detectRetina: true,
};
