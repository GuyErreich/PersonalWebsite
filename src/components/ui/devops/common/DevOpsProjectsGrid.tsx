/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Server } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectCard } from "../../ProjectCard";
import { devOpsIconMap, ICON_COLORS } from "./iconMap";
import type { DevOpsProject } from "./types";

interface DevOpsProjectsGridProps {
  projects: DevOpsProject[];
  className: string;
  /** Absolute index offset so colour cycling is consistent across pages. */
  indexOffset?: number;
}

export const DevOpsProjectsGrid = ({
  projects,
  className,
  indexOffset = 0,
}: DevOpsProjectsGridProps) => {
  return (
    <div className={className}>
      {projects.map((project, index) => {
        const absIndex = indexOffset + index;
        const IconClass = (
          project.icon_name ? (devOpsIconMap[project.icon_name] ?? Server) : Server
        ) as React.ComponentType<{ className?: string }>;
        const colorClass = ICON_COLORS[absIndex % ICON_COLORS.length];
        const icon: ReactNode = <IconClass className={`h-6 w-6 ${colorClass}`} />;

        return (
          <ProjectCard
            key={project.id}
            title={project.title}
            description={project.description}
            tags={project.tech_stack}
            link={project.github_url ?? "#"}
            icon={icon}
            index={absIndex}
            compact
          />
        );
      })}
    </div>
  );
};
