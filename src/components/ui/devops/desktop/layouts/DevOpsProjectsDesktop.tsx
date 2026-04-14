/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { usePaginatedNavigation } from "../../../../../hooks/pagination/usePaginatedNavigation";
import { useMediaQuery } from "../../../../../hooks/responsive/useMediaQuery";
import { GhostSlotRepeater } from "../../../common/pagination/GhostSlotRepeater";
import { PaginatedSlideFrame } from "../../../common/pagination/PaginatedSlideFrame";
import { DevOpsProjectsGrid } from "../../common/cards/DevOpsProjectsGrid";
import type { DevOpsProject } from "../../common/data/types";
import { DevOpsPaginationDesktop } from "../pagination/DevOpsPaginationDesktop";

interface DevOpsProjectsDesktopProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsDesktop = ({ projects }: DevOpsProjectsDesktopProps) => {
  // xl+ (≥1280px): 6 cards in a 3-col grid; smaller desktop: 4 cards in 2-col grid
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShortScreen = useMediaQuery("(max-height: 700px)");
  // On short desktop screens fall back to 4 even on xl
  const ITEMS_PER_PAGE = isXl && !isShortScreen ? 6 : 4;

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const { safePage, direction, frameKey, goToPrev, goToNext, goToPage } = usePaginatedNavigation({
    totalPages,
  });
  const pageItems = projects.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="devops-paginated-shell">
      <div className="devops-paginated-scroll">
        <PaginatedSlideFrame
          direction={direction}
          frameKey={frameKey}
          contentClassName={
            isXl && !isShortScreen ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-6"
          }
        >
          {pageItems.map((project, index) => (
            <DevOpsProjectsGrid
              key={project.id}
              projects={[project]}
              className="contents"
              indexOffset={safePage * ITEMS_PER_PAGE + index}
              totalSlots={1}
            />
          ))}

          {/* Ghost cells to pad the grid so the container height is stable */}
          <GhostSlotRepeater
            count={Math.max(0, ITEMS_PER_PAGE - pageItems.length)}
            renderGhost={(i) => {
              const template = pageItems[0] || projects[0];
              if (!template) return <div key={i} />;

              return (
                <div
                  key={`ghost-${i}`}
                  className="opacity-0 pointer-events-none select-none"
                  aria-hidden="true"
                >
                  <DevOpsProjectsGrid
                    projects={[template]}
                    className="contents"
                    indexOffset={0}
                    totalSlots={1}
                  />
                </div>
              );
            }}
          />
        </PaginatedSlideFrame>
      </div>

      <DevOpsPaginationDesktop
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={goToPrev}
        onNext={goToNext}
        onGoTo={goToPage}
      />
    </div>
  );
};
