/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Environment } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { getCanvasDPR } from "../../../../../lib/performance";
import { ThreeDevOpsGraphics } from "../../../../backgrounds/three/ThreeDevOpsGraphics";

export const DevOpsBackground = () => {
  const canvasDPR = useMemo(() => getCanvasDPR(), []);

  return (
    <div className="absolute inset-0 pointer-events-none opacity-40">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }} dpr={canvasDPR}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <ThreeDevOpsGraphics />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};
