/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useCallback, useState } from "react";
import { useAdaptiveCanvasDpr } from "../../../../../hooks/responsive/useAdaptiveCanvasDpr";
import { ThreeDevOpsGraphics } from "../../../../backgrounds/three/ThreeDevOpsGraphics";

export const DevOpsBackground = () => {
  const canvasDPR = useAdaptiveCanvasDpr();
  const [canvasEventSource, setCanvasEventSource] = useState<HTMLElement | null>(null);

  const setCanvasEventSourceRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasEventSource(node);
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
