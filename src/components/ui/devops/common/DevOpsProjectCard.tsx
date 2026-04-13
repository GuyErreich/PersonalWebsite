/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ReactNode } from "react";
import { ProjectCardBase } from "../../common/ProjectCardBase";

interface DevOpsProjectCardProps {
  title: string;
  description: string;
  tags?: string[];
  link?: string | null;
  icon: ReactNode;
  index: number;
  compact?: boolean;
}

export const DevOpsProjectCard = ({
  title,
  description,
  tags,
  link,
  icon,
  index,
  compact = false,
}: DevOpsProjectCardProps) => {
  return (
    <ProjectCardBase
      title={title}
      description={description}
      tags={tags}
      link={link}
      icon={icon}
      index={index}
      compact={compact}
      theme={{
        containerClassName:
          "group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-gray-800/50",
        iconShellClassName:
          "rounded-lg border border-blue-500/20 bg-blue-500/15 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]",
        titleClassName: "font-semibold text-white transition-colors group-hover:text-blue-300",
        tagClassName:
          "rounded-md border border-blue-500/25 bg-blue-500/10 font-medium text-blue-300/80",
      }}
    />
  );
};
