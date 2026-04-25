/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import type { R2UploadFolder } from "../../../lib/storage/r2UploadPolicies";

export type SortOption = "updated-desc" | "created-desc" | "name-asc" | "size-desc";

export type EntryTypeFilter = "all" | "folders" | "image" | "video";

export interface FolderNode {
  path: string;
  name: string;
  parentPath: string;
  itemCount: number;
  latestUpdatedAt: string;
  coverMediaUrl: string;
  coverMediaType: "image" | "video";
}

export interface FolderEntry {
  kind: "folder";
  id: string;
  name: string;
  path: string;
  parentPath: string;
  itemCount: number;
  latestUpdatedAt: string;
  coverMediaUrl: string;
  coverMediaType: "image" | "video";
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
