/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { ElementType } from "react";
import type { GameDevSortKey } from "./filtering";

export interface GameDevMediaItem {
  id: string;
  gamedev_item_id?: string;
  media_url: string;
  thumbnail_url?: string | null;
  media_type?: "video" | "image";
  caption?: string | null;
  sort_order?: number | null;
  created_at?: string;
}

export interface GameDevVfxItem {
  id: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string | null;
  media_type: "video" | "image";
  tags?: string[];
  sort_order?: number | null;
  show_in_library?: boolean;
  created_at?: string;
}

export interface GameDevItem {
  id: string;
  title: string;
  description: string;
  summary?: string;
  media_url?: string | null;
  thumbnail_url?: string | null;
  header_media_url?: string | null;
  header_thumbnail_url?: string | null;
  icon_name?: string;
  github_url?: string;
  live_url?: string;
  tags?: string[];
  is_coming_soon?: boolean;
  is_featured?: boolean;
  featured_sort?: number | null;
  show_vfx_section?: boolean;
  media_items?: GameDevMediaItem[];
  linked_vfx?: GameDevVfxItem[];
}

export type GameDevIconMap = Record<string, ElementType>;

export interface GameDevGalleryPanelProps {
  galleryItems: GameDevItem[];
  isLoading: boolean;
  iconMap: GameDevIconMap;
}

export interface GameDevOverviewLayoutProps {
  showreelUrl: string | null;
  featuredItems: GameDevItem[];
  vfxItems: GameDevVfxItem[];
  vfxError: string | null;
  isLoading: boolean;
  isVfxLoading: boolean;
  iconMap: GameDevIconMap;
  onViewAll: () => void;
}

export interface GameDevAllProjectsLayoutProps extends GameDevGalleryPanelProps {
  onBack: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  allStacks: string[];
  activeStacks: string[];
  onStackToggle: (value: string) => void;
  onClearStacks: () => void;
  sortKey: GameDevSortKey;
  onSortChange: (value: GameDevSortKey) => void;
}
