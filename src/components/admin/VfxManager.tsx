/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from "react";
import { dedupeGameDevVfxByMediaUrl, inferMediaTypeFromFile, inferMediaTypeFromUrl } from "../../lib/gamedev";
import { findVfxByMediaUrl } from "../../lib/gamedev/vfxLibrary";
import { playClickSound, playHoverSound, playMenuCloseSound } from "../../lib/sound/interactionSounds";
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
import type { AdminGameDevVfx } from "./types";

const ALLOWED_MEDIA_MIME_TYPES = new Set(getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets));
const MEDIA_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets).join(",");
const MAX_MEDIA_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevAssets].maxBytes;
const MAX_MEDIA_SIZE_MB = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));
const MEDIA_LIBRARY_PICKER_LIMIT = 48;

interface VfxFormState {
  title: string;
  description: string;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  mediaType: "video" | "image";
  tags: string[];
  sortOrder: string;
}

const emptyForm = (): VfxFormState => ({
  title: "",
  description: "",
  mediaUrl: null,
  thumbnailUrl: null,
  mediaType: "video",
  tags: [],
  sortOrder: "",
});

export const VfxManager = () => {
  const formTitleId = useId();
  const [vfxItems, setVfxItems] = useState<AdminGameDevVfx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VfxFormState>(emptyForm);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [mediaLibraryItems, setMediaLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

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

  const loadMediaLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    const { data, error: libraryError } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MEDIA_LIBRARY_PICKER_LIMIT);

    if (!libraryError) {
      setMediaLibraryItems((data ?? []) as MediaLibraryItem[]);
    }

    setIsLoadingLibrary(false);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    void loadMediaLibrary();
  }, [isModalOpen, loadMediaLibrary]);

  const modalTitle = editingId ? "Edit VFX" : "Add VFX";

  const closeModal = () => {
    playMenuCloseSound();
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setMediaFile(null);
    setTagInput("");
    setError(null);
  };

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

  const handleDelete = async (id: string) => {
    const { error: deleteError } = await supabase.from("gamedev_vfx").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    void loadVfx();
  };

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

      if (!mediaFile) {
        mediaType = inferMediaTypeFromUrl(mediaUrl);
      }

      const sortOrder = form.sortOrder.trim() ? Number(form.sortOrder) : null;
      const payload = {
        title,
        description,
        media_url: mediaUrl,
        thumbnail_url: form.thumbnailUrl,
        media_type: mediaType,
        tags: form.tags,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : null,
        show_in_library: true,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("gamedev_vfx")
          .update(payload)
          .eq("id", editingId);

        if (updateError) throw new Error(updateError.message);
      } else {
        const existing = await findVfxByMediaUrl(mediaUrl);

        if (existing) {
          const { error: updateError } = await supabase
            .from("gamedev_vfx")
            .update(payload)
            .eq("id", existing.id);

          if (updateError) throw new Error(updateError.message);
        } else {
          const { error: insertError } = await supabase.from("gamedev_vfx").insert([payload]);
          if (insertError) throw new Error(insertError.message);
        }
      }

      closeModal();
      void loadVfx();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save VFX.");
    } finally {
      setIsSaving(false);
    }
  };

  const sortedItems = useMemo(() => vfxItems, [vfxItems]);

  return (
    <div className="mt-8 rounded-xl border border-gray-700 bg-gray-900/60 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          <h3 className="text-lg font-semibold text-white">VFX Library</h3>
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
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-600"
        >
          <Plus className="h-4 w-4" />
          Add VFX
        </motion.button>
      </div>

      {error && !isModalOpen ? (
        <div className="mb-3 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-sm text-gray-400">Loading VFX...</p>
      ) : sortedItems.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
          No VFX entries yet. Add effects to showcase them globally and on projects.
        </p>
      ) : (
        <ul className="space-y-3">
          {sortedItems.map((item) => (
            <li key={item.id} className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <div className="flex items-start gap-3">
                <div className="h-16 w-28 shrink-0 overflow-hidden rounded-md bg-black">
                  {item.media_type === "video" ? (
                    <video
                      src={item.media_url}
                      poster={item.thumbnail_url ?? undefined}
                      muted
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.media_url}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  {item.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-gray-400">{item.description}</p>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      openEdit(item);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-600/20 px-2 py-1 text-xs text-blue-200"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={playHoverSound}
                    onClick={() => {
                      playClickSound();
                      void handleDelete(item.id);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-600/20 px-2 py-1 text-xs text-red-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </motion.button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
          <button
            type="button"
            className="fixed inset-0 bg-gray-900/80"
            aria-label="Close dialog"
            onClick={() => {
              if (!isSaving) closeModal();
            }}
          />

          <div className="relative mx-auto my-8 w-full max-w-xl px-4">
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="rounded-xl border border-gray-700 bg-gray-800 p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 id={formTitleId} className="text-lg font-semibold text-white">
                  {modalTitle}
                </h4>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={closeModal}
                  className="rounded-md border border-gray-600 p-1 text-gray-300"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {error ? (
                <div className="mb-3 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300">Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                    className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
                    className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300">Media file</label>
                  <input
                    type="file"
                    accept={MEDIA_ACCEPT}
                    className="mt-1 block w-full text-sm text-white file:mr-3 file:rounded file:border-0 file:bg-cyan-700 file:px-3 file:py-1.5"
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
                      }));
                    }}
                  />
                </div>

                {form.mediaUrl && !mediaFile ? (
                  <p className="truncate text-xs text-cyan-200">Selected: {form.mediaUrl}</p>
                ) : null}

                <details className="rounded-lg border border-gray-700 p-3">
                  <summary className="cursor-pointer text-sm text-gray-200">Media Library</summary>
                  {isLoadingLibrary ? (
                    <p className="mt-2 text-xs text-gray-400">Loading...</p>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {mediaLibraryItems.map((item) => (
                        <motion.button
                          key={item.id}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playClickSound();
                            setMediaFile(null);
                            setForm((c) => ({
                              ...c,
                              mediaUrl: item.media_url,
                              mediaType: item.media_type,
                            }));
                          }}
                          className="rounded border border-gray-600 p-2 text-left text-xs text-gray-200 hover:border-cyan-500/40"
                        >
                          {item.name}
                        </motion.button>
                      ))}
                    </div>
                  )}
                </details>

                <div>
                  <label className="block text-sm text-gray-300">Poster thumbnail URL (optional)</label>
                  <input
                    value={form.thumbnailUrl ?? ""}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, thumbnailUrl: e.target.value.trim() || null }))
                    }
                    className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300">Sort order (optional)</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((c) => ({ ...c, sortOrder: e.target.value }))}
                    className="mt-1 w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300">Tags</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white"
                      placeholder="e.g. Niagara, Unity"
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        playClickSound();
                        addTag();
                      }}
                      className="rounded-md bg-cyan-700 px-3 py-2 text-sm text-white"
                    >
                      Add
                    </motion.button>
                  </div>
                  {form.tags.length > 0 ? (
                    <p className="mt-1 text-xs text-cyan-200">{form.tags.join(", ")}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={closeModal}
                  className="rounded-md border border-gray-600 px-4 py-2 text-sm text-gray-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSaving}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-md bg-cyan-700 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save VFX"}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};
