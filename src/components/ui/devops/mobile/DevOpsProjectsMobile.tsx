/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../../../hooks/responsive/useMediaQuery";
import { useSwipeNavigation } from "../../../../hooks/useSwipeNavigation";
import { slideXVariants } from "../../../../lib/motionVariants";
import { playClickSound } from "../../../../lib/sound/interactionSounds";
import { DevOpsPaginationDots } from "../common/DevOpsPaginationDots";
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
  const navCountRef = useRef(0);

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
    navCountRef.current++;
    setCurrentPage((p) => p - 1);
  };

  const goToNext = () => {
    directionRef.current = 1;
    navCountRef.current++;
    setCurrentPage((p) => p + 1);
  };

  const goToPage = (page: number) => {
    directionRef.current = page > safePage ? 1 : -1;
    navCountRef.current++;
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
        <motion.div layout transition={{ layout: { duration: 0.5, ease: "easeInOut" } }}>
          <div className="relative overflow-x-hidden">
            <AnimatePresence mode="popLayout" custom={directionRef.current}>
              <motion.div
                key={navCountRef.current}
                custom={directionRef.current}
                variants={slideXVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <DevOpsProjectsGrid
                  projects={pageItems}
                  className="grid grid-cols-2 gap-2"
                  indexOffset={safePage * ITEMS_PER_PAGE}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <DevOpsPaginationDots
        currentPage={safePage}
        totalPages={totalPages}
        onGoTo={goToPage}
      />
    </div>
  );
};
