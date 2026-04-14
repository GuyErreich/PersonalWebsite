/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import type { GameDevOverviewLayoutProps } from "./common/data/types";
import { GameDevOverviewDesktop } from "./desktop/layouts/GameDevOverviewDesktop";
import { GameDevOverviewMobileShort } from "./mobile/layouts/GameDevOverviewMobileShort";

export const GameDevOverviewPanel = ({
  showreelUrl,
  galleryItems,
  isLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <GameDevOverviewDesktop
        showreelUrl={showreelUrl}
        galleryItems={galleryItems}
        isLoading={isLoading}
        iconMap={iconMap}
        onViewAll={onViewAll}
      />
    );
  }

  // All mobile phones use the tabbed layout so both showreel and projects
  // are accessible without vertical overflow
  return (
    <GameDevOverviewMobileShort
      showreelUrl={showreelUrl}
      galleryItems={galleryItems}
      isLoading={isLoading}
      iconMap={iconMap}
      onViewAll={onViewAll}
    />
  );
};
