/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { useMediaLibraryExplorer } from "../../hooks/mediaLibrary/useMediaLibraryExplorer";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { ExplorerBreadcrumbs } from "./mediaLibrary/ExplorerBreadcrumbs";
import { ExplorerToolbar } from "./mediaLibrary/ExplorerToolbar";
import { FolderCard } from "./mediaLibrary/FolderCard";
import { MediaCard } from "./mediaLibrary/MediaCard";
import { MediaPreviewModal } from "./mediaLibrary/MediaPreviewModal";
import { MediaUploadPanel } from "./mediaLibrary/MediaUploadPanel";

export const MediaLibraryManager = () => {
  const {
    loading,
    uploading,
    message,
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
  } = useMediaLibraryExplorer();

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

      <MediaUploadPanel
        uploadFolder={uploadFolder}
        setUploadFolder={setUploadFolder}
        libraryFolderLabel={libraryFolderLabel}
        setLibraryFolderLabel={setLibraryFolderLabel}
        onUpload={(files) => {
          void handleUploadFiles(files);
        }}
      />

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
      ) : explorerEntries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-700 p-8 text-center text-sm text-gray-500">
          No folders or media match your current search/filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {explorerEntries.map((entry) =>
            entry.kind === "folder" ? (
              <FolderCard
                key={entry.id}
                entry={entry}
                onNavigate={setCurrentPath}
                onClearSearch={() => setSearchQuery("")}
              />
            ) : (
              <MediaCard
                key={entry.id}
                entry={entry}
                onPreview={setPreviewItem}
                onRename={(id, name) => {
                  void handleRename(id, name);
                }}
                onMoveFolder={(id, folder) => {
                  void handleMoveFolder(id, folder);
                }}
              />
            ),
          )}
        </div>
      )}

      {previewItem && <MediaPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
};
