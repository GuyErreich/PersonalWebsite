/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ShowreelVideo } from "../../ShowreelVideo";
import { GameDevShowreelIntro } from "./GameDevShowreelIntro";

interface GameDevShowreelPanelProps {
  showreelUrl: string | null;
}

export const GameDevShowreelPanel = ({ showreelUrl }: GameDevShowreelPanelProps) => {
  return (
    <div className="gamedev-showreel-stack">
      <GameDevShowreelIntro />
      <ShowreelVideo url={showreelUrl} className="gamedev-showreel-video" />
    </div>
  );
};
