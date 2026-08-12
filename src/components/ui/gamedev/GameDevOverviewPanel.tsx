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
  featuredItems,
  vfxItems,
  vfxError,
  isLoading,
  isVfxLoading,
  iconMap,
  onViewAll,
}: GameDevOverviewLayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <GameDevOverviewDesktop
        showreelUrl={showreelUrl}
        featuredItems={featuredItems}
        vfxItems={vfxItems}
        vfxError={vfxError}
        isLoading={isLoading}
        isVfxLoading={isVfxLoading}
        iconMap={iconMap}
        onViewAll={onViewAll}
      />
    );
  }

  return (
    <GameDevOverviewMobileShort
      showreelUrl={showreelUrl}
      featuredItems={featuredItems}
      vfxItems={vfxItems}
      vfxError={vfxError}
      isLoading={isLoading}
      isVfxLoading={isVfxLoading}
      iconMap={iconMap}
      onViewAll={onViewAll}
    />
  );
};
