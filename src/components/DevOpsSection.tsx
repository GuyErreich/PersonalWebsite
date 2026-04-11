/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { DevOpsBackground } from "./ui/devops/common/DevOpsBackground";
import { devOpsProjects } from "./ui/devops/common/projects";
import { DevOpsProjectsPanel } from "./ui/devops/DevOpsProjectsPanel";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";
import { SectionHeader } from "./ui/SectionHeader";
import { SectionWrapper } from "./ui/SectionWrapper";

export const DevOpsSection = () => {
  return (
    <SectionEntranceOverlay theme="devops">
      <SectionWrapper
        id="devops"
        className="section-screen bg-gray-950"
        bottomFadeClassName="h-28 md:h-200"
        background={<DevOpsBackground />}
      >
        <SectionHeader
          title="DevOps & Automation"
          description="Building reliable infrastructure, automating workflows, and creating tools that empower developers."
        />
        <DevOpsProjectsPanel projects={devOpsProjects} />
      </SectionWrapper>
    </SectionEntranceOverlay>
  );
};
