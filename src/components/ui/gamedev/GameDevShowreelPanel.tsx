/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ShowreelVideo } from "../ShowreelVideo";

interface GameDevShowreelPanelProps {
  showreelUrl: string | null;
}

export const GameDevShowreelPanel = ({ showreelUrl }: GameDevShowreelPanelProps) => {
  return (
    <div className="flex min-h-0 flex-col justify-start gap-4 lg:gap-5">
      <div className="max-w-2xl text-center lg:text-left">
        <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
          Game Development
        </p>
        <h2 className="mb-4 text-3xl font-extrabold text-white md:text-4xl lg:text-5xl">
          Game Development & Design
        </h2>
        <p className="text-base text-gray-300 md:text-lg lg:text-xl">
          Showcasing my journey in game development, from mechanics design to full-fledged
          prototypes and interactive experiences.
        </p>
      </div>
      <ShowreelVideo url={showreelUrl} className="max-w-[min(100%,760px)]" />
    </div>
  );
};
