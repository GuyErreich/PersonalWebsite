/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  EntryTypeFilter,
  ExplorerEntry,
  FolderEntry,
  FolderNode,
  FolderRecord,
  MediaEntry,
  SortOption,
  StatusMessage,
} from "../../components/admin/mediaLibrary/types";
import {
  buildPathLevels,
  getParentPath,
  getPathName,
  normalizeFolderPath,
  splitPath,
} from "../../lib/mediaLibraryPaths";
import {
  findDuplicateByHash,
  type MediaLibraryItem,
  stripFileExtension,
  uploadOrReuseMediaLibraryItem,
} from "../../lib/storage/mediaLibrary";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
} from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";

export interface MediaLibraryExplorerState {
  items: MediaLibraryItem[];
  folders: FolderRecord[];
  loading: boolean;
  uploading: boolean;
  message: StatusMessage | null;
  setMessage: (msg: StatusMessage | null) => void;

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
  uploadProgressItems: Array<{
    id: string;
    fileName: string;
    progress: number;
    status: "queued" | "uploading" | "success" | "error";
    detail?: string;
  }>;
  isUploadProgressOpen: boolean;
  closeUploadProgress: () => void;

  loadItems: () => Promise<void>;
  handleUploadFiles: (files: FileList | null, targetFolderPath?: string) => Promise<void>;
  handleRename: (id: string, name: string) => Promise<void>;
  handleCreateFolder: (name: string) => Promise<void>;
  handleDeleteMedia: (id: string) => Promise<void>;
  handleMoveMediaToFolder: (itemId: string, folderPath: string) => Promise<void>;
  handleMoveFolderToFolder: (folderPath: string, targetFolderPath: string) => Promise<void>;
  handleDeleteFolder: (folderPath: string) => Promise<void>;
  handleRenameFolder: (folderPath: string, newName: string) => Promise<void>;

  pendingDuplicate: { file: File; existing: MediaLibraryItem } | null;
  respondDuplicate: (action: "use" | "skip") => void;
}

export const useMediaLibraryExplorer = (): MediaLibraryExplorerState => {
  type FolderRow = {
    id: string;
    name: string;
    path: string;
    parent_path: string;
    created_at: string;
    updated_at: string;
  };

  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<StatusMessage | null>(null);

  const [currentPath, setCurrentPath] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<EntryTypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("updated-desc");
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [uploadProgressItems, setUploadProgressItems] = useState<
    Array<{
      id: string;
      fileName: string;
      progress: number;
      status: "queued" | "uploading" | "success" | "error";
      detail?: string;
    }>
  >([]);
  const [isUploadProgressOpen, setIsUploadProgressOpen] = useState(false);

  const [pendingDuplicate, setPendingDuplicate] = useState<{
    file: File;
    existing: MediaLibraryItem;
  } | null>(null);
  const duplicateResolveRef = useRef<((action: "use" | "skip") => void) | null>(null);

  const respondDuplicate = (action: "use" | "skip") => {
    setPendingDuplicate(null);
    duplicateResolveRef.current?.(action);
    duplicateResolveRef.current = null;
  };

  const closeUploadProgress = () => {
    setIsUploadProgressOpen(false);
  };

  const loadItems = async () => {
    setLoading(true);

    const [{ data: mediaData, error: mediaError }, { data: folderData, error: folderError }] =
      await Promise.all([
        supabase.from("media_library").select("*").order("updated_at", { ascending: false }),
        supabase
          .from("media_library_folders")
          .select("*")
          .order("updated_at", { ascending: false }),
      ]);

    setLoading(false);

    if (mediaError) {
      setMessage({ type: "error", text: mediaError.message });
      return;
    }

    if (folderError) {
      setMessage({ type: "error", text: folderError.message });
      return;
    }

    setItems((mediaData ?? []) as MediaLibraryItem[]);
    setFolders(
      ((folderData ?? []) as FolderRow[]).map((folder) => ({
        id: folder.id,
        name: folder.name,
        path: folder.path,
        parentPath: folder.parent_path,
        created_at: folder.created_at,
        updated_at: folder.updated_at,
      })),
    );
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const folderNodes = useMemo<FolderNode[]>(() => {
    const map = new Map<string, FolderNode>();

    for (const folder of folders) {
      map.set(folder.path, {
        path: folder.path,
        name: folder.name,
        parentPath: folder.parentPath,
        itemCount: 0,
        latestUpdatedAt: folder.updated_at,
        coverMediaUrl: null,
        coverMediaType: null,
      });
    }

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

        const hasCover = existing.coverMediaUrl !== null && existing.coverMediaType !== null;

        map.set(levelPath, {
          ...existing,
          itemCount: existing.itemCount + 1,
          latestUpdatedAt: isNewer ? item.updated_at : existing.latestUpdatedAt,
          coverMediaUrl: !hasCover || isNewer ? item.media_url : existing.coverMediaUrl,
          coverMediaType: !hasCover || isNewer ? item.media_type : existing.coverMediaType,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
  }, [folders, items]);

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

  const handleUploadFiles = async (files: FileList | null, targetFolderPath?: string) => {
    if (!files || files.length === 0) return;
    if (uploading) {
      setMessage({ type: "error", text: "An upload batch is already in progress." });
      return;
    }

    const folder = R2_UPLOAD_FOLDERS.media;
    const allowedMimeTypes = new Set(getMimeTypesForFolder(folder));
    const maxBytes = R2_UPLOAD_POLICIES[folder].maxBytes;

    const uploadDestination =
      targetFolderPath && targetFolderPath.trim().length > 0 ? targetFolderPath : currentPath;
    const filesToUpload = Array.from(files);

    const initialProgress = filesToUpload.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      fileName: file.name,
      progress: 0,
      status: "queued" as const,
      detail: "Queued",
    }));

    setUploadProgressItems(initialProgress);
    setIsUploadProgressOpen(true);

    setUploading(true);
    setMessage(null);

    try {
      let reusedCount = 0;
      let uploadedCount = 0;
      let failedCount = 0;

      const updateProgress = (
        index: number,
        patch: Partial<{
          progress: number;
          status: "queued" | "uploading" | "success" | "error";
          detail?: string;
        }>,
      ) => {
        setUploadProgressItems((prev) =>
          prev.map((item, currentIndex) =>
            currentIndex === index
              ? {
                  ...item,
                  ...patch,
                }
              : item,
          ),
        );
      };

      const runUpload = async (file: File, index: number) => {
        updateProgress(index, { status: "uploading", progress: 12, detail: "Preparing" });

        if (!allowedMimeTypes.has(file.type.toLowerCase())) {
          throw new Error(`File type not allowed: ${file.name}`);
        }

        if (file.size <= 0 || file.size > maxBytes) {
          const maxMB = Math.round(maxBytes / (1024 * 1024));
          throw new Error(`File is empty or exceeds ${maxMB}MB: ${file.name}`);
        }

        updateProgress(index, { progress: 30, detail: "Hashing" });

        const pulseTimer = window.setInterval(() => {
          setUploadProgressItems((prev) =>
            prev.map((item, currentIndex) => {
              if (currentIndex !== index || item.status !== "uploading") return item;
              const next = Math.min(90, item.progress + 4);
              return { ...item, progress: next, detail: "Uploading" };
            }),
          );
        }, 180);

        let reused = false;
        try {
          const duplicate = await findDuplicateByHash(file);
          if (duplicate) {
            reused = true;
          }

          const result = await uploadOrReuseMediaLibraryItem({
            file,
            uploadFolder: folder,
            preferredName: stripFileExtension(file.name),
            folderOrigin: uploadDestination || folder,
          });

          reused = result.reused;
        } finally {
          window.clearInterval(pulseTimer);
        }

        if (reused) {
          reusedCount += 1;
          updateProgress(index, { status: "success", progress: 100, detail: "Reused existing" });
        } else {
          uploadedCount += 1;
          updateProgress(index, { status: "success", progress: 100, detail: "Uploaded" });
        }
      };

      const settled = await Promise.allSettled(
        filesToUpload.map(async (file, index) => {
          try {
            await runUpload(file, index);
          } catch (error) {
            failedCount += 1;
            updateProgress(index, {
              status: "error",
              progress: 100,
              detail: error instanceof Error ? error.message : "Upload failed",
            });
          }
        }),
      );

      const hasRejected = settled.some((result) => result.status === "rejected");
      if (hasRejected) {
        failedCount += settled.filter((result) => result.status === "rejected").length;
      }

      setMessage(
        failedCount > 0
          ? {
              type: "error",
              text: `Upload finished with issues. Added ${uploadedCount}, reused ${reusedCount}, failed ${failedCount}.`,
            }
          : {
              type: "success",
              text: `Upload complete. Added ${uploadedCount}, reused ${reusedCount} existing items.`,
            },
      );

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

  const handleCreateFolder = (name: string) => {
    return (async () => {
      const folderName = name.trim();

      if (!folderName) {
        setMessage({ type: "error", text: "Folder name cannot be empty." });
        return;
      }

      const safePathSegment = folderName.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
      const folderPath = currentPath ? `${currentPath}/${safePathSegment}` : safePathSegment;

      const { error } = await supabase.from("media_library_folders").insert([
        {
          name: folderName,
          path: folderPath,
          parent_path: currentPath,
        },
      ]);

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      setMessage({ type: "success", text: `Created folder "${folderName}".` });
      await loadItems();
    })();
  };

  const handleDeleteMedia = async (itemId: string) => {
    const { error } = await supabase.from("media_library").delete().eq("id", itemId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleMoveMediaToFolder = async (itemId: string, folderPath: string) => {
    const normalizedTarget = normalizeFolderPath(folderPath);
    const sourceItem = items.find((item) => item.id === itemId);

    if (!sourceItem) {
      setMessage({ type: "error", text: "Media item not found." });
      return;
    }

    const currentItemPath = normalizeFolderPath(sourceItem.folder_origin);
    if (currentItemPath === normalizedTarget) return;

    const { error } = await supabase
      .from("media_library")
      .update({ folder_origin: normalizedTarget })
      .eq("id", itemId);

    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, folder_origin: normalizedTarget } : item,
      ),
    );
  };

  const handleMoveFolderToFolder = async (folderPath: string, targetFolderPath: string) => {
    const normalizedSource = normalizeFolderPath(folderPath);
    const normalizedTarget = normalizeFolderPath(targetFolderPath);

    if (!normalizedSource || !normalizedTarget) {
      setMessage({ type: "error", text: "Invalid folder move target." });
      return;
    }

    if (normalizedSource === normalizedTarget) return;

    if (normalizedTarget.startsWith(`${normalizedSource}/`)) {
      setMessage({ type: "error", text: "Cannot move a folder into one of its subfolders." });
      return;
    }

    const sourceFolderName = getPathName(normalizedSource);
    const destinationPath = `${normalizedTarget}/${sourceFolderName}`;

    const { data: existingDestination, error: destinationLookupError } = await supabase
      .from("media_library_folders")
      .select("id")
      .eq("path", destinationPath)
      .maybeSingle();

    if (destinationLookupError) {
      setMessage({ type: "error", text: destinationLookupError.message });
      return;
    }

    if (existingDestination) {
      setMessage({ type: "error", text: "A folder with that name already exists in target." });
      return;
    }

    const [
      { data: exactMediaRows, error: mediaExactError },
      { data: subMediaRows, error: mediaSubError },
      { data: exactFolderRows, error: folderExactError },
      { data: subFolderRows, error: folderSubError },
    ] = await Promise.all([
      supabase
        .from("media_library")
        .select("id, folder_origin")
        .eq("folder_origin", normalizedSource),
      supabase
        .from("media_library")
        .select("id, folder_origin")
        .filter("folder_origin", "like", `${normalizedSource}/%`),
      supabase
        .from("media_library_folders")
        .select("id, path, parent_path")
        .eq("path", normalizedSource),
      supabase
        .from("media_library_folders")
        .select("id, path, parent_path")
        .filter("path", "like", `${normalizedSource}/%`),
    ]);

    if (mediaExactError ?? mediaSubError ?? folderExactError ?? folderSubError) {
      setMessage({
        type: "error",
        text: (mediaExactError ?? mediaSubError ?? folderExactError ?? folderSubError)!.message,
      });
      return;
    }

    const mediaRows = [
      ...((exactMediaRows ?? []) as Array<{ id: string; folder_origin: string | null }>),
      ...((subMediaRows ?? []) as Array<{ id: string; folder_origin: string | null }>),
    ];

    for (const row of mediaRows) {
      if (!row.folder_origin) continue;

      const updatedOrigin = row.folder_origin.replace(normalizedSource, destinationPath);
      const { error: updateError } = await supabase
        .from("media_library")
        .update({ folder_origin: updatedOrigin })
        .eq("id", row.id);

      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
        return;
      }
    }

    const folderRows = [
      ...((exactFolderRows ?? []) as Array<{ id: string; path: string; parent_path: string }>),
      ...((subFolderRows ?? []) as Array<{ id: string; path: string; parent_path: string }>),
    ];

    for (const row of folderRows) {
      const updatedPath = row.path.replace(normalizedSource, destinationPath);
      const updatedParentPath = row.parent_path.replace(normalizedSource, destinationPath);

      const { error: updateError } = await supabase
        .from("media_library_folders")
        .update({ path: updatedPath, parent_path: updatedParentPath })
        .eq("id", row.id);

      if (updateError) {
        setMessage({ type: "error", text: updateError.message });
        return;
      }
    }

    if (currentPath === normalizedSource || currentPath.startsWith(`${normalizedSource}/`)) {
      setCurrentPath(currentPath.replace(normalizedSource, destinationPath));
    }

    setMessage({ type: "success", text: `Moved folder to "${normalizedTarget}".` });
    await loadItems();
  };

  const handleDeleteFolder = async (folderPath: string) => {
    const normalized = normalizeFolderPath(folderPath);

    const { error: folderExactErr } = await supabase
      .from("media_library_folders")
      .delete()
      .eq("path", normalized);

    if (folderExactErr) {
      setMessage({ type: "error", text: folderExactErr.message });
      return;
    }

    const { error: folderSubErr } = await supabase
      .from("media_library_folders")
      .delete()
      .filter("path", "like", `${normalized}/%`);

    if (folderSubErr) {
      setMessage({ type: "error", text: folderSubErr.message });
      return;
    }

    const { error: errExact } = await supabase
      .from("media_library")
      .delete()
      .eq("folder_origin", normalized);

    if (errExact) {
      setMessage({ type: "error", text: errExact.message });
      return;
    }

    const { error: errSub } = await supabase
      .from("media_library")
      .delete()
      .filter("folder_origin", "like", `${normalized}/%`);

    if (errSub) {
      setMessage({ type: "error", text: errSub.message });
      return;
    }

    setItems((prev) =>
      prev.filter((item) => {
        const itemPath = normalizeFolderPath(item.folder_origin);
        return itemPath !== normalized && !itemPath.startsWith(`${normalized}/`);
      }),
    );

    if (currentPath === normalized || currentPath.startsWith(`${normalized}/`)) {
      setCurrentPath(getParentPath(normalized));
    }
  };

  const handleRenameFolder = async (folderPath: string, newName: string) => {
    const safeName = newName.trim();
    if (!safeName) {
      setMessage({ type: "error", text: "Folder name cannot be empty." });
      return;
    }

    const parentPath = getParentPath(folderPath);
    const newPath = parentPath ? `${parentPath}/${safeName}` : safeName;

    const [
      { data: exactRows, error: e1 },
      { data: subRows, error: e2 },
      { data: folderRows, error: e3 },
      { data: folderSubRows, error: e4 },
    ] = await Promise.all([
      supabase.from("media_library").select("id, folder_origin").eq("folder_origin", folderPath),
      supabase
        .from("media_library")
        .select("id, folder_origin")
        .filter("folder_origin", "like", `${folderPath}/%`),
      supabase
        .from("media_library_folders")
        .select("id, path, parent_path, name")
        .eq("path", folderPath),
      supabase
        .from("media_library_folders")
        .select("id, path, parent_path, name")
        .filter("path", "like", `${folderPath}/%`),
    ]);

    if (e1 ?? e2 ?? e3 ?? e4) {
      setMessage({ type: "error", text: (e1 ?? e2 ?? e3 ?? e4)!.message });
      return;
    }

    const allRows = [
      ...((exactRows ?? []) as Array<{ id: string; folder_origin: string | null }>),
      ...((subRows ?? []) as Array<{ id: string; folder_origin: string | null }>),
    ];

    for (const row of allRows) {
      if (!row.folder_origin) continue;
      const updatedOrigin = row.folder_origin.replace(folderPath, newPath);
      const { error: updateErr } = await supabase
        .from("media_library")
        .update({ folder_origin: updatedOrigin })
        .eq("id", row.id);

      if (updateErr) {
        setMessage({ type: "error", text: updateErr.message });
        return;
      }
    }

    const folderRowsToUpdate = [
      ...((folderRows ?? []) as Array<{
        id: string;
        path: string;
        parent_path: string;
        name: string;
      }>),
      ...((folderSubRows ?? []) as Array<{
        id: string;
        path: string;
        parent_path: string;
        name: string;
      }>),
    ];

    for (const row of folderRowsToUpdate) {
      const updatedPath = row.path.replace(folderPath, newPath);
      const updatedParentPath = row.parent_path.replace(folderPath, newPath);

      const { error: updateErr } = await supabase
        .from("media_library_folders")
        .update({
          name: updatedPath === newPath ? safeName : row.name,
          path: updatedPath,
          parent_path: updatedParentPath,
        })
        .eq("id", row.id);

      if (updateErr) {
        setMessage({ type: "error", text: updateErr.message });
        return;
      }
    }

    if (currentPath === folderPath || currentPath.startsWith(`${folderPath}/`)) {
      setCurrentPath(currentPath.replace(folderPath, newPath));
    }

    await loadItems();
  };

  return {
    items,
    folders,
    loading,
    uploading,
    message,
    setMessage,
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
    uploadProgressItems,
    isUploadProgressOpen,
    closeUploadProgress,
    loadItems,
    handleUploadFiles,
    handleRename,
    handleCreateFolder,
    handleDeleteMedia,
    handleMoveMediaToFolder,
    handleMoveFolderToFolder,
    handleDeleteFolder,
    handleRenameFolder,
    pendingDuplicate,
    respondDuplicate,
  };
};
