/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export interface AdminGameDevProject {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url: string | null;
  icon_name: string | null;
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  created_at: string;
}

export interface AdminDevOpsProject {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string | null;
  live_url: string | null;
  icon_name: string | null;
  created_at: string;
}

export interface AdminProjectListItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
}
