/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { AnimatePresence, motion } from "framer-motion";
import { Eye, FolderOpen, FolderPlus, Pencil, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useMediaLibraryExplorer } from "../../hooks/mediaLibrary/useMediaLibraryExplorer";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
  playMenuOpenSound,
} from "../../lib/sound/interactionSounds";
import { ActionDialog } from "./mediaLibrary/ActionDialog";
import { ContextMenu, type ContextMenuItem } from "./mediaLibrary/ContextMenu";
import { ExplorerBreadcrumbs } from "./mediaLibrary/ExplorerBreadcrumbs";
import { ExplorerToolbar } from "./mediaLibrary/ExplorerToolbar";
import { FolderCard } from "./mediaLibrary/FolderCard";
import { MediaCard } from "./mediaLibrary/MediaCard";
import { MediaPreviewModal } from "./mediaLibrary/MediaPreviewModal";
import type { FolderEntry, MediaEntry } from "./mediaLibrary/types";

type ContextTarget =
  | { kind: "canvas" }
  | { kind: "folder"; entry: FolderEntry }
  | { kind: "media"; entry: MediaEntry };

type PendingAction =
  | { kind: "new-folder" }
  | { kind: "rename-folder"; entry: FolderEntry }
  | { kind: "rename-media"; entry: MediaEntry }
  | null;

export const MediaLibraryManager = () => {
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
    loadItems,
    handleUploadFiles,
    handleRename,
    handleRenameFolder,
    handleCreateFolder,
    handleDeleteMedia,
    handleDeleteFolder,
  } = useMediaLibraryExplorer();

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    target: ContextTarget;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          label: "Delete",
          icon: <Trash2 className="h-3.5 w-3.5" />,
          danger: true,
          onClick: () => {
            void handleDeleteFolder(entry.path);
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
        label: "Delete",
        icon: <Trash2 className="h-3.5 w-3.5" />,
        danger: true,
        onClick: () => {
          void handleDeleteMedia(entry.id);
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
          className="grid min-h-48 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
          onContextMenu={(e) => openCtxMenu(e, { kind: "canvas" })}
        >
          {explorerEntries.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-gray-500">
              Empty — right-click to upload a file or create a subfolder.
            </p>
          ) : (
            explorerEntries.map((entry) =>
              entry.kind === "folder" ? (
                <FolderCard
                  key={entry.id}
                  entry={entry}
                  onNavigate={setCurrentPath}
                  onClearSearch={() => setSearchQuery("")}
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
            onConfirm={(name) => handleCreateFolder(name)}
            onClose={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "rename-folder" && (
          <ActionDialog
            key="dlg-rf"
            title={`Rename "${pendingAction.entry.name}"`}
            defaultValue={pendingAction.entry.name}
            onConfirm={(name) => {
              void handleRenameFolder(pendingAction.entry.path, name);
            }}
            onClose={() => setPendingAction(null)}
          />
        )}

        {pendingAction?.kind === "rename-media" && (
          <ActionDialog
            key="dlg-rm"
            title={`Rename "${pendingAction.entry.name}"`}
            defaultValue={pendingAction.entry.name}
            onConfirm={(name) => {
              void handleRename(pendingAction.entry.id, name);
            }}
            onClose={() => setPendingAction(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
