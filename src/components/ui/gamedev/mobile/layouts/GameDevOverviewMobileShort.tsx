/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowRight } from "lucide-react";
import type { GameDevOverviewLayoutProps } from "../../common/data/types";
import { GameDevOverviewTabs } from "../../common/panels/GameDevOverviewTabs";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevShowreelPanel } from "../../common/panels/GameDevShowreelPanel";
import { GameDevVfxShowcasePanel } from "../../common/panels/GameDevVfxShowcasePanel";
import { GameDevHiveGallery } from "../gallery/GameDevHiveGallery";

const MOBILE_SHORT_OVERVIEW_TAB_CLASS_NAMES = {
  root: "gamedev-overview-mobile-short-stack",
  tabList: "gamedev-mobile-short-tabs",
  tab: "gamedev-mobile-short-tab-btn",
  tabActive: "gamedev-mobile-short-tab-btn--active",
  content: "gamedev-mobile-short-content",
  panel: "gamedev-mobile-short-panel",
  panelByTab: {
    vfx: "gamedev-mobile-short-panel--clip",
  },
} as const;

export const GameDevOverviewMobileShort = ({
  showreelUrl,
  featuredItems,
  vfxItems,
  isLoading,
  isVfxLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  return (
    <GameDevOverviewTabs
      idScope="mobile"
      classNames={MOBILE_SHORT_OVERVIEW_TAB_CLASS_NAMES}
      tabIconClassName="h-3.5 w-3.5"
      showreel={<GameDevShowreelPanel showreelUrl={showreelUrl} />}
      projects={
        <GameDevPanelShell
          eyebrow="Featured Gallery"
          title="Selected Work"
          className="h-full"
          clipScroll
          rightAction={
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
          <GameDevHiveGallery
            items={featuredItems}
            iconMap={iconMap}
            isLoading={isLoading}
            emptyMessage="No featured projects yet."
          />
        </GameDevPanelShell>
      }
      vfx={
        <div className="gamedev-vfx-showcase">
          <GameDevVfxShowcasePanel vfxItems={vfxItems} isLoading={isVfxLoading} />
        </div>
      }
    />
  );
};
