/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { DevOpsProjectsGrid } from "../common/DevOpsProjectsGrid";
import type { DevOpsProject } from "../common/types";

interface DevOpsProjectsDesktopProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsDesktop = ({ projects }: DevOpsProjectsDesktopProps) => {
  return <DevOpsProjectsGrid projects={projects} className="grid grid-cols-2 gap-8" />;
};
