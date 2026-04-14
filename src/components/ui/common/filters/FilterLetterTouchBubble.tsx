/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

interface FilterLetterTouchBubbleProps {
  letter: string;
  x: number;
  y: number;
  className: string;
}

const FINGER_OFFSET_Y = 78;

export const FilterLetterTouchBubble = ({
  letter,
  x,
  y,
  className,
}: FilterLetterTouchBubbleProps) => {
  return (
    <div
      className={className}
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
