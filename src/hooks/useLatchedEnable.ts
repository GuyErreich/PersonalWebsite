/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";

/**
 * Latches `true` once `enabled` becomes true so viewport-gated loads do not unload on scroll-away.
 */
export const useLatchedEnable = (enabled: boolean): boolean => {
  const [latched, setLatched] = useState(enabled);

  useEffect(() => {
    if (enabled) {
      setLatched(true);
    }
  }, [enabled]);

  return latched;
};
