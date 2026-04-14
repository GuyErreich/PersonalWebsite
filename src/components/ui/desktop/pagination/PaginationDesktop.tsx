/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaginationDots } from "../../common/pagination/PaginationDots";

interface PaginationDesktopProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
  activeDotClassName: string;
  inactiveDotClassName: string;
  arrowsClassName: string;
  wrapperClassName?: string;
  dotsWrapperClassName?: string;
  onControlHover?: () => void;
  onControlClick?: () => void;
}

export const PaginationDesktop = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoTo,
  activeDotClassName,
  inactiveDotClassName,
  arrowsClassName,
  wrapperClassName = "mt-4 flex items-center justify-center gap-2 overflow-visible px-2 transition-opacity duration-200",
  dotsWrapperClassName = "flex items-center justify-center",
  onControlHover,
  onControlClick,
}: PaginationDesktopProps) => {
  const hidden = totalPages <= 1;
  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  return (
    <div className={`${wrapperClassName} ${hidden ? "pointer-events-none opacity-0" : ""}`}>
      <motion.button
        type="button"
        aria-label="Previous page"
        disabled={!canPrev}
        whileHover={canPrev ? { scale: 1.1 } : {}}
        whileTap={canPrev ? { scale: 0.9 } : {}}
        onMouseEnter={() => {
          if (canPrev) onControlHover?.();
        }}
        onClick={() => {
          if (canPrev) {
            onControlClick?.();
            onPrev();
          }
        }}
        className={arrowsClassName}
      >
        <ChevronLeft className="h-4 w-4" />
      </motion.button>

      <PaginationDots
        currentPage={currentPage}
        totalPages={totalPages}
        onGoTo={onGoTo}
        onDotHover={onControlHover}
        onDotClick={onControlClick}
        wrapperClassName={dotsWrapperClassName}
        dotsClassName="flex items-center gap-1"
        activeDotClassName={activeDotClassName}
        inactiveDotClassName={inactiveDotClassName}
      />

      <motion.button
        type="button"
        aria-label="Next page"
        disabled={!canNext}
        whileHover={canNext ? { scale: 1.1 } : {}}
        whileTap={canNext ? { scale: 0.9 } : {}}
        onMouseEnter={() => {
          if (canNext) onControlHover?.();
        }}
        onClick={() => {
          if (canNext) {
            onControlClick?.();
            onNext();
          }
        }}
        className={arrowsClassName}
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    </div>
  );
};
