/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import type { R2UploadFolder } from "../../../lib/storage/r2UploadPolicies";

export type SortOption = "updated-desc" | "created-desc" | "name-asc" | "size-desc";

export type EntryTypeFilter = "all" | "folders" | "image" | "video";

export interface FolderRecord {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  created_at: string;
  updated_at: string;
}

export interface FolderNode {
  path: string;
  name: string;
  parentPath: string;
  isVirtual: boolean;
  createdAt: string;
  itemCount: number;
  latestUpdatedAt: string;
  coverMediaUrl: string | null;
  coverMediaType: "image" | "video" | null;
}

export interface FolderEntry {
  kind: "folder";
  id: string;
  name: string;
  path: string;
  parentPath: string;
  isVirtual: boolean;
  createdAt: string;
  itemCount: number;
  latestUpdatedAt: string;
  coverMediaUrl: string | null;
  coverMediaType: "image" | "video" | null;
}

export interface MediaEntry {
  kind: "media";
  id: string;
  name: string;
  path: string;
  item: MediaLibraryItem;
}

export type ExplorerEntry = FolderEntry | MediaEntry;

export interface UploadConfig {
  uploadFolder: R2UploadFolder;
  libraryFolderLabel: string;
}

export interface StatusMessage {
  type: "success" | "error";
  text: string;
}
