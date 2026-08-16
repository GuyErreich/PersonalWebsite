/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowRight } from "lucide-react";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevGallery } from "../../common/gallery/GameDevGallery";
import { GameDevOverviewTabs } from "../../common/panels/GameDevOverviewTabs";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevVfxShowcasePanel } from "../../common/panels/GameDevVfxShowcasePanel";

const DESKTOP_OVERVIEW_TAB_CLASS_NAMES = {
  root: "gamedev-overview-desktop-tabs-stack",
  tabList: "gamedev-desktop-overview-tabs",
  tab: "gamedev-desktop-overview-tab",
  tabActive: "gamedev-desktop-overview-tab--active",
  content: "gamedev-overview-tab-content",
  panel: "h-full",
} as const;

export const GameDevOverviewDesktop = ({
  showreelUrl,
  featuredItems,
  vfxItems,
  vfxError,
  isLoading,
  isVfxLoading,
  iconMap,
  onViewAll,
  isActive: isPanelActive = true,
}: GameDevOverviewLayoutProps) => {
  return (
    <GameDevOverviewTabs
      idScope="desktop"
      classNames={DESKTOP_OVERVIEW_TAB_CLASS_NAMES}
      tabIconClassName="h-4 w-4"
      showreel={(isActive) => (
        <GameDevShowreelPanel
          showreelUrl={showreelUrl}
          isActive={isPanelActive && isActive}
        />
      )}
      projects={() => (
        <div className="gamedev-panel-frame">
          <GameDevPanelShell
            eyebrow="Featured Gallery"
            title="Selected Work"
            clipScroll
            rightAction={
              <div className="flex shrink-0 flex-col items-end gap-2">
                {featuredItems.length > 0 ? (
                  <p className="gamedev-panel-meta">{featuredItems.length} items</p>
                ) : null}
                <GameDevPanelButton
                  variant="primary"
                  hoverX={3}
                  onClick={onViewAll}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  View All Projects
                </GameDevPanelButton>
              </div>
            }
          >
            <GameDevGallery
              items={featuredItems}
              iconMap={iconMap}
              isLoading={isLoading}
              denseCards
              emptyMessage="No featured projects yet."
            />
          </GameDevPanelShell>
        </div>
      )}
      vfx={(isActive) => (
        <div className="gamedev-vfx-showcase">
          <GameDevVfxShowcasePanel
            vfxItems={vfxItems}
            isLoading={isVfxLoading}
            vfxError={vfxError}
            isActive={isPanelActive && isActive}
          />
        </div>
      )}
    />
  );
};
