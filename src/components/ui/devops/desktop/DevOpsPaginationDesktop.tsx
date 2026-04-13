/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { PaginationDesktop } from "../../common/desktop/PaginationDesktop";

interface DevOpsPaginationDesktopProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
}

export const DevOpsPaginationDesktop = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoTo,
}: DevOpsPaginationDesktopProps) => {
  return (
    <PaginationDesktop
      currentPage={currentPage}
      totalPages={totalPages}
      onPrev={onPrev}
      onNext={onNext}
      onGoTo={onGoTo}
      onControlHover={playHoverSound}
      onControlClick={playClickSound}
      activeDotClassName="h-2 w-5 rounded-sm bg-blue-400"
      inactiveDotClassName="h-2 w-2 rounded-sm bg-gray-600 hover:bg-gray-400"
      arrowsClassName="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-blue-500/40 enabled:hover:text-white"
    />
  );
};
