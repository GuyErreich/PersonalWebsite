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
  /** When false, pause the showreel (overview tab hidden but mounted). */
  isActive?: boolean;
}

export const GameDevShowreelPanel = ({
  showreelUrl,
  className,
  isActive = true,
}: GameDevShowreelPanelProps) => {
  return (
    <div className={className ? `gamedev-showreel-stack ${className}` : "gamedev-showreel-stack"}>
      <GameDevShowreelIntro />
      <ShowreelVideo url={showreelUrl} className="gamedev-showreel-video" isActive={isActive} />
    </div>
  );
};
