/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

interface DevOpsLetterTouchBubbleProps {
  letter: string;
  x: number;
  y: number;
}

const FINGER_OFFSET_Y = 78;

export const DevOpsLetterTouchBubble = ({ letter, x, y }: DevOpsLetterTouchBubbleProps) => {
  return (
    <div
      className="pointer-events-none absolute z-[60] flex h-16 w-16 items-center justify-center rounded-full border border-blue-200/70 bg-blue-500/95 text-3xl font-bold text-white shadow-[0_14px_40px_rgba(59,130,246,0.5)]"
      style={{
        left: x,
        top: y - FINGER_OFFSET_Y,
        transform: "translate(-50%, 0)",
      }}
    >
      {letter}
    </div>
  );
};
