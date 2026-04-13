/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Server } from "lucide-react";
import type { ReactNode } from "react";
import { DevOpsProjectCard } from "./DevOpsProjectCard";
import { devOpsIconMap, ICON_COLORS } from "./iconMap";
import type { DevOpsProject } from "./types";

interface DevOpsProjectsGridProps {
  projects: DevOpsProject[];
  className: string;
  /** Absolute index offset so colour cycling is consistent across pages. */
  indexOffset?: number;
  /** Total grid slots — ghost cells pad partial last pages so layout height is stable. */
  totalSlots?: number;
}

export const DevOpsProjectsGrid = ({
  projects,
  className,
  indexOffset = 0,
  totalSlots,
}: DevOpsProjectsGridProps) => {
  const ghostCount = totalSlots !== undefined ? Math.max(0, totalSlots - projects.length) : 0;

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
          <DevOpsProjectCard
            key={project.id}
            title={project.title}
            description={project.description}
            tags={project.tech_stack}
            link={project.github_url}
            icon={icon}
            index={absIndex}
            compact
          />
        );
      })}

      {/* Ghost cells — render an invisible clone of the first card so height is pixel-perfect */}
      {Array.from({ length: ghostCount }).map((_, i) => {
        const template = projects[0];
        if (!template) return null;
        const GhostIcon = (
          template.icon_name ? (devOpsIconMap[template.icon_name] ?? Server) : Server
        ) as React.ComponentType<{ className?: string }>;
        return (
          <div key={`ghost-${i}`} className="invisible" aria-hidden="true">
            <DevOpsProjectCard
              title={template.title}
              description={template.description}
              tags={template.tech_stack}
              icon={<GhostIcon className="h-6 w-6" />}
              index={0}
              compact
            />
          </div>
        );
      })}
    </div>
  );
};
