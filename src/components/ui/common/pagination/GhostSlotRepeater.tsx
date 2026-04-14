/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";

interface GhostSlotRepeaterProps {
  count: number;
  renderGhost: (index: number) => ReactNode;
}

export const GhostSlotRepeater = ({ count, renderGhost }: GhostSlotRepeaterProps) => {
  return <>{Array.from({ length: count }).map((_, index) => renderGhost(index))}</>;
};
