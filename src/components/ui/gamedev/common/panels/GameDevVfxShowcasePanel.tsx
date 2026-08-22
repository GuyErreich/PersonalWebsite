/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Sparkles } from "lucide-react";
import type { GameDevVfxItem } from "../data/types";
import { GameDevVfxSlider } from "../media/GameDevVfxSlider";
import { GameDevVfxIntro } from "./GameDevVfxIntro";

interface GameDevVfxShowcasePanelProps {
  vfxItems: GameDevVfxItem[];
  isLoading: boolean;
  vfxError?: string | null;
  /** When false, pause VFX media (overview tab hidden but mounted). */
  isActive?: boolean;
}

const VfxLoadingStage = () => (
  <div className="gamedev-vfx-slider gamedev-vfx-slider--loading" data-no-swipe-page>
    <div className="gamedev-vfx-slider-deck-zone">
      <div className="gamedev-vfx-slider-deck">
        <div className="gamedev-vfx-slider-card-skeleton animate-pulse" />
      </div>
    </div>
    <div className="gamedev-vfx-slider-rail-wrap">
      <p className="gamedev-vfx-slider-rail-label">Browse</p>
      <div className="gamedev-vfx-slider-rail">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="gamedev-vfx-slider-thumb animate-pulse bg-slate-800/70" />
        ))}
      </div>
    </div>
  </div>
);

export const GameDevVfxShowcasePanel = ({
  vfxItems,
  isLoading,
  vfxError = null,
  isActive = true,
}: GameDevVfxShowcasePanelProps) => {
  if (isLoading) {
    return (
      <div className="gamedev-vfx-showcase-stack">
        <GameDevVfxIntro effectCount={0} isLoading />
        <div className="gamedev-vfx-stage">
          <VfxLoadingStage />
        </div>
      </div>
    );
  }

  if (vfxError) {
    return (
      <div className="gamedev-vfx-showcase-stack gamedev-vfx-showcase-stack--empty">
        <GameDevVfxIntro effectCount={0} />
        <div className="gamedev-vfx-stage gamedev-vfx-stage--empty">
          <div
            className="gamedev-vfx-empty-state rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-6"
            role="status"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-200/90">
              Visual Effects
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-50/90">{vfxError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (vfxItems.length === 0) {
    return (
      <div className="gamedev-vfx-showcase-stack gamedev-vfx-showcase-stack--empty">
        <GameDevVfxIntro effectCount={0} />
        <div className="gamedev-vfx-stage gamedev-vfx-stage--empty">
          <div className="gamedev-vfx-empty-state">
            <Sparkles className="mb-3 h-8 w-8 text-cyan-300/70" />
            <p className="text-sm font-medium text-slate-200">No VFX showcased yet</p>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Add visual effects in management to build your effects reel here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gamedev-vfx-showcase-stack">
      <GameDevVfxIntro effectCount={vfxItems.length} />
      <div className="gamedev-vfx-stage">
        <GameDevVfxSlider items={vfxItems} isActive={isActive} />
      </div>
    </div>
  );
};
