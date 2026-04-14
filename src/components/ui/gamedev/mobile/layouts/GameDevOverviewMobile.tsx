/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowRight } from "lucide-react";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevGallery } from "../../common/gallery/GameDevGallery";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";

export const GameDevOverviewMobile = ({
  showreelUrl,
  galleryItems,
  isLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  return (
    <div className="gamedev-overview-mobile-stack">
      <GameDevShowreelPanel showreelUrl={showreelUrl} />
      <div className="gamedev-mobile-panel-frame">
        <GameDevPanelShell
          eyebrow="Featured Gallery"
          title="Selected Work"
          description="A curated set of projects and prototypes highlighting gameplay, technical systems, and visual polish."
          footer={
            <GameDevPanelButton
              variant="primary"
              hoverX={3}
              onClick={onViewAll}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              View All Projects
            </GameDevPanelButton>
          }
        >
          <GameDevGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} compact />
        </GameDevPanelShell>
      </div>
    </div>
  );
};
