/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { usePaginatedNavigation } from "../../../../../hooks/pagination/usePaginatedNavigation";
import { useMediaQuery } from "../../../../../hooks/responsive/useMediaQuery";
import { useSwipeNavigation } from "../../../../../hooks/useSwipeNavigation";
import { playClickSound } from "../../../../../lib/sound/interactionSounds";
import { PaginatedSlideFrame } from "../../../common/pagination/PaginatedSlideFrame";
import { DevOpsProjectsGrid } from "../../common/cards/DevOpsProjectsGrid";
import type { DevOpsProject } from "../../common/data/types";
import { DevOpsPaginationDots } from "../../common/pagination/DevOpsPaginationDots";

const ITEMS_PER_PAGE_DEFAULT = 4;
const ITEMS_PER_PAGE_SHORT = 2;

interface DevOpsProjectsMobileProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsMobile = ({ projects }: DevOpsProjectsMobileProps) => {
  const isVeryShort = useMediaQuery("(max-height: 700px)");
  const ITEMS_PER_PAGE = isVeryShort ? ITEMS_PER_PAGE_SHORT : ITEMS_PER_PAGE_DEFAULT;

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const { safePage, canPrev, canNext, direction, frameKey, goToPrev, goToNext, goToPage } =
    usePaginatedNavigation({ totalPages });
  const pageItems = projects.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (canNext) {
        playClickSound();
        goToNext();
      }
    },
    onSwipeRight: () => {
      if (canPrev) {
        playClickSound();
        goToPrev();
      }
    },
  });

  return (
    <div className="devops-paginated-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="devops-paginated-scroll">
        <PaginatedSlideFrame
          direction={direction}
          frameKey={frameKey}
          clipClassName="relative overflow-x-hidden"
        >
          <DevOpsProjectsGrid
            projects={pageItems}
            className="grid grid-cols-2 gap-2"
            indexOffset={safePage * ITEMS_PER_PAGE}
          />
        </PaginatedSlideFrame>
      </div>

      <DevOpsPaginationDots currentPage={safePage} totalPages={totalPages} onGoTo={goToPage} />
    </div>
  );
};
