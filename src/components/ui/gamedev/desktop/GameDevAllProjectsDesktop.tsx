/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowLeft } from "lucide-react";
import { GameDevGallery } from "../../GameDevGallery";
import { GameDevPanelButton } from "../common/GameDevPanelButton";
import { GameDevPanelShell } from "../common/GameDevPanelShell";
import type { GameDevAllProjectsLayoutProps } from "../common/types";

export const GameDevAllProjectsDesktop = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
}: GameDevAllProjectsLayoutProps) => {
  return (
    <div className="gamedev-panel-frame">
      <GameDevPanelShell
        eyebrow="Full Gallery View"
        title="All Projects"
        rightAction={
          <GameDevPanelButton
            variant="secondary"
            hoverX={-3}
            onClick={onBack}
            icon={<ArrowLeft className="h-4 w-4" />}
            iconPosition="start"
          >
            Back
          </GameDevPanelButton>
        }
      >
        <GameDevGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} />
      </GameDevPanelShell>
    </div>
  );
};
