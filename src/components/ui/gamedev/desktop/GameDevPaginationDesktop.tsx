/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { PaginationDesktop } from "../../common/desktop/PaginationDesktop";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";

interface GameDevPaginationDesktopProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
}

export const GameDevPaginationDesktop = ({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoTo,
}: GameDevPaginationDesktopProps) => {
  return (
    <PaginationDesktop
      currentPage={currentPage}
      totalPages={totalPages}
      onPrev={onPrev}
      onNext={onNext}
      onGoTo={onGoTo}
      onControlHover={playHoverSound}
      onControlClick={playClickSound}
      wrapperClassName="sticky bottom-0 z-10 flex items-center justify-center gap-2 rounded-b-2xl bg-[#08101b]/90 py-2 backdrop-blur-sm"
      activeDotClassName="h-2 w-5 rounded-sm bg-purple-400"
      inactiveDotClassName="h-2 w-2 rounded-sm bg-gray-600 hover:bg-gray-400"
      arrowsClassName="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-400 transition-colors disabled:opacity-30 enabled:hover:border-purple-500/40 enabled:hover:text-white"
    />
  );
};