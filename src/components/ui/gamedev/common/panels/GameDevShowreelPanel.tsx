/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ShowreelVideo } from "../media/ShowreelVideo";
import { GameDevShowreelIntro } from "./GameDevShowreelIntro";

interface GameDevShowreelPanelProps {
  showreelUrl: string | null;
  className?: string;
}

export const GameDevShowreelPanel = ({ showreelUrl, className }: GameDevShowreelPanelProps) => {
  return (
    <div className={className ? `gamedev-showreel-stack ${className}` : "gamedev-showreel-stack"}>
      <GameDevShowreelIntro />
      <ShowreelVideo url={showreelUrl} className="gamedev-showreel-video" />
    </div>
  );
};
