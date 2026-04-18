/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { getAdaptiveCanvasDPR } from "../../lib/performance";

export const useAdaptiveCanvasDpr = () => {
  const [canvasDpr, setCanvasDpr] = useState(1);

  useEffect(() => {
    const updateAdaptiveDpr = () => {
      setCanvasDpr(getAdaptiveCanvasDPR());
    };

    updateAdaptiveDpr();
    window.addEventListener("resize", updateAdaptiveDpr);
    window.addEventListener("focus", updateAdaptiveDpr);
    document.addEventListener("visibilitychange", updateAdaptiveDpr);

    return () => {
      window.removeEventListener("resize", updateAdaptiveDpr);
      window.removeEventListener("focus", updateAdaptiveDpr);
      document.removeEventListener("visibilitychange", updateAdaptiveDpr);
    };
  }, []);

  return canvasDpr;
};
