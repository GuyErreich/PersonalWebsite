/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { CSSProperties, ReactNode, RefObject } from "react";

interface ScrollViewportProps {
  children: ReactNode;
  height: number;
  className?: string;
  viewportRef?: RefObject<HTMLDivElement | null>;
}

export const ScrollViewport = ({
  children,
  height,
  className,
  viewportRef,
}: ScrollViewportProps) => {
  const viewportStyle: CSSProperties = { height, overflow: "hidden" };

  return (
    <div ref={viewportRef} style={viewportStyle} className={className}>
      {children}
    </div>
  );
};
