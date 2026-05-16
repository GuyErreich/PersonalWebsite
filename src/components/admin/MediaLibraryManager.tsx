/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Eye, FolderOpen, FolderPlus, Pencil, Trash2, Upload } from "lucide-react";
import { type DragEvent, useRef, useState } from "react";
import { useMediaLibraryExplorer } from "../../hooks/mediaLibrary/useMediaLibraryExplorer";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../../lib/sound/interactionSounds";
import { ActionDialog } from "./mediaLibrary/ActionDialog";
import { ConfirmDialog } from "./mediaLibrary/ConfirmDialog";
import { ContextMenu, type ContextMenuItem } from "./mediaLibrary/ContextMenu";
import { ExplorerBreadcrumbs } from "./mediaLibrary/ExplorerBreadcrumbs";
import { ExplorerToolbar } from "./mediaLibrary/ExplorerToolbar";
import { FolderCard } from "./mediaLibrary/FolderCard";
import { MediaCard } from "./mediaLibrary/MediaCard";
import { MediaPreviewModal } from "./mediaLibrary/MediaPreviewModal";
import type { FolderEntry, MediaEntry } from "./mediaLibrary/types";
import { UploadProgressModal } from "./mediaLibrary/UploadProgressModal";

type ContextTarget =
  | { kind: "canvas" }
  | { kind: "folder"; entry: FolderEntry }
  | { kind: "media"; entry: MediaEntry };

type PendingAction =
  | { kind: "new-folder" }
  | { kind: "rename-folder"; entry: FolderEntry }
  | { kind: "rename-media"; entry: MediaEntry }
  | { kind: "confirm-delete-folder"; entry: FolderEntry }
  | { kind: "confirm-delete-media"; entry: MediaEntry }
  | null;

export const MediaLibraryManager = () => {
  const supabaseProjectRef = import.meta.env.VITE_SUPABASE_URL?.match(
    /^https:\/\/([^.]+)\.supabase\.co$/i,
  )?.[1];

  const supabaseDashboardUrl = supabaseProjectRef
    ? `https://supabase.com/dashboard/project/${supabaseProjectRef}`
    : null;

  const {
    loading,
    uploading,
    message,
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
    handleRenameFolder,
    handleCreateFolder,
    handleDeleteMedia,
    handleMoveMediaToFolder,
    handleMoveFolderToFolder,
    handleDeleteFolder,
  } = useMediaLibraryExplorer();

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    target: ContextTarget;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isExternalDropActive, setIsExternalDropActive] = useState(false);
  const externalDragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isExternalFileDrag = (e: DragEvent<HTMLElement>): boolean =>
    Array.from(e.dataTransfer.types).includes("Files");

  const openCtxMenu = (
    e: { clientX: number; clientY: number; preventDefault(): void; stopPropagation(): void },
    target: ContextTarget,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    playMenuOpenSound();
    setCtxMenu({ x: e.clientX, y: e.clientY, target });
  };

  const buildMenuItems = (target: ContextTarget): ContextMenuItem[] => {
    if (target.kind === "canvas") {
      return [
        {
          label: "New Folder",
          icon: <FolderPlus className="h-3.5 w-3.5" />,
          onClick: () => setPendingAction({ kind: "new-folder" }),
        },
        {
          label: "Upload File",
          icon: <Upload className="h-3.5 w-3.5" />,
          onClick: () => fileInputRef.current?.click(),
        },
      ];
    }

    if (target.kind === "folder") {
      const { entry } = target;
      return [
        {
          label: "Open",
          icon: <FolderOpen className="h-3.5 w-3.5" />,
          onClick: () => {
            setCurrentPath(entry.path);
            setSearchQuery("");
          },
        },
        {
          label: "Rename",
          icon: <Pencil className="h-3.5 w-3.5" />,
          onClick: () => setPendingAction({ kind: "rename-folder", entry }),
        },
        {
          label: "Remove From Library",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          danger: true,
          onClick: () => {
            setPendingAction({ kind: "confirm-delete-folder", entry });
          },
        },
      ];
    }

    const { entry } = target;
    return [
      {
        label: "Preview",
        icon: <Eye className="h-3.5 w-3.5" />,
        onClick: () => setPreviewItem(entry.item),
      },
      {
        label: "Rename",
        icon: <Pencil className="h-3.5 w-3.5" />,
        onClick: () => setPendingAction({ kind: "rename-media", entry }),
      },
      {
        label: "Remove From Library",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        onClick: () => {
          setPendingAction({ kind: "confirm-delete-media", entry });
        },
      },
    ];
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-cyan-300" />
          <h2 className="text-xl font-bold text-white">Media Library</h2>
        </div>

        <div className="flex items-center gap-2">
          {supabaseDashboardUrl && (
            <motion.a
              href={supabaseDashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={playHoverSound}
              onClick={playClickSound}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:border-cyan-500/40 hover:text-cyan-200"
              aria-label="Open Supabase dashboard"
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase
            </motion.a>
          )}

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

      <ExplorerBreadcrumbs
        breadcrumbs={breadcrumbs}
        currentPath={currentPath}
        setCurrentPath={setCurrentPath}
        uploading={uploading}
      />

      <ExplorerToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        entryTypeFilter={entryTypeFilter}
        setEntryTypeFilter={setEntryTypeFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading explorer...</p>
      ) : (
        <section
          aria-label="File explorer"
          className={`relative grid min-h-48 grid-cols-2 gap-6 rounded-lg p-2 transition-colors sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${
            isExternalDropActive ? "bg-cyan-500/10 ring-2 ring-cyan-300/60" : ""
          }`}
          onDragOver={(e) => {
            const dragTypes = Array.from(e.dataTransfer.types);
            const isInternalDrag =
              dragTypes.includes("application/x-media-item-id") ||
              dragTypes.includes("application/x-folder-path");

            if (!isExternalFileDrag(e) && !isInternalDrag) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = isExternalFileDrag(e) ? "copy" : "move";

            if (isExternalFileDrag(e)) {
              setIsExternalDropActive(true);
            }
          }}
          onDragEnter={(e) => {
            if (!isExternalFileDrag(e)) return;
            externalDragDepthRef.current += 1;
            setIsExternalDropActive(true);
          }}
          onDragLeave={(e) => {
            if (!isExternalFileDrag(e)) return;
            externalDragDepthRef.current = Math.max(0, externalDragDepthRef.current - 1);
            if (externalDragDepthRef.current === 0) {
              setIsExternalDropActive(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (isExternalFileDrag(e)) {
              externalDragDepthRef.current = 0;
              setIsExternalDropActive(false);

              if (e.dataTransfer.files.length > 0) {
                void handleUploadFiles(e.dataTransfer.files);
              }
              return;
            }

            const movedItemId = e.dataTransfer.getData("application/x-media-item-id");
            if (movedItemId) {
              void handleMoveMediaToFolder(movedItemId, currentPath);
              return;
            }

            const movedFolderPath = e.dataTransfer.getData("application/x-folder-path");
            if (movedFolderPath) {
              void handleMoveFolderToFolder(movedFolderPath, currentPath);
            }
          }}
          onContextMenu={(e) => openCtxMenu(e, { kind: "canvas" })}
        >
          {isExternalDropActive && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-dashed border-cyan-200/70 bg-cyan-500/10">
              <p className="rounded-md border border-cyan-200/80 bg-cyan-500/25 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-50">
                Drop Files To Upload
              </p>
            </div>
          )}

          {explorerEntries.length === 0 ? (
            <div className="col-span-full py-8 text-center">
              <p className="text-sm text-gray-500">
                Empty — use Upload or New Folder to start organizing your library.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-100 hover:border-cyan-500/40"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload Files
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onMouseEnter={playHoverSound}
                  onClick={() => {
                    playClickSound();
                    setPendingAction({ kind: "new-folder" });
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-xs text-gray-100 hover:border-cyan-500/40"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  New Folder
                </motion.button>
              </div>
            </div>
          ) : (
            explorerEntries.map((entry) =>
              entry.kind === "folder" ? (
                <FolderCard
                  key={entry.id}
                  entry={entry}
                  onNavigate={setCurrentPath}
                  onClearSearch={() => setSearchQuery("")}
                  onDropExternalFiles={(files, folderPath) => {
                    void handleUploadFiles(files, folderPath);
                  }}
                  onDropMedia={(itemId, folderPath) => {
                    void handleMoveMediaToFolder(itemId, folderPath);
                  }}
                  onDropFolder={(folderPath, targetFolderPath) => {
                    void handleMoveFolderToFolder(folderPath, targetFolderPath);
                  }}
                  onContextMenu={(e) => openCtxMenu(e, { kind: "folder", entry })}
                />
              ) : (
                <MediaCard
                  key={entry.id}
                  entry={entry}
                  onPreview={setPreviewItem}
                  onContextMenu={(e) => openCtxMenu(e, { kind: "media", entry })}
                />
              ),
            )
          )}
        </section>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          void handleUploadFiles(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />

      {previewItem && <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}

      {isUploadProgressOpen && (
        <UploadProgressModal
          items={uploadProgressItems}
          uploading={uploading}
          onClose={closeUploadProgress}
        />
      )}

      <AnimatePresence>
        {ctxMenu && (
          <ContextMenu
            key="ctx"
            x={ctxMenu.x}
            y={ctxMenu.y}
            items={buildMenuItems(ctxMenu.target)}
            onClose={() => {
              playMenuCloseSound();
              setCtxMenu(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingAction?.kind === "new-folder" && (
          <ActionDialog
            key="dlg-new"
            title="New Folder"
            placeholder="folder-name"
            onConfirm={async (name) => {
              await handleCreateFolder(name);
            }}
            onClose={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "rename-folder" && (
          <ActionDialog
            key="dlg-rf"
            title={`Rename "${pendingAction.entry.name}"`}
            defaultValue={pendingAction.entry.name}
            onConfirm={async (name) => {
              await handleRenameFolder(pendingAction.entry.path, name);
            }}
            onClose={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "rename-media" && (
          <ActionDialog
            key="dlg-rm"
            title={`Rename "${pendingAction.entry.name}"`}
            defaultValue={pendingAction.entry.name}
            onConfirm={async (name) => {
              await handleRename(pendingAction.entry.id, name);
            }}
            onClose={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "confirm-delete-folder" && (
          <ConfirmDialog
            key="dlg-delete-folder"
            title={`Remove "${pendingAction.entry.name}" from library?`}
            description="This removes the folder and nested items from the media library index. Stored files are not deleted from remote object storage."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            danger
            onConfirm={() => {
              void handleDeleteFolder(pendingAction.entry.path);
              setPendingAction(null);
            }}
            onCancel={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "confirm-delete-media" && (
          <ConfirmDialog
            key="dlg-delete-media"
            title={`Remove "${pendingAction.entry.name}" from library?`}
            description="This removes only the media library record. The original object in remote storage is not deleted."
            confirmLabel="Remove"
            cancelLabel="Cancel"
            danger
            onConfirm={() => {
              void handleDeleteMedia(pendingAction.entry.id);
              setPendingAction(null);
            }}
            onCancel={() => setPendingAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
