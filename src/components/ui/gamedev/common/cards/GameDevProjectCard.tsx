/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";
import { ProjectCardBase } from "../../../common/cards/ProjectCardBase";

interface GameDevProjectCardProps {
  title: string;
  description: string;
  tags?: string[];
  link?: string | null;
  icon: ReactNode;
  index: number;
  compact?: boolean;
  thumbnailUrl?: string;
}

export const GameDevProjectCard = ({
  title,
  description,
  tags,
  link,
  icon,
  index,
  compact = false,
  thumbnailUrl,
}: GameDevProjectCardProps) => {
  return (
    <ProjectCardBase
      title={title}
      description={description}
      tags={tags}
      link={link}
      icon={icon}
      index={index}
      compact={compact}
      thumbnailUrl={thumbnailUrl}
      theme={{
        containerClassName:
          "group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-800/90 backdrop-blur-sm",
        iconShellClassName:
          "rounded-lg border border-purple-500/20 bg-purple-500/15 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]",
        titleClassName: "font-semibold text-white transition-colors group-hover:text-purple-300",
        tagClassName:
          "rounded-md border border-purple-500/25 bg-purple-500/10 font-medium text-purple-300/80",
      }}
    />
  );
};
