/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useDevOpsSectionData } from "../hooks/devops/useDevOpsSectionData";
import { useMediaQuery } from "../hooks/responsive/useMediaQuery";
import { DevOpsBackground } from "./ui/devops/common/DevOpsBackground";
import { DevOpsProjectsPanel } from "./ui/devops/DevOpsProjectsPanel";
import { SectionEntranceOverlay } from "./ui/SectionEntranceOverlay";
import { SectionHeader } from "./ui/SectionHeader";
import { SectionWrapper } from "./ui/SectionWrapper";

export const DevOpsSection = () => {
  const { projects, isLoading } = useDevOpsSectionData();
  const isShortScreen = useMediaQuery("(max-height: 800px)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isCompact = isShortScreen || isMobile;

  return (
    <SectionEntranceOverlay theme="devops">
      <SectionWrapper
        id="devops"
        className="section-screen !py-0 bg-gray-950"
        innerClassName={
          isCompact
            ? "justify-start pt-20 pb-2 md:pt-8 md:pb-6"
            : "justify-start pt-10 pb-8 md:pt-8 md:pb-6"
        }
        bottomFadeClassName="h-28 md:h-[200px]"
        background={<DevOpsBackground />}
      >
        <SectionHeader
          title="DevOps & Automation"
          description="Building reliable infrastructure, automating workflows, and creating tools that empower developers."
          className={isCompact ? "mb-4" : "mb-8"}
          compact={isCompact}
        />
        <DevOpsProjectsPanel projects={projects} isLoading={isLoading} />
      </SectionWrapper>
    </SectionEntranceOverlay>
  );
};
