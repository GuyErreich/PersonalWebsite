/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { FolderOpen, Plus, Sparkles, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import { dedupeGameDevVfxByMediaUrl, inferMediaTypeFromFile } from "../../lib/gamedev";
import { findVfxByMediaUrl } from "../../lib/gamedev/vfxLibrary";
import {
  playClickSound,
  playHoverSound,
  playMenuCloseSound,
} from "../../lib/sound/interactionSounds";
import {
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
import { ConfirmDialog } from "./mediaLibrary/ConfirmDialog";
import type { MediaLibraryPickerAction } from "./mediaLibrary/MediaLibraryPickerExplorer";
import { MediaLibraryPickerModal } from "./mediaLibrary/MediaLibraryPickerModal";
import type { AdminGameDevVfx } from "./types";
import { VfxLibraryCard } from "./vfx/VfxLibraryCard";
import { VfxLibrarySkeleton } from "./vfx/VfxLibrarySkeleton";

const ALLOWED_MEDIA_MIME_TYPES = new Set(getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets));
const MEDIA_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets).join(",");
const MAX_MEDIA_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevAssets].maxBytes;
const MAX_MEDIA_SIZE_MB = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));

interface VfxFormState {
  title: string;
  description: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  mediaType: "video" | "image";
  tags: string[];
  sortOrder: string;
  showInLibrary: boolean;
}

const emptyForm = (): VfxFormState => ({
  title: "",
  description: "",
  mediaUrl: null,
  thumbnailUrl: null,
  mediaType: "video",
  tags: [],
  sortOrder: "",
  showInLibrary: false,
});

const inputClassName =
  "mt-1 w-full rounded-lg border border-gray-600 bg-gray-900/70 px-3 py-2 text-sm text-white shadow-inner focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30";

export const VfxManager = () => {
  const formHeadingId = useId();
  const formTitleId = useId();
  const formDescriptionId = useId();
  const formMediaFileId = useId();
  const formThumbnailUrlId = useId();
  const formSortOrderId = useId();
  const formTagsId = useId();
  const [vfxItems, setVfxItems] = useState<AdminGameDevVfx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VfxFormState>(emptyForm);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadVfx = useCallback(async () => {
    setIsLoading(true);
    const { data, error: loadError } = await supabase
      .from("gamedev_vfx")
      .select("*")
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setVfxItems([]);
    } else {
      setError(null);
      setVfxItems(
        dedupeGameDevVfxByMediaUrl(
          ((data ?? []) as AdminGameDevVfx[]).map((item) => ({
            ...item,
            tags: item.tags ?? [],
          })),
        ),
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadVfx();
  }, [loadVfx]);

  const modalTitle = editingId ? "Edit VFX" : "Add VFX";
  const selectedMediaUrl = mediaFile ? null : form.mediaUrl;
  const publicCount = useMemo(
    () => vfxItems.filter((item) => item.show_in_library).length,
    [vfxItems],
  );

  const closeModal = useCallback(() => {
    playMenuCloseSound();
    setIsMediaLibraryOpen(false);
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setMediaFile(null);
    setTagInput("");
    setError(null);
  }, []);

  const handleMediaLibrarySelect = useCallback((item: MediaLibraryItem) => {
    setMediaFile(null);
    setForm((current) => ({
      ...current,
      mediaUrl: item.media_url,
      mediaType: item.media_type,
      // Drop stale poster when the clip changes; keep only if the same media URL was re-selected.
      thumbnailUrl: current.mediaUrl === item.media_url ? current.thumbnailUrl : null,
    }));
    setIsMediaLibraryOpen(false);
  }, []);

  const clearMediaLibrarySelection = useCallback(() => {
    setMediaFile(null);
    setForm((current) => ({ ...current, mediaUrl: null, thumbnailUrl: null }));
  }, []);

  const mediaLibraryActions = useMemo((): MediaLibraryPickerAction[] => {
    return [
      {
        id: "vfx-media",
        label: "Use as VFX Media",
        badgeLabel: "VFX",
        selectedUrl: selectedMediaUrl,
        onClear: clearMediaLibrarySelection,
        onSelect: handleMediaLibrarySelect,
      },
    ];
  }, [clearMediaLibrarySelection, handleMediaLibrarySelect, selectedMediaUrl]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSaving) return;
      // Nested media picker owns Escape first.
      if (isMediaLibraryOpen) return;
      closeModal();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeModal, isMediaLibraryOpen, isModalOpen, isSaving]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setMediaFile(null);
    setTagInput("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: AdminGameDevVfx) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      mediaUrl: item.media_url,
      thumbnailUrl: item.thumbnail_url,
      mediaType: item.media_type,
      tags: item.tags ?? [],
      sortOrder: item.sort_order != null ? String(item.sort_order) : "",
      showInLibrary: item.show_in_library ?? false,
    });
    setMediaFile(null);
    setTagInput("");
    setError(null);
    setIsModalOpen(true);
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || form.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }

    setForm((current) => ({ ...current, tags: [...current.tags, trimmed] }));
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((current) => ({ ...current, tags: current.tags.filter((entry) => entry !== tag) }));
  };

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from("gamedev_vfx").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setPendingDeleteId(null);
    void loadVfx();
  };

  const pendingDeleteItem = pendingDeleteId
    ? (vfxItems.find((item) => item.id === pendingDeleteId) ?? null)
    : null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setError("Title is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      let mediaUrl = form.mediaUrl;
      let mediaType = form.mediaType;

      if (mediaFile) {
        const { item } = await uploadOrReuseMediaLibraryItem({
          file: mediaFile,
          uploadFolder: R2_UPLOAD_FOLDERS.gameDevAssets,
          folderOrigin: "gamedev",
          preferredName: stripFileExtension(mediaFile.name),
        });
        mediaUrl = item.media_url;
        mediaType = item.media_type;
      }

      if (!mediaUrl) {
        setError("Media is required.");
        setIsSaving(false);
        return;
      }

      // When not uploading a new file, keep form/media-library media_type.
      // URL inference is unreliable for extensionless or atypical video URLs.

      const sortOrder = form.sortOrder.trim() ? Number(form.sortOrder) : null;
      const payload = {
        title,
        description,
        media_url: mediaUrl,
        thumbnail_url: form.thumbnailUrl,
        media_type: mediaType,
        tags: form.tags,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : null,
        show_in_library: form.showInLibrary,
      };

      if (editingId) {
        const existing = await findVfxByMediaUrl(mediaUrl);

        if (existing && existing.id !== editingId) {
          throw new Error("VFX already exists for this media. Edit the existing entry instead.");
        }

        const { error: updateError } = await supabase
          .from("gamedev_vfx")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw new Error(updateError.message);
      } else {
        const existing = await findVfxByMediaUrl(mediaUrl);

        if (existing) {
          throw new Error("VFX already exists for this media. Edit the existing entry instead.");
        }

        const { error: insertError } = await supabase.from("gamedev_vfx").insert([payload]);
        if (insertError) throw new Error(insertError.message);
      }

      closeModal();
      void loadVfx();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save VFX.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-gray-700 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.08),transparent_42%),linear-gradient(to_bottom,rgba(17,24,39,0.95),rgba(3,7,18,0.98))] p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-gray-700/80 pb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/10 p-2">
              <Sparkles className="h-5 w-5 text-cyan-300" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white sm:text-xl">VFX Library</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-400">
                Curate the global effects pool used on project pages and the Game Dev section.
              </p>
            </div>
          </div>

          {!isLoading ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-gray-600 bg-gray-900/60 px-2.5 py-1 text-xs text-gray-300">
                {vfxItems.length} effect{vfxItems.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-100">
                {publicCount} public
              </span>
            </div>
          ) : null}
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            openCreate();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/35 bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-[0_10px_30px_-18px_rgba(6,182,212,0.9)] hover:bg-cyan-500"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add VFX
        </motion.button>
      </div>

      {error && !isModalOpen ? (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <VfxLibrarySkeleton />
      ) : vfxItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-600/80 bg-gray-900/30 px-6 py-14 text-center">
          <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <Sparkles className="h-8 w-8 text-cyan-300" aria-hidden="true" />
          </div>
          <h4 className="text-base font-medium text-white">No VFX yet</h4>
          <p className="mt-2 max-w-md text-sm text-gray-400">
            Upload clips or stills to build your reusable effects library for projects and the
            public gallery.
          </p>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              openCreate();
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm text-white hover:bg-cyan-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add your first effect
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {vfxItems.map((item) => (
            <VfxLibraryCard
              key={item.id}
              item={item}
              onEdit={() => openEdit(item)}
              onDelete={() => {
                setPendingDeleteId(item.id);
              }}
            />
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby={formHeadingId}
        >
          <button
            type="button"
            className="fixed inset-0 bg-gray-950/85 backdrop-blur-sm"
            aria-label="Close dialog"
            onClick={() => {
              if (!isSaving) closeModal();
            }}
          />

          <div className="relative mx-auto my-8 w-full max-w-2xl px-4">
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl"
            >
              <div className="border-b border-gray-700/80 bg-gray-900/80 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 id={formHeadingId} className="text-lg font-semibold text-white">
                      {modalTitle}
                    </h4>
                    <p className="mt-1 text-xs text-gray-400">
                      Effects added here appear in the global library and can be linked to projects.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={playHoverSound}
                    disabled={isSaving}
                    onClick={() => {
                      if (isSaving) return;
                      playClickSound();
                      closeModal();
                    }}
                    className="rounded-lg border border-gray-600 p-2 text-gray-300 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              <div className="max-h-[min(72vh,760px)] overflow-y-auto px-5 py-4">
                {error ? (
                  <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor={formTitleId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Title
                      </label>
                      <input
                        id={formTitleId}
                        required
                        value={form.title}
                        onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                        className={inputClassName}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={formDescriptionId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Description
                      </label>
                      <textarea
                        id={formDescriptionId}
                        rows={3}
                        value={form.description}
                        onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                        className={inputClassName}
                        placeholder="What does this effect demonstrate?"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={formMediaFileId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Upload media
                      </label>
                      <input
                        id={formMediaFileId}
                        type="file"
                        accept={MEDIA_ACCEPT}
                        className="mt-1 block w-full text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-cyan-600"
                        onChange={(e) => {
                          const nextFile = e.currentTarget.files?.[0] ?? null;
                          if (!nextFile) {
                            setMediaFile(null);
                            return;
                          }

                          if (!ALLOWED_MEDIA_MIME_TYPES.has(nextFile.type.toLowerCase())) {
                            setError("Media file type is not allowed.");
                            return;
                          }

                          if (nextFile.size <= 0 || nextFile.size > MAX_MEDIA_SIZE_BYTES) {
                            setError(`Media file is empty or exceeds ${MAX_MEDIA_SIZE_MB}MB.`);
                            return;
                          }

                          setError(null);
                          setMediaFile(nextFile);
                          setForm((c) => ({
                            ...c,
                            mediaType: inferMediaTypeFromFile(nextFile),
                            // New upload replaces the clip; do not keep the previous poster.
                            thumbnailUrl: null,
                          }));
                        }}
                      />
                    </div>

                    {selectedMediaUrl ? (
                      <div className="sm:col-span-2 overflow-hidden rounded-xl border border-cyan-500/30 bg-black/40">
                        <div className="aspect-video">
                          {form.mediaType === "video" ? (
                            <video
                              src={selectedMediaUrl}
                              muted
                              playsInline
                              controls
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={selectedMediaUrl}
                              alt="Selected VFX media"
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    ) : null}

                    <div className="sm:col-span-2">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={playHoverSound}
                        onClick={() => {
                          playClickSound();
                          setIsMediaLibraryOpen(true);
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-600/15 px-3 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-600/25"
                      >
                        <FolderOpen className="h-4 w-4" aria-hidden="true" />
                        Browse Media Library
                      </motion.button>
                    </div>

                    <div>
                      <label
                        htmlFor={formThumbnailUrlId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Poster thumbnail URL
                      </label>
                      <input
                        id={formThumbnailUrlId}
                        value={form.thumbnailUrl ?? ""}
                        onChange={(e) =>
                          setForm((c) => ({ ...c, thumbnailUrl: e.target.value.trim() || null }))
                        }
                        className={inputClassName}
                        placeholder="Optional video poster"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={formSortOrderId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Sort order
                      </label>
                      <input
                        id={formSortOrderId}
                        type="number"
                        value={form.sortOrder}
                        onChange={(e) => setForm((c) => ({ ...c, sortOrder: e.target.value }))}
                        className={inputClassName}
                        placeholder="Lower appears first"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm text-gray-200">
                        <input
                          type="checkbox"
                          checked={form.showInLibrary}
                          onChange={(e) =>
                            setForm((c) => ({ ...c, showInLibrary: e.target.checked }))
                          }
                          className="rounded border-gray-600"
                        />
                        Show in public VFX library
                      </label>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor={formTagsId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Tags
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          id={formTagsId}
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          className={`${inputClassName} mt-0`}
                          placeholder="e.g. Niagara, Unity"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            addTag();
                          }}
                          className="shrink-0 rounded-lg bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-600"
                        >
                          Add
                        </motion.button>
                      </div>

                      {form.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {form.tags.map((tag) => (
                            <motion.button
                              key={tag}
                              type="button"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                playClickSound();
                                removeTag(tag);
                              }}
                              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-100"
                            >
                              {tag} ×
                            </motion.button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-700/80 bg-gray-900/80 px-5 py-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={playHoverSound}
                  disabled={isSaving}
                  onClick={() => {
                    if (isSaving) return;
                    playClickSound();
                    closeModal();
                  }}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSaving}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={playHoverSound}
                  onClick={playClickSound}
                  className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save VFX"}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <MediaLibraryPickerModal
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        title="Pick VFX Media"
        description="Browse folders and select an image or video from the media library for this effect."
        actions={mediaLibraryActions}
      />

      {pendingDeleteItem ? (
        <ConfirmDialog
          key={`delete-vfx-${pendingDeleteItem.id}`}
          title={`Delete "${pendingDeleteItem.title}"?`}
          description="This permanently removes the effect from the global VFX library and unlinks it from every project."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          danger
          onConfirm={() => {
            void handleDelete(pendingDeleteItem.id);
          }}
          onCancel={() => setPendingDeleteId(null)}
        />
      ) : null}
    </div>
  );
};
