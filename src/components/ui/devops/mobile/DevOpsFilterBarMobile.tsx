/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */
import { DevOpsFilterBar } from "../common/DevOpsFilterBar";

export const DevOpsFilterBarMobile = (props: React.ComponentProps<typeof DevOpsFilterBar>) => {
  // Continuous scroll for filter list (future: wire up scrollRef to DevOpsFilterBar if needed)
  // Placeholder for future magnifier overlay logic
  return <DevOpsFilterBar {...props} />;
};
