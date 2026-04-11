/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useMediaQuery } from "../../../hooks/responsive/useMediaQuery";
import type { DevOpsProject } from "./common/types";
import { DevOpsProjectsDesktop } from "./desktop/DevOpsProjectsDesktop";
import { DevOpsProjectsMobile } from "./mobile/DevOpsProjectsMobile";

interface DevOpsProjectsPanelProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsPanel = ({ projects }: DevOpsProjectsPanelProps) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return <DevOpsProjectsDesktop projects={projects} />;
  }

  return <DevOpsProjectsMobile projects={projects} />;
};
