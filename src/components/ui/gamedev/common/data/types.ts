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

export interface GameDevItem {
  id: string;
  title: string;
  description: string;
  summary?: string;
  media_url: string;
  thumbnail_url?: string;
  icon_name?: string;
  github_url?: string;
  live_url?: string;
  tags?: string[];
  media_items?: GameDevMediaItem[];
}

export type GameDevIconMap = Record<string, ElementType>;

export interface GameDevGalleryPanelProps {
  galleryItems: GameDevItem[];
  isLoading: boolean;
  iconMap: GameDevIconMap;
}

export interface GameDevOverviewLayoutProps extends GameDevGalleryPanelProps {
  showreelUrl: string | null;
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
