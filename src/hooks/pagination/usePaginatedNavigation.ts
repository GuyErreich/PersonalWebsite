/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState } from "react";

interface UsePaginatedNavigationOptions {
  totalPages: number;
  initialPage?: number;
}

export const usePaginatedNavigation = ({
  totalPages,
  initialPage = 0,
}: UsePaginatedNavigationOptions) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const directionRef = useRef(1);
  const frameKeyRef = useRef(0);

  const maxPageIndex = Math.max(0, totalPages - 1);
  const safePage = Math.max(0, Math.min(currentPage, maxPageIndex));
  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage);
    }
  }, [safePage, currentPage]);

  const goToPrev = () => {
    directionRef.current = -1;
    frameKeyRef.current++;
    setCurrentPage((page) => page - 1);
  };

  const goToNext = () => {
    directionRef.current = 1;
    frameKeyRef.current++;
    setCurrentPage((page) => page + 1);
  };

  const goToPage = (page: number) => {
    directionRef.current = page > safePage ? 1 : -1;
    frameKeyRef.current++;
    setCurrentPage(page);
  };

  return {
    safePage,
    canPrev,
    canNext,
    direction: directionRef.current,
    frameKey: frameKeyRef.current,
    goToPrev,
    goToNext,
    goToPage,
  };
};
