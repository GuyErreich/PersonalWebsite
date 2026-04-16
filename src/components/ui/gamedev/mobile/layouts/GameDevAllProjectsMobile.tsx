/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowLeft } from "lucide-react";
import { StackFilterBar } from "../../../common/filters/StackFilterBar";
import type { GameDevSortKey } from "../../common/data/filtering";
import { GAMEDEV_SORT_OPTIONS, GAMEDEV_STACK_FILTER_THEME } from "../../common/data/filtering";
import type { GameDevAllProjectsLayoutProps } from "../../common/data/types";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";
import { GameDevHiveGallery } from "../gallery/GameDevHiveGallery";

export const GameDevAllProjectsMobile = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
  search,
  onSearchChange,
  allStacks,
  activeStacks,
  onStackToggle,
  onClearStacks,
  sortKey,
  onSortChange,
}: GameDevAllProjectsLayoutProps) => {
  return (
    <div className="gamedev-mobile-panel-frame">
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
        clipScroll
      >
        <div className="shrink-0">
          <StackFilterBar
            search={search}
            onSearchChange={onSearchChange}
            allStacks={allStacks}
            activeStacks={activeStacks}
            onStackToggle={onStackToggle}
            onClearStacks={onClearStacks}
            sortKey={sortKey}
            sortOptions={GAMEDEV_SORT_OPTIONS}
            onSortChange={(value) => onSortChange(value as GameDevSortKey)}
            dropdownAriaLabel="Filter by game development stack"
            listAriaLabel="Game development stack options"
            theme={GAMEDEV_STACK_FILTER_THEME}
          />
        </div>

        <GameDevHiveGallery items={galleryItems} iconMap={iconMap} isLoading={isLoading} />
      </GameDevPanelShell>
    </div>
  );
};
