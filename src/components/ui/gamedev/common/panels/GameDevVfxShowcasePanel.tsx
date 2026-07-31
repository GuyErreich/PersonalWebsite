/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Sparkles } from "lucide-react";
import { GameDevVfxSlider } from "../media/GameDevVfxSlider";
import type { GameDevVfxItem } from "../data/types";
import { GameDevVfxIntro } from "./GameDevVfxIntro";

interface GameDevVfxShowcasePanelProps {
  vfxItems: GameDevVfxItem[];
  isLoading: boolean;
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

export const GameDevVfxShowcasePanel = ({ vfxItems, isLoading }: GameDevVfxShowcasePanelProps) => {
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
        <GameDevVfxSlider items={vfxItems} />
      </div>
    </div>
  );
};
