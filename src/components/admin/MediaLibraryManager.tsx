/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import {
  ChevronRight,
  FolderOpen,
  Home,
  Image as ImageIcon,
  Search,
  Upload,
  Video,
} from "lucide-react";
import { type SyntheticEvent, useEffect, useMemo, useState } from "react";
import { inferMediaTypeFromFile } from "../../lib/gamedev";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
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

const DEFAULT_UPLOAD_FOLDER = R2_UPLOAD_FOLDERS.media;

const UPLOAD_FOLDER_OPTIONS: Array<{ value: R2UploadFolder; label: string }> = [
  { value: R2_UPLOAD_FOLDERS.media, label: "General Media" },
  { value: R2_UPLOAD_FOLDERS.gameDevAssets, label: "GameDev Assets" },
  { value: R2_UPLOAD_FOLDERS.heroShowreel, label: "Hero Showreel" },
  { value: R2_UPLOAD_FOLDERS.gameDevThumbnails, label: "GameDev Thumbnails" },
];

type SortOption = "updated-desc" | "created-desc" | "name-asc" | "size-desc";

type EntryTypeFilter = "all" | "folders" | "image" | "video";

interface FolderNode {
  path: string;
  name: string;
  parentPath: string;
  itemCount: number;
  latestUpdatedAt: string;
  coverMediaUrl: string;
  coverMediaType: "image" | "video";
}

interface FolderEntry {
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

interface MediaEntry {
  kind: "media";
  id: string;
  name: string;
  path: string;
  item: MediaLibraryItem;
}

type ExplorerEntry = FolderEntry | MediaEntry;

const normalizeFolderPath = (value: string | null): string => {
  const normalized = (value ?? "")
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .join("/");

  return normalized;
};

const splitPath = (path: string): string[] =>
  path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const getParentPath = (path: string): string => {
  const parts = splitPath(path);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
};

const getPathName = (path: string): string => {
  const parts = splitPath(path);
  return parts.length > 0 ? parts[parts.length - 1] : "Root";
};

const buildPathLevels = (fullPath: string): string[] => {
  const parts = splitPath(fullPath);
  const levels: string[] = [];
  for (let index = 0; index < parts.length; index += 1) {
    levels.push(parts.slice(0, index + 1).join("/"));
  }
  return levels;
};

const seekThumbnailToVideoCenter = (event: SyntheticEvent<HTMLVideoElement>) => {
  const videoElement = event.currentTarget;
  const duration = videoElement.duration;

  if (!Number.isFinite(duration) || duration <= 0) {
    return;
  }

  const midpointSeconds = duration / 2;
  const seekable = videoElement.seekable;
  let targetSeconds = midpointSeconds;

  if (seekable.length > 0) {
    const seekableStart = seekable.start(0);
    const seekableEnd = seekable.end(seekable.length - 1);
    targetSeconds = Math.min(
      Math.max(midpointSeconds, seekableStart),
      Math.max(seekableStart, seekableEnd - 0.05),
    );
  }

  if (!Number.isFinite(targetSeconds) || targetSeconds < 0) {
    return;
  }

  videoElement.currentTime = targetSeconds;
};

export const MediaLibraryManager = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [uploadFolder, setUploadFolder] = useState<R2UploadFolder>(DEFAULT_UPLOAD_FOLDER);
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

      const levels = buildPathLevels(normalizedPath);

      for (const levelPath of levels) {
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

        const isNewerThanCurrentCover =
          new Date(item.updated_at).getTime() > new Date(existing.latestUpdatedAt).getTime();

        map.set(levelPath, {
          ...existing,
          itemCount: existing.itemCount + 1,
          latestUpdatedAt: isNewerThanCurrentCover ? item.updated_at : existing.latestUpdatedAt,
          coverMediaUrl: isNewerThanCurrentCover ? item.media_url : existing.coverMediaUrl,
          coverMediaType: isNewerThanCurrentCover ? item.media_type : existing.coverMediaType,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
  }, [items]);

  const breadcrumbs = useMemo(() => {
    const parts = splitPath(currentPath);
    const levels: Array<{ label: string; path: string }> = [{ label: "Root", path: "" }];

    for (let index = 0; index < parts.length; index += 1) {
      levels.push({ label: parts[index], path: parts.slice(0, index + 1).join("/") });
    }

    return levels;
  }, [currentPath]);

  const explorerEntries = useMemo<ExplorerEntry[]>(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const isGlobalSearch = normalizedSearch.length > 0;

    const folderEntries: FolderEntry[] = folderNodes
      .filter((folder) => {
        if (!isGlobalSearch && folder.parentPath !== currentPath) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          folder.name.toLowerCase().includes(normalizedSearch) ||
          folder.path.toLowerCase().includes(normalizedSearch)
        );
      })
      .map((folder) => ({
        kind: "folder",
        id: `folder:${folder.path}`,
        name: folder.name,
        path: folder.path,
        parentPath: folder.parentPath,
        itemCount: folder.itemCount,
        latestUpdatedAt: folder.latestUpdatedAt,
        coverMediaUrl: folder.coverMediaUrl,
        coverMediaType: folder.coverMediaType,
      }));

    const mediaEntries: MediaEntry[] = items
      .filter((item) => {
        const itemPath = normalizeFolderPath(item.folder_origin);

        if (!isGlobalSearch && itemPath !== currentPath) {
          return false;
        }

        if (entryTypeFilter === "image" && item.media_type !== "image") {
          return false;
        }

        if (entryTypeFilter === "video" && item.media_type !== "video") {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.media_url.toLowerCase().includes(normalizedSearch) ||
          itemPath.toLowerCase().includes(normalizedSearch)
        );
      })
      .map((item) => ({
        kind: "media",
        id: item.id,
        name: item.name,
        path: normalizeFolderPath(item.folder_origin),
        item,
      }));

    let combined: ExplorerEntry[] = [];

    if (entryTypeFilter === "folders") {
      combined = folderEntries;
    } else if (entryTypeFilter === "all") {
      combined = [...folderEntries, ...mediaEntries];
    } else {
      combined = mediaEntries;
    }

    combined.sort((left, right) => {
      const leftName = left.name.toLowerCase();
      const rightName = right.name.toLowerCase();

      if (sortOption === "name-asc") {
        return leftName.localeCompare(rightName);
      }

      const leftUpdated =
        left.kind === "folder"
          ? new Date(left.latestUpdatedAt).getTime()
          : new Date(left.item.updated_at).getTime();
      const rightUpdated =
        right.kind === "folder"
          ? new Date(right.latestUpdatedAt).getTime()
          : new Date(right.item.updated_at).getTime();

      if (sortOption === "updated-desc") {
        return rightUpdated - leftUpdated;
      }

      const leftCreated =
        left.kind === "folder" ? leftUpdated : new Date(left.item.created_at).getTime();
      const rightCreated =
        right.kind === "folder" ? rightUpdated : new Date(right.item.created_at).getTime();

      if (sortOption === "created-desc") {
        return rightCreated - leftCreated;
      }

      const leftSize = left.kind === "folder" ? left.itemCount : (left.item.file_size_bytes ?? 0);
      const rightSize =
        right.kind === "folder" ? right.itemCount : (right.item.file_size_bytes ?? 0);
      return rightSize - leftSize;
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
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "Unable to upload media." });
      }
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
        item.id === itemId
          ? {
              ...item,
              folder_origin: normalizedFolder,
            }
          : item,
      ),
    );
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold text-white">Media Library</h2>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            void loadItems();
          }}
          disabled={loading}
          className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </motion.button>
      </div>

      <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
        <h3 className="mb-3 text-sm font-medium text-gray-200">Upload To Library</h3>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs text-gray-400">
            R2 Upload Target
            <select
              value={uploadFolder}
              onChange={(e) => setUploadFolder(e.target.value as R2UploadFolder)}
              className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {UPLOAD_FOLDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-gray-400">
            Library Folder Label
            <input
              value={libraryFolderLabel}
              onChange={(e) => setLibraryFolderLabel(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
              placeholder="e.g. showreel, devops, ui"
            />
          </label>

          <label className="text-xs text-gray-400">
            Files
            <input
              type="file"
              multiple
              accept={getMimeTypesForFolder(uploadFolder).join(",")}
              onChange={(e) => {
                void handleUploadFiles(e.currentTarget.files);
                e.currentTarget.value = "";
              }}
              className="mt-1 block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-600"
            />
          </label>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <Upload className="h-3.5 w-3.5" />
          Dedup is by content hash. Same file bytes will be reused instead of re-uploaded.
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded border p-3 text-sm ${
            message.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            setCurrentPath("");
          }}
          className="inline-flex items-center gap-1 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40"
        >
          <Home className="h-3.5 w-3.5" />
          Root
        </motion.button>

        {breadcrumbs.map((crumb, index) => {
          if (index === 0) return null;

          return (
            <div key={crumb.path} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  setCurrentPath(crumb.path);
                }}
                className={`rounded-md border px-2.5 py-1.5 text-xs ${
                  crumb.path === currentPath
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                    : "border-gray-600 text-gray-200 hover:border-cyan-500/40"
                }`}
              >
                {crumb.label}
              </motion.button>
            </div>
          );
        })}

        {uploading && <span className="text-xs text-cyan-300">Uploading...</span>}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4">
        <label className="relative md:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders and media globally"
            className="w-full rounded-md border border-gray-600 bg-gray-900/40 py-2 pl-8 pr-3 text-sm text-white"
          />
        </label>

        <select
          value={entryTypeFilter}
          onChange={(e) => setEntryTypeFilter(e.target.value as EntryTypeFilter)}
          className="rounded-md border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-white"
        >
          <option value="all">Filter: All Entries</option>
          <option value="folders">Filter: Folders</option>
          <option value="image">Filter: Images</option>
          <option value="video">Filter: Videos</option>
        </select>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="rounded-md border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-white"
        >
          <option value="updated-desc">Sort: Recently Updated</option>
          <option value="created-desc">Sort: Recently Created</option>
          <option value="name-asc">Sort: Name A-Z</option>
          <option value="size-desc">Sort: Largest Size</option>
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading explorer...</p>
      ) : explorerEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
          No folders or media match your current search/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {explorerEntries.map((entry) => {
            if (entry.kind === "folder") {
              return (
                <motion.button
                  key={entry.id}
                  type="button"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setCurrentPath(entry.path);
                    if (searchQuery.trim().length > 0) {
                      setSearchQuery("");
                    }
                  }}
                  className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 text-center hover:border-cyan-500/40"
                >
                  <div className="mb-2 flex aspect-video items-center justify-center rounded-md border border-gray-700 bg-gray-950/70">
                    <FolderOpen className="h-10 w-10 text-cyan-300" />
                  </div>

                  <p className="truncate text-sm font-medium text-white">{entry.name}</p>
                </motion.button>
              );
            }

            const item = entry.item;

            return (
              <div key={entry.id} className="rounded-lg border border-gray-700 bg-gray-900/30 p-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setPreviewItem(item);
                  }}
                  className="mb-2 block aspect-video w-full overflow-hidden rounded bg-black"
                  aria-label={`Preview ${item.name}`}
                >
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      muted
                      playsInline
                      preload="metadata"
                      onLoadedMetadata={seekThumbnailToVideoCenter}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.media_url}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </motion.button>

                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  {item.media_type === "video" ? (
                    <Video className="h-3.5 w-3.5 text-cyan-300" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5 text-cyan-300" />
                  )}
                  <span>{item.media_type}</span>
                  <span>•</span>
                  <span>
                    {item.file_size_bytes
                      ? `${Math.round(item.file_size_bytes / (1024 * 1024))}MB`
                      : "-"}
                  </span>
                </div>

                <label className="mb-2 block text-xs text-gray-400">
                  Name
                  <input
                    defaultValue={item.name}
                    onBlur={(e) => {
                      const nextName = e.target.value;
                      if (nextName !== item.name) {
                        void handleRename(item.id, nextName);
                      }
                    }}
                    className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
                  />
                </label>

                <label className="block text-xs text-gray-400">
                  Folder Path
                  <input
                    defaultValue={item.folder_origin ?? ""}
                    onBlur={(e) => {
                      const nextFolder = e.target.value;
                      if (nextFolder !== (item.folder_origin ?? "")) {
                        void handleMoveFolder(item.id, nextFolder);
                      }
                    }}
                    className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-1.5 text-sm text-white"
                  />
                </label>

                <p className="mt-2 truncate text-[11px] text-gray-500">
                  Path: {entry.path || "(root)"}
                </p>

                <p className="mt-1 text-[11px] text-gray-500">
                  Updated {new Date(item.updated_at).toLocaleString()}
                </p>

                <div className="mt-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      setPreviewItem(item);
                    }}
                    className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20"
                  >
                    View Full
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.button
            type="button"
            whileHover={{ opacity: 1 }}
            whileTap={{ opacity: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              setPreviewItem(null);
            }}
            className="absolute inset-0 bg-black/85"
            aria-label="Close preview"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-5xl rounded-xl border border-gray-700 bg-gray-900 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-medium text-white">{previewItem.name}</p>
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  setPreviewItem(null);
                }}
                className="rounded-md border border-gray-600 px-2 py-1 text-xs text-gray-200 hover:border-cyan-500/40"
              >
                Close
              </motion.button>
            </div>

            <div className="max-h-[76vh] overflow-hidden rounded-lg bg-black">
              {previewItem.media_type === "video" ? (
                <video
                  src={previewItem.media_url}
                  controls
                  preload="metadata"
                  className="max-h-[76vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewItem.media_url}
                  alt={previewItem.name}
                  className="max-h-[76vh] w-full object-contain"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
