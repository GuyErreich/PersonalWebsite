/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { DevOpsPaginationControls } from "../common/DevOpsPaginationControls";
import { DevOpsProjectsGrid } from "../common/DevOpsProjectsGrid";
import type { DevOpsProject } from "../common/types";

const ITEMS_PER_PAGE = 4;

interface DevOpsProjectsDesktopProps {
  projects: DevOpsProject[];
}

export const DevOpsProjectsDesktop = ({ projects }: DevOpsProjectsDesktopProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const directionRef = useRef(1);

  const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
  const pageItems = projects.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  const goToPrev = () => {
    directionRef.current = -1;
    setCurrentPage((p) => p - 1);
  };

  const goToNext = () => {
    directionRef.current = 1;
    setCurrentPage((p) => p + 1);
  };

  return (
    <div className="devops-paginated-shell">
      <div className="devops-paginated-scroll">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: directionRef.current * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: directionRef.current * -50 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
          >
            <DevOpsProjectsGrid
              projects={pageItems}
              className="grid grid-cols-2 gap-6"
              indexOffset={currentPage * ITEMS_PER_PAGE}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <DevOpsPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
};
