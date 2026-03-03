import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import { loadTextShape } from '@tsparticles/shape-text';
import { loadImageShape } from '@tsparticles/shape-image';
import type { Engine, ISourceOptions } from '@tsparticles/engine';

let engineInitialized = false;

interface ParticlesBaseProps {
  id: string;
  className?: string;
  options: ISourceOptions;
}

export const ParticlesBase = ({ id, className = "absolute inset-0 z-0 h-full w-full pointer-events-auto", options }: ParticlesBaseProps) => {
  const [init, setInit] = useState(engineInitialized);

  useEffect(() => {
    if (engineInitialized) {
      setInit(true);
      return;
    }
    
    initParticlesEngine(async (engine: Engine) => {
      // Load the slim version which includes exactly what we need for lines and circles
      await loadSlim(engine);
      // Load text shape specifically for the code/tagline variants
      await loadTextShape(engine);
      // Load image shape for the icons variants
      await loadImageShape(engine);
    }).then(() => {
      engineInitialized = true;
      setInit(true);
    });
  }, []);

  if (!init) {
    return <div className="absolute inset-0 bg-gray-900" />;
  }

  return <Particles id={id} className={className} options={options} />;
};

// Reusable Base Options that all configurations share
export const commonParticlesOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 120,
  detectRetina: true,
};
