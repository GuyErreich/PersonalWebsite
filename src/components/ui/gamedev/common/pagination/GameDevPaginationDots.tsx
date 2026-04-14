/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { playClickSound, playHoverSound } from "../../../../../lib/sound/interactionSounds";
import { PaginationDots } from "../../../common/pagination/PaginationDots";

interface GameDevPaginationDotsProps {
  currentPage: number;
  totalPages: number;
  onGoTo: (page: number) => void;
}

export const GameDevPaginationDots = ({
  currentPage,
  totalPages,
  onGoTo,
}: GameDevPaginationDotsProps) => {
  return (
    <PaginationDots
      currentPage={currentPage}
      totalPages={totalPages}
      onGoTo={onGoTo}
      onDotHover={playHoverSound}
      onDotClick={playClickSound}
      wrapperClassName="flex items-center justify-center"
      dotsClassName="flex items-center gap-1"
      activeDotClassName="h-2 w-5 rounded-sm bg-purple-400"
      inactiveDotClassName="h-2 w-2 rounded-sm bg-gray-600 hover:bg-gray-400"
    />
  );
};
