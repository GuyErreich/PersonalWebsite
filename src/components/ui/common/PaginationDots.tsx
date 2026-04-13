/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";

interface PaginationDotsProps {
  currentPage: number;
  totalPages: number;
  onGoTo: (page: number) => void;
  activeDotClassName: string;
  inactiveDotClassName: string;
  wrapperClassName?: string;
  dotsClassName?: string;
  onDotHover?: () => void;
  onDotClick?: () => void;
}

export const PaginationDots = ({
  currentPage,
  totalPages,
  onGoTo,
  activeDotClassName,
  inactiveDotClassName,
  wrapperClassName = "mt-4 flex items-center justify-center gap-2 overflow-visible px-2 transition-opacity duration-200",
  dotsClassName = "flex items-center gap-1.5",
  onDotHover,
  onDotClick,
}: PaginationDotsProps) => {
  const hidden = totalPages <= 1;

  return (
    <div className={`${wrapperClassName} ${hidden ? "pointer-events-none opacity-0" : ""}`}>
      <div className={dotsClassName}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <motion.button
            key={i}
            type="button"
            aria-label={`Go to page ${i + 1}`}
            aria-current={i === currentPage ? "page" : undefined}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => onDotHover?.()}
            onClick={() => {
              onDotClick?.();
              onGoTo(i);
            }}
            className={`block rounded-sm transition-all duration-300 ${
              i === currentPage ? activeDotClassName : inactiveDotClassName
            }`}
          />
        ))}
      </div>
    </div>
  );
};