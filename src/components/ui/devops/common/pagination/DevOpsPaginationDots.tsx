/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { PaginationDots } from "../../../common/pagination/PaginationDots";

interface DevOpsPaginationDotsProps {
  currentPage: number;
  totalPages: number;
  onGoTo: (page: number) => void;
}

export const DevOpsPaginationDots = ({
  currentPage,
  totalPages,
  onGoTo,
}: DevOpsPaginationDotsProps) => {
  return (
    <PaginationDots
      currentPage={currentPage}
      totalPages={totalPages}
      onGoTo={onGoTo}
      onDotHover={playHoverSound}
      onDotClick={playClickSound}
      activeDotClassName="h-2 w-5 bg-blue-400"
      inactiveDotClassName="h-2 w-2 bg-gray-600 hover:bg-gray-400"
    />
  );
};
