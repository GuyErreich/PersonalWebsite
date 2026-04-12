/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { devOpsProjects as fallbackProjects } from "../../components/ui/devops/common/projects";
import type { DevOpsProject } from "../../components/ui/devops/common/types";
import { supabase } from "../../lib/supabase";

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
          console.warn(error.message);
          setProjects(fallbackProjects);
        } else if (data && data.length > 0) {
          setProjects(data as DevOpsProject[]);
        } else {
          // Table empty or not yet populated — show hardcoded fallback
          setProjects(fallbackProjects);
        }
      } catch (e) {
        console.warn(e instanceof Error ? e.message : String(e));
        setProjects(fallbackProjects);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return { projects, isLoading };
};
