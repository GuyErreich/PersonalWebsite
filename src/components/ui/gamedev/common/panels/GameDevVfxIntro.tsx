/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

interface GameDevVfxIntroProps {
  effectCount: number;
  isLoading?: boolean;
}

export const GameDevVfxIntro = ({ effectCount, isLoading = false }: GameDevVfxIntroProps) => {
  return (
    <header className="gamedev-vfx-intro">
      <p className="gamedev-vfx-intro-copy">
        Real-time shaders, particles, and VFX from recent work.
      </p>
      {isLoading ? (
        <div className="gamedev-vfx-intro-meta-skeleton" aria-hidden="true" />
      ) : effectCount > 0 ? (
        <p className="gamedev-vfx-intro-meta">
          {effectCount} effect{effectCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </header>
  );
};
