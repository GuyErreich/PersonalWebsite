/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useMemo, useState } from "react";
import type {
  EntryTypeFilter,
  ExplorerEntry,
  FolderEntry,
  FolderNode,
  MediaEntry,
  SortOption,
  StatusMessage,
} from "../../components/admin/mediaLibrary/types";
import { inferMediaTypeFromFile } from "../../lib/gamedev";
import {
  buildPathLevels,
  getParentPath,
  getPathName,
  normalizeFolderPath,
  splitPath,
} from "../../lib/mediaLibraryPaths";
import {
  type MediaLibraryItem,
  stripFileExtension,
  uploadOrReuseMediaLibraryItem,
} from "../../lib/storage/mediaLibrary";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
  type R2UploadFolder,
} from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";

export interface MediaLibraryExplorerState {
  items: MediaLibraryItem[];
  loading: boolean;
  uploading: boolean;
  message: StatusMessage | null;
  setMessage: (msg: StatusMessage | null) => void;

  uploadFolder: R2UploadFolder;
  setUploadFolder: (folder: R2UploadFolder) => void;
  libraryFolderLabel: string;
  setLibraryFolderLabel: (label: string) => void;

  currentPath: string;
  setCurrentPath: (path: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  entryTypeFilter: EntryTypeFilter;
  setEntryTypeFilter: (filter: EntryTypeFilter) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  previewItem: MediaLibraryItem | null;
  setPreviewItem: (item: MediaLibraryItem | null) => void;

  breadcrumbs: Array<{ label: string; path: string }>;
  explorerEntries: ExplorerEntry[];

  loadItems: () => Promise<void>;
  handleUploadFiles: (files: FileList | null) => Promise<void>;
  handleRename: (id: string, name: string) => Promise<void>;
  handleMoveFolder: (id: string, folder: string) => Promise<void>;
}

export const useMediaLibraryExplorer = (): MediaLibraryExplorerState => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const [uploadFolder, setUploadFolder] = useState<R2UploadFolder>(R2_UPLOAD_FOLDERS.media);
  const [libraryFolderLabel, setLibraryFolderLabel] = useState("general");

  const [currentPath, setCurrentPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("updated-desc");
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);

  const loadItems = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("media_library")
      .select("*")
      .order("updated_at", { ascending: false });

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setItems((data ?? []) as MediaLibraryItem[]);
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const folderNodes = useMemo<FolderNode[]>(() => {
    const map = new Map<string, FolderNode>();

    for (const item of items) {
      const normalizedPath = normalizeFolderPath(item.folder_origin);
      if (!normalizedPath) continue;

      for (const levelPath of buildPathLevels(normalizedPath)) {
        const existing = map.get(levelPath);

        if (!existing) {
          map.set(levelPath, {
            path: levelPath,
            name: getPathName(levelPath),
            parentPath: getParentPath(levelPath),
            itemCount: 1,
            latestUpdatedAt: item.updated_at,
            coverMediaUrl: item.media_url,
            coverMediaType: item.media_type,
          });
          continue;
        }

        const isNewer =
          new Date(item.updated_at).getTime() > new Date(existing.latestUpdatedAt).getTime();

        map.set(levelPath, {
          ...existing,
          itemCount: existing.itemCount + 1,
          latestUpdatedAt: isNewer ? item.updated_at : existing.latestUpdatedAt,
          coverMediaUrl: isNewer ? item.media_url : existing.coverMediaUrl,
          coverMediaType: isNewer ? item.media_type : existing.coverMediaType,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
  }, [items]);

  const breadcrumbs = useMemo(() => {
    const parts = splitPath(currentPath);
    const levels: Array<{ label: string; path: string }> = [{ label: "Root", path: "" }];

    for (let index = 0; index < parts.length; index += 1) {
      levels.push({ label: parts[index] ?? "", path: parts.slice(0, index + 1).join("/") });
    }

    return levels;
  }, [currentPath]);

  const explorerEntries = useMemo<ExplorerEntry[]>(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const isGlobalSearch = normalizedSearch.length > 0;

    const folderEntries: FolderEntry[] = folderNodes
      .filter((folder) => {
        if (!isGlobalSearch && folder.parentPath !== currentPath) return false;
        if (!normalizedSearch) return true;
        return (
          folder.name.toLowerCase().includes(normalizedSearch) ||
          folder.path.toLowerCase().includes(normalizedSearch)
        );
      })
      .map((folder) => ({ kind: "folder" as const, id: `folder:${folder.path}`, ...folder }));

    const mediaEntries: MediaEntry[] = items
      .filter((item) => {
        const itemPath = normalizeFolderPath(item.folder_origin);
        if (!isGlobalSearch && itemPath !== currentPath) return false;
        if (entryTypeFilter === "image" && item.media_type !== "image") return false;
        if (entryTypeFilter === "video" && item.media_type !== "video") return false;
        if (!normalizedSearch) return true;
        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.media_url.toLowerCase().includes(normalizedSearch) ||
          itemPath.toLowerCase().includes(normalizedSearch)
        );
      })
      .map((item) => ({
        kind: "media" as const,
        id: item.id,
        name: item.name,
        path: normalizeFolderPath(item.folder_origin),
        item,
      }));

    let combined: ExplorerEntry[] =
      entryTypeFilter === "folders"
        ? folderEntries
        : entryTypeFilter === "all"
          ? [...folderEntries, ...mediaEntries]
          : mediaEntries;

    combined = [...combined].sort((left, right) => {
      if (sortOption === "name-asc") {
        return left.name.toLowerCase().localeCompare(right.name.toLowerCase());
      }

      const getUpdated = (e: ExplorerEntry) =>
        e.kind === "folder"
          ? new Date(e.latestUpdatedAt).getTime()
          : new Date(e.item.updated_at).getTime();

      if (sortOption === "updated-desc") return getUpdated(right) - getUpdated(left);

      const getCreated = (e: ExplorerEntry) =>
        e.kind === "folder"
          ? new Date(e.latestUpdatedAt).getTime()
          : new Date(e.item.created_at).getTime();

      if (sortOption === "created-desc") return getCreated(right) - getCreated(left);

      const getSize = (e: ExplorerEntry) =>
        e.kind === "folder" ? e.itemCount : (e.item.file_size_bytes ?? 0);

      return getSize(right) - getSize(left);
    });

    return combined;
  }, [currentPath, entryTypeFilter, folderNodes, items, searchQuery, sortOption]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedMimeTypes = new Set(getMimeTypesForFolder(uploadFolder));
    const maxBytes = R2_UPLOAD_POLICIES[uploadFolder].maxBytes;

    setUploading(true);
    setMessage(null);

    try {
      let reusedCount = 0;
      let uploadedCount = 0;

      for (const file of Array.from(files)) {
        if (!allowedMimeTypes.has(file.type.toLowerCase())) {
          throw new Error(`File type not allowed for ${uploadFolder}: ${file.name}`);
        }

        if (file.size <= 0 || file.size > maxBytes) {
          const maxMB = Math.round(maxBytes / (1024 * 1024));
          throw new Error(`File is empty or exceeds ${maxMB}MB: ${file.name}`);
        }

        const mediaType = inferMediaTypeFromFile(file);
        if (uploadFolder === R2_UPLOAD_FOLDERS.heroShowreel && mediaType !== "video") {
          throw new Error(`Hero showreel folder accepts videos only: ${file.name}`);
        }

        const { reused } = await uploadOrReuseMediaLibraryItem({
          file,
          uploadFolder,
          preferredName: stripFileExtension(file.name),
          folderOrigin: libraryFolderLabel.trim() || uploadFolder,
        });

        if (reused) {
          reusedCount += 1;
        } else {
          uploadedCount += 1;
        }
      }

      setMessage({
        type: "success",
        text: `Upload complete. Added ${uploadedCount}, reused ${reusedCount} existing items.`,
      });
      await loadItems();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Unable to upload media.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (itemId: string, nextName: string) => {
    const normalizedName = nextName.trim();
    if (!normalizedName) {
      setMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    const { error } = await supabase
      .from("media_library")
      .update({ name: normalizedName })
      .eq("id", itemId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, name: normalizedName } : item)),
    );
  };

  const handleMoveFolder = async (itemId: string, nextFolder: string) => {
    const normalizedFolder = nextFolder.trim();
    if (!normalizedFolder) {
      setMessage({ type: "error", text: "Folder name cannot be empty." });
      return;
    }

    const { error } = await supabase
      .from("media_library")
      .update({ folder_origin: normalizedFolder })
      .eq("id", itemId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, folder_origin: normalizedFolder } : item,
      ),
    );
  };

  return {
    items,
    loading,
    uploading,
    message,
    setMessage,
    uploadFolder,
    setUploadFolder,
    libraryFolderLabel,
    setLibraryFolderLabel,
    currentPath,
    setCurrentPath,
    searchQuery,
    setSearchQuery,
    entryTypeFilter,
    setEntryTypeFilter,
    sortOption,
    setSortOption,
    previewItem,
    setPreviewItem,
    breadcrumbs,
    explorerEntries,
    loadItems,
    handleUploadFiles,
    handleRename,
    handleMoveFolder,
  };
};
