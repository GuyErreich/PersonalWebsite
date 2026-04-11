/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import type { GameDevOverviewLayoutProps } from "./common/types";
import { GameDevOverviewDesktop } from "./desktop/GameDevOverviewDesktop";
import { GameDevOverviewMobile } from "./mobile/GameDevOverviewMobile";

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

  return (
    <GameDevOverviewMobile
      showreelUrl={showreelUrl}
      galleryItems={galleryItems}
      isLoading={isLoading}
      iconMap={iconMap}
      onViewAll={onViewAll}
    />
  );
};
