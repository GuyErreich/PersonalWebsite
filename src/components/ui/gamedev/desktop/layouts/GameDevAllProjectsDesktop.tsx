/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import type { SortOption } from "../../../common/controls/SortDropdown";
import { SortDropdown } from "../../../common/controls/SortDropdown";
import type { GameDevAllProjectsLayoutProps } from "../../common/data/types";
import { GameDevGallery } from "../../common/gallery/GameDevGallery";
import { GameDevPanelButton } from "../../common/panels/GameDevPanelButton";
import { GameDevPanelShell } from "../../common/panels/GameDevPanelShell";

type GameDevSortKey = "default" | "title-asc" | "title-desc";

const GAMEDEV_SORT_OPTIONS: SortOption[] = [
  { value: "default", label: "Default" },
  { value: "title-asc", label: "Title A \u2192 Z" },
  { value: "title-desc", label: "Title Z \u2192 A" },
];

export const GameDevAllProjectsDesktop = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
}: GameDevAllProjectsLayoutProps) => {
  const [sortKey, setSortKey] = useState<GameDevSortKey>("default");

  const sortedItems = useMemo(() => {
    if (sortKey === "title-asc")
      return [...galleryItems].sort((a, b) => a.title.localeCompare(b.title));
    if (sortKey === "title-desc")
      return [...galleryItems].sort((a, b) => b.title.localeCompare(a.title));
    return galleryItems;
  }, [galleryItems, sortKey]);

  return (
    <div className="gamedev-panel-frame">
      <GameDevPanelShell
        eyebrow="Full Gallery View"
        title="All Projects"
        rightAction={
          <div className="flex items-center gap-2">
            <SortDropdown
              value={sortKey}
              options={GAMEDEV_SORT_OPTIONS}
              onChange={(v) => setSortKey(v as GameDevSortKey)}
            />
            <GameDevPanelButton
              variant="secondary"
              hoverX={-3}
              onClick={onBack}
              icon={<ArrowLeft className="h-4 w-4" />}
              iconPosition="start"
            >
              Back
            </GameDevPanelButton>
          </div>
        }
      >
        <GameDevGallery items={sortedItems} iconMap={iconMap} isLoading={isLoading} />
      </GameDevPanelShell>
    </div>
  );
};
