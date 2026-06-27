/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

export interface AdminGameDevProject {
  id: string;
  title: string;
  description: string;
  media_url: string | null;
  thumbnail_url: string | null;
  header_media_url: string | null;
  header_thumbnail_url: string | null;
  icon_name: string | null;
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  is_coming_soon?: boolean;
  is_featured: boolean;
  featured_sort: number | null;
  show_vfx_section: boolean;
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
  is_coming_soon?: boolean;
  created_at: string;
  is_featured?: boolean;
  featured_sort?: number | null;
}

export interface AdminGameDevVfx {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: "video" | "image";
  tags: string[];
  sort_order: number | null;
  show_in_library?: boolean;
  created_at: string;
}
