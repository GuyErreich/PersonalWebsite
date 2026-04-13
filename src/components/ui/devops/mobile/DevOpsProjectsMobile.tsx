/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../../../hooks/responsive/useMediaQuery";
import { useSwipeNavigation } from "../../../../hooks/useSwipeNavigation";
import { playClickSound } from "../../../../lib/sound/interactionSounds";
import { DevOpsPaginationControls } from "../common/DevOpsPaginationControls";
import { DevOpsProjectsGrid } from "../common/DevOpsProjectsGrid";
import type { DevOpsProject } from "../common/types";

const ITEMS_PER_PAGE_DEFAULT = 4;
const ITEMS_PER_PAGE_SHORT = 2;

interface DevOpsProjectsMobileProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsMobile = ({ projects }: DevOpsProjectsMobileProps) => {
  const isVeryShort = useMediaQuery("(max-height: 700px)");
  const ITEMS_PER_PAGE = isVeryShort ? ITEMS_PER_PAGE_SHORT : ITEMS_PER_PAGE_DEFAULT;

  const [currentPage, setCurrentPage] = useState(0);
  const directionRef = useRef(1);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  // Clamp page in case screen height changes after user navigated
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const pageItems = projects.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  // Keep currentPage state in sync with safePage so navigation & swipe use the correct base
  useEffect(() => {
    if (currentPage !== safePage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  const goToPrev = () => {
    directionRef.current = -1;
    setCurrentPage((p) => p - 1);
  };

  const goToNext = () => {
    directionRef.current = 1;
    setCurrentPage((p) => p + 1);
  };

  const goToPage = (page: number) => {
    directionRef.current = page > safePage ? 1 : -1;
    setCurrentPage(page);
  };

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: () => {
      if (safePage < totalPages - 1) {
        playClickSound();
        goToNext();
      }
    },
    onSwipeRight: () => {
      if (safePage > 0) {
        playClickSound();
        goToPrev();
      }
    },
  });

  return (
    <div className="devops-paginated-shell" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="devops-paginated-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${safePage}-${ITEMS_PER_PAGE}`}
            initial={{ opacity: 0, x: directionRef.current * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: directionRef.current * -50 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <DevOpsProjectsGrid
              projects={pageItems}
              className="grid grid-cols-2 gap-2"
              indexOffset={safePage * ITEMS_PER_PAGE}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <DevOpsPaginationControls
        currentPage={safePage}
        totalPages={totalPages}
        onPrev={goToPrev}
        onNext={goToNext}
        onGoTo={goToPage}
      />
    </div>
  );
};
