/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import type { GameDevAllProjectsLayoutProps } from "./common/types";
import { GameDevAllProjectsDesktop } from "./desktop/GameDevAllProjectsDesktop";
import { GameDevAllProjectsMobile } from "./mobile/GameDevAllProjectsMobile";

export const GameDevAllProjectsPanel = ({
  galleryItems,
  isLoading,
  iconMap,
  onBack,
}: GameDevAllProjectsLayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <GameDevAllProjectsDesktop
        galleryItems={galleryItems}
        isLoading={isLoading}
        iconMap={iconMap}
        onBack={onBack}
      />
    );
  }

  return (
    <GameDevAllProjectsMobile
      galleryItems={galleryItems}
      isLoading={isLoading}
      iconMap={iconMap}
      onBack={onBack}
    />
  );
};
