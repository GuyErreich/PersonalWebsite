/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from "react";
import { devOpsProjects as fallbackProjects } from "../../components/ui/devops/common/data/projects";
import type { DevOpsProject } from "../../components/ui/devops/common/data/types";
import { supabase } from "../../lib/supabase";
import { useLatchedEnable } from "../useLatchedEnable";

// Only switch to real DB data once there are at least as many rows as the
// fallback set.  This keeps the "2-page demo" visible while the DB is empty
// or only partially filled with test rows.
const MIN_REAL_PROJECTS = fallbackProjects.length;

interface UseDevOpsSectionDataOptions {
  /** When false, skip network work so hero first paint is not contested. Latches on once true. */
  enabled?: boolean;
}

export const useDevOpsSectionData = ({ enabled = true }: UseDevOpsSectionDataOptions = {}) => {
  const loadLatched = useLatchedEnable(enabled);
  const [projects, setProjects] = useState<DevOpsProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loadLatched) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("devops_projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (!isMounted) {
          return;
        }

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
        if (!isMounted) {
          return;
        }

        setProjects(fallbackProjects);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadLatched]);

  return { projects, isLoading: loadLatched ? isLoading : true };
};
