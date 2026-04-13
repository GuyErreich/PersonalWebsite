/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../../../../hooks/responsive/useMediaQuery";
import { slideXVariants } from "../../../../lib/motionVariants";
import { DevOpsProjectsGrid } from "../common/DevOpsProjectsGrid";
import type { DevOpsProject } from "../common/types";
import { DevOpsPaginationDesktop } from "./DevOpsPaginationDesktop";

interface DevOpsProjectsDesktopProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsDesktop = ({ projects }: DevOpsProjectsDesktopProps) => {
  // xl+ (≥1280px): 6 cards in a 3-col grid; smaller desktop: 4 cards in 2-col grid
  const isXl = useMediaQuery("(min-width: 1280px)");
  const isShortScreen = useMediaQuery("(max-height: 700px)");
  // On short desktop screens fall back to 4 even on xl
  const ITEMS_PER_PAGE = isXl && !isShortScreen ? 6 : 4;

  const [currentPage, setCurrentPage] = useState(0);
  const directionRef = useRef(1);
  const navCountRef = useRef(0);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(0, totalPages - 1));
  const pageItems = projects.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  // Clamp page when ITEMS_PER_PAGE changes (viewport resize)
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

  return (
    <div className="devops-paginated-shell">
      <div className="devops-paginated-scroll">
        {/* overflow-x clips the slide animation; negative my absorbs the padding so layout is unchanged */}
        <motion.div layout transition={{ layout: { duration: 0.5, ease: "easeInOut" } }}>
          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout" custom={directionRef.current}>
              <motion.div
                key={navCountRef.current}
                custom={directionRef.current}
                variants={slideXVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className={
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
                {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - pageItems.length) }).map(
                  (_, i) => {
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
                  },
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
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
