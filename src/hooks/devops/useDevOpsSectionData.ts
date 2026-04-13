/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { devOpsProjects as fallbackProjects } from "../../components/ui/devops/common/projects";
import type { DevOpsProject } from "../../components/ui/devops/common/types";
import { supabase } from "../../lib/supabase";

// Only switch to real DB data once there are at least as many rows as the
// fallback set.  This keeps the "2-page demo" visible while the DB is empty
// or only partially filled with test rows.
const MIN_REAL_PROJECTS = fallbackProjects.length;

export const useDevOpsSectionData = () => {
  const [projects, setProjects] = useState<DevOpsProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("devops_projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          setProjects(fallbackProjects);
        } else if (data && data.length >= MIN_REAL_PROJECTS) {
          // Enough real content — show production data
          setProjects(data as DevOpsProject[]);
        } else {
          // Table empty or not yet fully populated — keep demo fallback
          setProjects(fallbackProjects);
        }
      } catch {
        setProjects(fallbackProjects);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { projects, isLoading };
};
