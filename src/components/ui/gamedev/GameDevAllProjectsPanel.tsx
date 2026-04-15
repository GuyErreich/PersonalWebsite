/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import type { GameDevAllProjectsLayoutProps } from "./common/data/types";
import { GameDevAllProjectsDesktop } from "./desktop/layouts/GameDevAllProjectsDesktop";
import { GameDevAllProjectsMobile } from "./mobile/layouts/GameDevAllProjectsMobile";

export const GameDevAllProjectsPanel = (props: GameDevAllProjectsLayoutProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) return <GameDevAllProjectsDesktop {...props} />;

  return <GameDevAllProjectsMobile {...props} />;
};
