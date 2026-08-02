/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Check, FolderPlus, Image as ImageIcon, RefreshCw, Upload, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMediaLibraryExplorer } from "../../../hooks/mediaLibrary/useMediaLibraryExplorer";
import { seekThumbnailToVideoCenter } from "../../../lib/media/seekThumbnailToVideoCenter";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { MediaLibraryItem } from "../../../lib/storage/mediaLibrary";
import { ExplorerBreadcrumbs } from "./ExplorerBreadcrumbs";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { FolderCard } from "./FolderCard";
import { MediaPreviewModal } from "./MediaPreviewModal";
import type { FolderEntry, MediaEntry } from "./types";

export interface MediaLibraryPickerAction {
  id: string;
  label: string;
  badgeLabel?: string;
  selectedUrl?: string | null;
  onClear?: () => void;
  onSelect: (item: MediaLibraryItem) => void;
  isAvailable?: (item: MediaLibraryItem) => boolean;
}

interface MediaLibraryPickerExplorerProps {
  enabled?: boolean;
  variant?: "inline" | "modal";
  description?: string;
  actions: MediaLibraryPickerAction[];
  onReady?: (api: { reload: () => Promise<void> }) => void;
  onPreviewOpenChange?: (open: boolean) => void;
  previewOverlayClassName?: string;
}

const EXPLORER_GRID_CLASS = {
  inline:
    "grid max-h-80 grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-gray-700/80 bg-gray-950/30 p-2 sm:grid-cols-3",
  modal:
    "grid min-h-[min(52vh,520px)] max-h-[min(62vh,720px)] grid-cols-2 gap-4 overflow-y-auto rounded-lg border border-gray-700/80 bg-gray-950/30 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
} as const;

const PICKER_FEEDBACK_DISMISS_MS = 2500;

const noopDrop = () => {};
const noopExternalDrop = (_files: FileList, _folderPath: string) => {};

interface PickerMediaCardProps {
  entry: MediaEntry;
  actions: MediaLibraryPickerAction[];
  onPreview: (item: MediaLibraryItem) => void;
  onActionSelect: (action: MediaLibraryPickerAction, item: MediaLibraryItem) => void;
}

const PickerMediaCard = ({ entry, actions, onPreview, onActionSelect }: PickerMediaCardProps) => {
  const { item } = entry;
  const availableActions = actions.filter((action) => action.isAvailable?.(item) ?? true);
  const activeRoles = availableActions.filter(
    (action) => action.selectedUrl && action.selectedUrl === item.media_url,
  );
  const isAssigned = activeRoles.length > 0;
  const assignedLabel = activeRoles.map((action) => action.badgeLabel ?? action.label).join(", ");

  return (
    <article
      className={`flex flex-col rounded-lg border bg-gray-900/40 p-2 ${
        isAssigned ? "border-cyan-400/60 ring-1 ring-cyan-400/40" : "border-gray-700"
      }`}
      aria-label={isAssigned ? `Currently used as ${assignedLabel}: ${item.name}` : undefined}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          onPreview(item);
        }}
        className="relative mb-2 block aspect-video w-full overflow-hidden rounded bg-black text-left"
        aria-label={`Preview ${item.name}`}
      >
        {activeRoles.length > 0 ? (
          <div className="absolute top-1.5 left-1.5 z-10 flex max-w-[calc(100%-0.75rem)] flex-wrap gap-1">
            {activeRoles.map((action) => (
              <span
                key={action.id}
                className="rounded bg-cyan-600/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow"
              >
                {action.badgeLabel ?? action.label}
              </span>
            ))}
          </div>
        ) : null}

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

      <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-300">
        {item.media_type === "video" ? (
          <Video className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
        )}
        <span className="truncate font-medium">{item.name}</span>
      </div>

      {availableActions.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {availableActions.map((action) => {
            const isActive = action.selectedUrl === item.media_url;

            return (
              <motion.button
                key={action.id}
                type="button"
                aria-pressed={isActive}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  onActionSelect(action, item);
                }}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-medium ${
                  isActive
                    ? "border-cyan-400/70 bg-cyan-600/45 text-white"
                    : "border-cyan-500/35 bg-cyan-600/20 text-cyan-100 hover:bg-cyan-600/30"
                }`}
              >
                {isActive ? <Check className="h-3 w-3 shrink-0" /> : null}
                {action.label}
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
};

export const MediaLibraryPickerExplorer = ({
  enabled = true,
  variant = "inline",
  description,
  actions,
  onReady,
  onPreviewOpenChange,
  previewOverlayClassName,
}: MediaLibraryPickerExplorerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerFeedback, setPickerFeedback] = useState<string | null>(null);
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
    handleCreateFolder,
  } = useMediaLibraryExplorer();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    onReady?.({ reload: loadItems });
  }, [enabled, loadItems, onReady]);

  useEffect(() => {
    onPreviewOpenChange?.(Boolean(previewItem));
    return () => onPreviewOpenChange?.(false);
  }, [onPreviewOpenChange, previewItem]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadItems();
  }, [enabled, loadItems]);

  useEffect(() => {
    if (!pickerFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPickerFeedback(null);
    }, PICKER_FEEDBACK_DISMISS_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pickerFeedback]);

  const handleActionSelect = (action: MediaLibraryPickerAction, item: MediaLibraryItem) => {
    action.onSelect(item);

    if (action.id === "body") {
      setPickerFeedback(`Inserted into body: ${item.name}`);
      return;
    }

    const roleLabel = action.badgeLabel ?? action.label;
    setPickerFeedback(`Set as ${roleLabel}: ${item.name}`);
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className={variant === "inline" ? "mt-3 space-y-3" : "space-y-3"}>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}

      {message ? (
        <div
          className={`rounded border p-2 text-xs ${
            message.type === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {pickerFeedback ? (
        <div className="rounded border border-green-500/40 bg-green-500/10 p-2 text-xs text-green-300">
          {pickerFeedback}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            void loadItems();
          }}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40 disabled:opacity-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {loading ? "Refreshing..." : "Refresh"}
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40 disabled:opacity-50"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            const name = window.prompt("New folder name");
            if (name?.trim()) {
              void handleCreateFolder(name.trim());
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-2.5 py-1.5 text-xs text-gray-200 hover:border-cyan-500/40"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          New Folder
        </motion.button>
      </div>

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
        <p className="py-6 text-center text-xs text-gray-400">Loading explorer...</p>
      ) : (
        <section aria-label="Media library picker" className={EXPLORER_GRID_CLASS[variant]}>
          {explorerEntries.length === 0 ? (
            <p className="col-span-full py-6 text-center text-xs text-gray-500">
              No folders or media here yet. Upload files or browse another folder.
            </p>
          ) : (
            explorerEntries.map((entry) =>
              entry.kind === "folder" ? (
                <FolderCard
                  key={entry.id}
                  entry={entry as FolderEntry}
                  onNavigate={setCurrentPath}
                  onClearSearch={() => setSearchQuery("")}
                  onDropMedia={noopDrop}
                  onDropFolder={noopDrop}
                  onDropExternalFiles={noopExternalDrop}
                  onContextMenu={(e) => {
                    e.preventDefault();
                  }}
                />
              ) : (
                <PickerMediaCard
                  key={entry.id}
                  entry={entry as MediaEntry}
                  actions={actions}
                  onPreview={setPreviewItem}
                  onActionSelect={handleActionSelect}
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
          void handleUploadFiles(e.currentTarget.files, currentPath);
          e.currentTarget.value = "";
        }}
      />

      {previewItem ? (
        <MediaPreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          overlayClassName={previewOverlayClassName}
        />
      ) : null}
    </div>
  );
};
