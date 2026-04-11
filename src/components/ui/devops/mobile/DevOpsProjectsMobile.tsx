/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { DevOpsProjectsGrid } from "../common/DevOpsProjectsGrid";
import type { DevOpsProject } from "../common/types";

interface DevOpsProjectsMobileProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsMobile = ({ projects }: DevOpsProjectsMobileProps) => {
  return <DevOpsProjectsGrid projects={projects} className="grid grid-cols-1 gap-5" />;
};
