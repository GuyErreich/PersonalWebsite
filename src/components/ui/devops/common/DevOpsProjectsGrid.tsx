/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { ProjectCard } from "../../ProjectCard";
import type { DevOpsProject } from "./types";

interface DevOpsProjectsGridProps {
  projects: DevOpsProject[];
  className: string;
}

export const DevOpsProjectsGrid = ({ projects, className }: DevOpsProjectsGridProps) => {
  return (
    <div className={className}>
      {projects.map((project, index) => (
        <ProjectCard
          key={`${project.title}-${index}`}
          title={project.title}
          description={project.description}
          tags={project.tags}
          link={project.link}
          icon={project.icon}
          index={index}
        />
      ))}
    </div>
  );
};
