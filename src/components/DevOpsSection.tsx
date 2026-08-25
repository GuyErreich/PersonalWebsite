/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { lazy, Suspense, useCallback, useState } from "react";
import { useDevOpsSectionData } from "../hooks/devops/useDevOpsSectionData";
import { useMediaQuery } from "../hooks/responsive/useMediaQuery";
import { SectionEntranceOverlay } from "./ui/common/sections/SectionEntranceOverlay";
import { SectionHeader } from "./ui/common/sections/SectionHeader";
import { SectionWrapper } from "./ui/common/sections/SectionWrapper";
import { DevOpsProjectsPanel } from "./ui/devops/DevOpsProjectsPanel";

const DevOpsBackground = lazy(async () => {
  const module = await import("./ui/devops/common/visuals/DevOpsBackground");
  return { default: module.DevOpsBackground };
});

export const DevOpsSection = () => {
  const [isNearViewport, setIsNearViewport] = useState(false);
  const handleNearViewChange = useCallback((isNearView: boolean) => {
    setIsNearViewport(isNearView);
  }, []);

  const { projects, isLoading } = useDevOpsSectionData({ enabled: isNearViewport });

  const isShortScreen = useMediaQuery("(max-height: 800px)");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isCompact = isShortScreen || isMobile;

  return (
    <SectionEntranceOverlay theme="devops">
      <SectionWrapper
        id="devops"
        className="section-screen section-desktop-offset bg-gray-950"
        innerClassName={isCompact ? "justify-start pt-3 pb-2" : "justify-start pt-6 pb-4"}
        bottomFadeClassName="h-28 md:h-[200px]"
        background={
          <Suspense fallback={null}>
            <DevOpsBackground />
          </Suspense>
        }
        backgroundInViewOnly
        onNearViewChange={handleNearViewChange}
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
