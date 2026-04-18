/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useState } from "react";
import { getAdaptiveCanvasDPR } from "../../../../../lib/performance";
import { ThreeDevOpsGraphics } from "../../../../backgrounds/three/ThreeDevOpsGraphics";

export const DevOpsBackground = () => {
  const [canvasDPR, setCanvasDPR] = useState(1);
  const [canvasEventSource, setCanvasEventSource] = useState<HTMLElement | null>(null);

  const setCanvasEventSourceRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasEventSource(node);
  }, []);

  useEffect(() => {
    const updateAdaptiveDpr = () => {
      setCanvasDPR(getAdaptiveCanvasDPR());
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

  return (
    <div ref={setCanvasEventSourceRef} className="absolute inset-0 pointer-events-none opacity-40">
      {canvasEventSource ? (
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={canvasDPR}
          eventSource={canvasEventSource}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <ThreeDevOpsGraphics />
          <Environment preset="city" />
        </Canvas>
      ) : null}
    </div>
  );
};
