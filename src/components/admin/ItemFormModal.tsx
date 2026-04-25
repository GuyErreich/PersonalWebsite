/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import {
  Code2,
  Cpu,
  Database,
  Gamepad2,
  Globe,
  Monitor,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Wrench,
} from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useDevOpsTechStacks } from "../../hooks/devops/useDevOpsTechStacks";
import { buildGameDevStoredContent, parseGameDevStoredContent } from "../../lib/gamedev";
import { fetchGitHubProjectSeed } from "../../lib/github/fetchRepoSeed";
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
import { MarkdownRenderer } from "../MarkdownRenderer";
import type { AdminDevOpsProject, AdminGameDevProject } from "./types";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "gamedev" | "devops";
  onSuccess: () => void;
  editingItem?: AdminGameDevProject | AdminDevOpsProject | null;
}

const AVAILABLE_ICONS = [
  { id: "gamepad", icon: Gamepad2, label: "Game" },
  { id: "code", icon: Code2, label: "Code" },
  { id: "server", icon: Server, label: "Server" },
  { id: "globe", icon: Globe, label: "Web" },
  { id: "cpu", icon: Cpu, label: "Hardware" },
  { id: "database", icon: Database, label: "Database" },
  { id: "rocket", icon: Rocket, label: "Rocket" },
  { id: "shield", icon: Shield, label: "Security" },
  { id: "terminal", icon: Terminal, label: "Terminal" },
  { id: "wrench", icon: Wrench, label: "Tool" },
  { id: "smartphone", icon: Smartphone, label: "Mobile" },
  { id: "monitor", icon: Monitor, label: "Desktop" },
];

const ALLOWED_MEDIA_MIME_TYPES = new Set(getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets));

const MEDIA_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets).join(",");

const MAX_MEDIA_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevAssets].maxBytes;
const MAX_MEDIA_SIZE_MB = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 50000;
const MAX_STACK_LENGTH = 40;
const GAMEDEV_BODY_TEMPLATE = [
  "## Overview",
  "",
  "Write the problem, goal, or design intent here.",
  "",
  "![Feature media](https://your-r2-media-url)",
  "",
  "## Critical Implementation",
  "",
  "```ts",
  "// Paste critical code here",
  "```",
  "",
  "## Breakdown",
  "",
  "Explain the system, tradeoffs, and interesting results.",
  "",
  "![Another media shot](https://your-r2-media-url)",
  "",
  "```cpp",
  "// Another key snippet",
  "```",
  "",
].join("\n");

type BodyEditorTab = "write" | "preview";

const normalizeOptionalHttpsUrl = (value: string, fieldName: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`${fieldName} must use HTTPS.`);
  }

  return parsed.href;
};

export const ItemFormModal = ({
  isOpen,
  onClose,
  type,
  onSuccess,
  editingItem = null,
}: ItemFormModalProps) => {
  const formIdBase = useId();
  const modalTitleId = `${formIdBase}-modal-title`;
  const itemTitleId = `${formIdBase}-item-title`;
  const itemDescriptionId = `${formIdBase}-item-description`;
  const itemBodyId = `${formIdBase}-item-body`;
  const itemBodyAssetUploadId = `${formIdBase}-item-body-asset-upload`;
  const itemMediaId = `${formIdBase}-item-media`;
  const itemLibraryFilterFolderId = `${formIdBase}-item-library-folder`;
  const itemGithubUrlId = `${formIdBase}-item-github-url`;
  const itemLiveUrlId = `${formIdBase}-item-live-url`;
  const itemRepoUrlId = `${formIdBase}-item-repo-url`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { stacks: availableTechStacks } = useDevOpsTechStacks(isOpen && type === "devops");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedFeatureMediaUrl, setSelectedFeatureMediaUrl] = useState<string | null>(null);
  const [libraryFilterFolder, setLibraryFilterFolder] = useState("all");
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [mediaLibraryItems, setMediaLibraryItems] = useState<MediaLibraryItem[]>([]);
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [customStackInput, setCustomStackInput] = useState("");
  const [selectedGameTags, setSelectedGameTags] = useState<string[]>([]);
  const [customGameTagInput, setCustomGameTagInput] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [isImportingRepo, setIsImportingRepo] = useState(false);
  const [isUploadingBodyAsset, setIsUploadingBodyAsset] = useState(false);
  const [activeBodyTab, setActiveBodyTab] = useState<BodyEditorTab>("write");
  const [uploadedBodyMedia, setUploadedBodyMedia] = useState<Array<{ url: string; alt: string }>>(
    [],
  );

  const isEditing = Boolean(editingItem);
  const isEditingGameDev = Boolean(isEditing && type === "gamedev");

  const modalTitle = useMemo(() => {
    if (isEditing) return `Edit ${type === "gamedev" ? "Game Dev Project" : "DevOps Project"}`;
    return `Add New ${type === "gamedev" ? "Game Dev Project" : "DevOps Project"}`;
  }, [isEditing, type]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBody("");
    setSelectedIcon("gamepad");
    setMediaFile(null);
    setSelectedFeatureMediaUrl(null);
    setLibraryFilterFolder("all");
    setSelectedStacks([]);
    setCustomStackInput("");
    setSelectedGameTags([]);
    setCustomGameTagInput("");
    setGithubUrl("");
    setLiveUrl("");
    setRepoUrl("");
    setActiveBodyTab("write");
    setUploadedBodyMedia([]);
    setError(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    if (!editingItem) {
      resetForm();
      return;
    }

    setError(null);
    setTitle(editingItem.title);
    setSelectedIcon(editingItem.icon_name ?? "gamepad");
    setGithubUrl(editingItem.github_url ?? "");
    setLiveUrl(editingItem.live_url ?? "");

    if (type === "gamedev") {
      const gameDevItem = editingItem as AdminGameDevProject;
      const parsed = parseGameDevStoredContent(gameDevItem.description);

      setDescription(parsed.summary);
      setBody(parsed.body);
      setSelectedFeatureMediaUrl(gameDevItem.media_url || null);
      setSelectedGameTags(gameDevItem.tags ?? []);
      setSelectedStacks([]);
    } else {
      const devOpsItem = editingItem as AdminDevOpsProject;
      setDescription(devOpsItem.description);
      setBody("");
      setSelectedFeatureMediaUrl(null);
      setSelectedStacks(devOpsItem.tech_stack ?? []);
      setSelectedGameTags([]);
    }
  }, [editingItem, isOpen, type]);

  useEffect(() => {
    if (!isOpen || type !== "gamedev") {
      return;
    }

    void (async () => {
      setIsLoadingMediaLibrary(true);

      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("updated_at", { ascending: false });

      setIsLoadingMediaLibrary(false);

      if (error) {
        setError(error.message);
        return;
      }

      setMediaLibraryItems((data ?? []) as MediaLibraryItem[]);
    })();
  }, [isOpen, type]);

  if (!isOpen) return null;

  const closeModal = () => {
    playMenuCloseSound();
    onClose();
  };

  const handleImportFromRepo = async () => {
    const normalizedRepoUrl = repoUrl.trim();
    if (!normalizedRepoUrl) {
      setError("Enter a GitHub repository URL to import.");
      return;
    }

    setError(null);
    setIsImportingRepo(true);

    try {
      const seed = await fetchGitHubProjectSeed(normalizedRepoUrl);

      setTitle(seed.title);
      setDescription(seed.description);
      setBody(seed.readme || "");
      setGithubUrl(seed.githubUrl);
      setLiveUrl(seed.liveUrl ?? "");
      setSelectedGameTags(seed.tags);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to import repository data.");
      }
    } finally {
      setIsImportingRepo(false);
    }
  };

  const appendToBody = (snippet: string) => {
    setBody((current) => {
      const trimmed = current.trimEnd();
      if (!trimmed) return snippet;
      return `${trimmed}\n\n${snippet}`;
    });
  };

  const filteredMediaLibraryItems =
    libraryFilterFolder === "all"
      ? mediaLibraryItems
      : mediaLibraryItems.filter(
          (item) => (item.folder_origin ?? "unfiled") === libraryFilterFolder,
        );

  const mediaLibraryFolders = Array.from(
    new Set(mediaLibraryItems.map((item) => item.folder_origin ?? "unfiled")),
  ).sort((a, b) => a.localeCompare(b));

  const handleBodyAssetUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploadingBodyAsset(true);

    try {
      const newMedia: Array<{ url: string; alt: string }> = [];

      for (const file of Array.from(files)) {
        if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type.toLowerCase())) {
          throw new Error("One or more body media files have unsupported types.");
        }

        if (file.size <= 0 || file.size > MAX_MEDIA_SIZE_BYTES) {
          throw new Error(`One or more body media files exceed ${MAX_MEDIA_SIZE_MB}MB.`);
        }

        const { item } = await uploadOrReuseMediaLibraryItem({
          file,
          uploadFolder: R2_UPLOAD_FOLDERS.gameDevAssets,
          folderOrigin: "gamedev",
          preferredName: stripFileExtension(file.name),
        });
        const alt =
          file.name
            .replace(/\.[^.]+$/, "")
            .replace(/[-_]+/g, " ")
            .trim() || "Project media";

        newMedia.push({ url: item.media_url, alt });
      }

      setUploadedBodyMedia((prev) => [...prev, ...newMedia]);

      const { data, error: refreshLibraryError } = await supabase
        .from("media_library")
        .select("*")
        .order("updated_at", { ascending: false });

      if (refreshLibraryError) {
        throw new Error(refreshLibraryError.message);
      }

      setMediaLibraryItems((data ?? []) as MediaLibraryItem[]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to upload body media.");
      }
    } finally {
      setIsUploadingBodyAsset(false);
    }
  };

  const insertUploadedMedia = (mediaUrl: string, mediaAlt: string) => {
    appendToBody(`![${mediaAlt}](${mediaUrl})`);
  };

  const insertLibraryMedia = (item: MediaLibraryItem) => {
    appendToBody(`![${item.name}](${item.media_url})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = title.trim();

    if (!normalizedTitle) {
      setError("Title is required.");
      return;
    }

    if (normalizedTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
      return;
    }

    const normalizedStacks = Array.from(
      new Set(selectedStacks.map((stack) => stack.trim()).filter((stack) => stack.length > 0)),
    );

    const normalizedGameTags = Array.from(
      new Set(selectedGameTags.map((stack) => stack.trim()).filter((stack) => stack.length > 0)),
    );

    if (
      [...normalizedStacks, ...normalizedGameTags].some((stack) => stack.length > MAX_STACK_LENGTH)
    ) {
      setError(`Each stack/tag item must be ${MAX_STACK_LENGTH} characters or fewer.`);
      return;
    }

    if (type === "devops" && normalizedStacks.length === 0) {
      setError("Select at least one tech stack.");
      return;
    }

    let normalizedGithubUrl: string | null;
    let normalizedLiveUrl: string | null;
    try {
      normalizedGithubUrl = normalizeOptionalHttpsUrl(githubUrl, "GitHub URL");
      normalizedLiveUrl = normalizeOptionalHttpsUrl(liveUrl, "Live URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid URL value.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (type === "gamedev") {
        const normalizedSummary = description.trim();
        const normalizedBody = body.trim();

        if (!normalizedSummary) {
          setError("Description is required for Game Dev projects.");
          return;
        }

        if (!normalizedBody) {
          setError("Body markdown is required for Game Dev projects.");
          return;
        }

        const storedDescription = buildGameDevStoredContent(normalizedSummary, normalizedBody);
        if (storedDescription.length > MAX_DESCRIPTION_LENGTH) {
          setError(`Body content must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
          return;
        }

        const sourceGameDev = isEditingGameDev ? (editingItem as AdminGameDevProject) : null;

        let finalMediaUrl = selectedFeatureMediaUrl ?? sourceGameDev?.media_url ?? "";

        if (mediaFile) {
          const { item } = await uploadOrReuseMediaLibraryItem({
            file: mediaFile,
            uploadFolder: R2_UPLOAD_FOLDERS.gameDevAssets,
            folderOrigin: "gamedev",
            preferredName: stripFileExtension(mediaFile.name),
          });
          finalMediaUrl = item.media_url;
        }

        if (isEditingGameDev && sourceGameDev) {
          const { error: updateError } = await supabase
            .from("gamedev_items")
            .update({
              title: normalizedTitle,
              description: storedDescription,
              media_url: finalMediaUrl,
              thumbnail_url: null,
              icon_name: selectedIcon,
              github_url: normalizedGithubUrl,
              live_url: normalizedLiveUrl,
              tags: normalizedGameTags,
            })
            .eq("id", sourceGameDev.id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { data: insertedItem, error: insertError } = await supabase
            .from("gamedev_items")
            .insert([
              {
                title: normalizedTitle,
                description: storedDescription,
                media_url: finalMediaUrl,
                thumbnail_url: null,
                icon_name: selectedIcon,
                github_url: normalizedGithubUrl,
                live_url: normalizedLiveUrl,
                tags: normalizedGameTags,
              },
            ])
            .select("id")
            .single();

          if (insertError || !insertedItem) {
            throw new Error(insertError?.message ?? "Failed to create game dev project.");
          }
        }
      } else {
        const normalizedDescription = description.trim();
        if (!normalizedDescription) {
          setError("Description is required.");
          return;
        }

        if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
          setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
          return;
        }

        if (isEditing && editingItem) {
          const target = editingItem as AdminDevOpsProject;
          const { error: updateError } = await supabase
            .from("devops_projects")
            .update({
              title: normalizedTitle,
              description: normalizedDescription,
              tech_stack: normalizedStacks,
              icon_name: selectedIcon,
              github_url: normalizedGithubUrl,
              live_url: normalizedLiveUrl,
            })
            .eq("id", target.id);

          if (updateError) {
            throw new Error(updateError.message);
          }
        } else {
          const { error: insertError } = await supabase.from("devops_projects").insert([
            {
              title: normalizedTitle,
              description: normalizedDescription,
              tech_stack: normalizedStacks,
              icon_name: selectedIcon,
              github_url: normalizedGithubUrl,
              live_url: normalizedLiveUrl,
            },
          ]);

          if (insertError) {
            throw new Error(insertError.message);
          }
        }
      }

      onSuccess();
      closeModal();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while saving.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby={modalTitleId}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <button
          type="button"
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-label="Close dialog"
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            closeModal();
          }}
        ></button>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        <div className="relative inline-block w-full max-w-2xl transform overflow-hidden rounded-lg border border-gray-700 bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <h3 className="mb-4 text-lg font-medium leading-6 text-white" id={modalTitleId}>
                {modalTitle}
              </h3>

              {error && (
                <div className="mb-4 rounded border border-red-500 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="mb-1 block text-sm font-medium text-gray-300">Project Icon</p>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((iconOpt) => (
                      <motion.button
                        key={iconOpt.id}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={playHoverSound}
                        onClick={() => {
                          playClickSound();
                          setSelectedIcon(iconOpt.id);
                        }}
                        className={`flex flex-col items-center justify-center rounded-lg p-2 transition-colors ${
                          selectedIcon === iconOpt.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                        }`}
                        title={iconOpt.label}
                      >
                        <iconOpt.icon className="mb-1 h-5 w-5" />
                        <span className="flex w-full justify-center truncate text-[10px]">
                          {iconOpt.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor={itemTitleId} className="block text-sm font-medium text-gray-300">
                    Title
                  </label>
                  <input
                    id={itemTitleId}
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {type === "gamedev" ? (
                  <>
                    <div>
                      <label
                        htmlFor={itemDescriptionId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Description (Short)
                      </label>
                      <input
                        id={itemDescriptionId}
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={itemBodyId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Body (Markdown)
                      </label>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            setBody((current) =>
                              current.trim().length > 0 ? current : GAMEDEV_BODY_TEMPLATE,
                            );
                          }}
                          className="rounded-md border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
                        >
                          Insert Starter Template
                        </motion.button>

                        <label
                          htmlFor={itemBodyAssetUploadId}
                          className="cursor-pointer rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-white/30 hover:bg-white/10"
                        >
                          {isUploadingBodyAsset ? "Uploading Media..." : "Upload Media Into Body"}
                        </label>
                        <input
                          id={itemBodyAssetUploadId}
                          type="file"
                          accept={MEDIA_ACCEPT}
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            void handleBodyAssetUpload(e.currentTarget.files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </div>

                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50">
                        <div
                          className="flex gap-2 border-b border-gray-700 bg-gray-800/80 p-2"
                          role="tablist"
                          aria-label="Markdown editor mode"
                        >
                          <motion.button
                            type="button"
                            role="tab"
                            aria-selected={activeBodyTab === "write"}
                            aria-controls={`${itemBodyId}-panel`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              playClickSound();
                              setActiveBodyTab("write");
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              activeBodyTab === "write"
                                ? "bg-cyan-500/20 text-cyan-200"
                                : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            }`}
                          >
                            Write
                          </motion.button>

                          <motion.button
                            type="button"
                            role="tab"
                            aria-selected={activeBodyTab === "preview"}
                            aria-controls={`${itemBodyId}-panel`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              playClickSound();
                              setActiveBodyTab("preview");
                            }}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                              activeBodyTab === "preview"
                                ? "bg-cyan-500/20 text-cyan-200"
                                : "bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            }`}
                          >
                            Preview
                          </motion.button>
                        </div>

                        <div id={`${itemBodyId}-panel`} role="tabpanel" className="p-3">
                          {activeBodyTab === "write" ? (
                            <textarea
                              id={itemBodyId}
                              required
                              rows={12}
                              className="block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={body}
                              onChange={(e) => setBody(e.target.value)}
                            />
                          ) : body.trim() ? (
                            <div className="max-h-[28rem] overflow-y-auto rounded-md border border-gray-700 bg-gray-950/60 p-4">
                              <MarkdownRenderer content={body} />
                            </div>
                          ) : (
                            <div className="rounded-md border border-dashed border-gray-600 bg-gray-950/40 px-4 py-8 text-sm text-gray-400">
                              Add some markdown in Write mode to preview the rendered project body.
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        Supports GitHub-flavored markdown, Mermaid code blocks, syntax-highlighted
                        code fences, styled links, emoji, lists, blockquotes, and image/video
                        embeds. Upload media above and click to insert into the body.
                      </p>

                      {uploadedBodyMedia.length > 0 && (
                        <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase text-cyan-300">
                            Uploaded Media — Click to Insert
                          </p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {uploadedBodyMedia.map((media, idx) => (
                              <motion.button
                                key={`${media.url}-${idx}`}
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onMouseEnter={playHoverSound}
                                onClick={() => {
                                  playClickSound();
                                  insertUploadedMedia(media.url, media.alt);
                                }}
                                className="flex flex-col items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 p-3 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-400/20"
                              >
                                <div className="mb-2 h-10 w-10 rounded bg-cyan-600/40" />
                                <span className="line-clamp-2 text-xs text-cyan-200">
                                  {media.alt}
                                </span>
                                <span className="mt-1 whitespace-nowrap text-[10px] text-cyan-300/60">
                                  Click to add
                                </span>
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="block text-sm font-medium text-gray-300">Project Tags</p>

                      {selectedGameTags.length > 0 && (
                        <p className="text-xs text-gray-400">
                          Selected:{" "}
                          <span className="text-cyan-300">{selectedGameTags.join(", ")}</span>
                        </p>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add tag (e.g. VFX, Unreal, C++)"
                          value={customGameTagInput}
                          onChange={(e) => setCustomGameTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = customGameTagInput.trim();
                              if (trimmed && !selectedGameTags.includes(trimmed)) {
                                setSelectedGameTags((prev) => [...prev, trimmed]);
                              }
                              setCustomGameTagInput("");
                            }
                          }}
                          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            const trimmed = customGameTagInput.trim();
                            if (trimmed && !selectedGameTags.includes(trimmed)) {
                              setSelectedGameTags((prev) => [...prev, trimmed]);
                            }
                            setCustomGameTagInput("");
                          }}
                          disabled={!customGameTagInput.trim()}
                          className="rounded-md bg-cyan-700 px-3 py-2 text-sm text-white hover:bg-cyan-600 disabled:opacity-40"
                        >
                          Add
                        </motion.button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={itemMediaId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Feature Media (Optional)
                      </label>
                      <p className="mb-1 text-xs text-gray-500">
                        Use this for the small top media section on the project page. Leave empty
                        for a blank section.
                      </p>

                      {selectedFeatureMediaUrl && !mediaFile && (
                        <div className="mb-2 flex items-center justify-between rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-1.5 text-xs text-cyan-200">
                          <span className="truncate">
                            Selected from library: {selectedFeatureMediaUrl}
                          </span>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onMouseEnter={playHoverSound}
                            onClick={() => {
                              playClickSound();
                              setSelectedFeatureMediaUrl(null);
                            }}
                            className="ml-2 rounded border border-cyan-300/40 px-2 py-0.5 text-[11px] text-cyan-100 hover:bg-cyan-500/20"
                          >
                            Clear
                          </motion.button>
                        </div>
                      )}

                      <input
                        id={itemMediaId}
                        type="file"
                        accept={MEDIA_ACCEPT}
                        className="mt-1 block w-full text-white file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
                        onChange={(e) => {
                          const input = e.currentTarget;
                          const nextFile =
                            input.files && input.files.length > 0 ? input.files[0] : null;
                          if (!nextFile) {
                            setMediaFile(null);
                            input.value = "";
                            return;
                          }
                          if (!ALLOWED_MEDIA_MIME_TYPES.has(nextFile.type.toLowerCase())) {
                            setError("Media file type is not allowed.");
                            setMediaFile(null);
                            input.value = "";
                            return;
                          }
                          if (nextFile.size <= 0 || nextFile.size > MAX_MEDIA_SIZE_BYTES) {
                            setError(`Media file is empty or exceeds ${MAX_MEDIA_SIZE_MB}MB.`);
                            setMediaFile(null);
                            input.value = "";
                            return;
                          }
                          setError(null);
                          setMediaFile(nextFile);
                        }}
                      />
                    </div>

                    <details className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-gray-200">
                        Media Library
                      </summary>

                      <p className="mt-2 text-xs text-gray-500">
                        Reuse existing media from the gallery. You can set feature media or insert
                        items into the markdown body.
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <label
                          htmlFor={itemLibraryFilterFolderId}
                          className="text-xs text-gray-400"
                        >
                          Folder
                        </label>
                        <select
                          id={itemLibraryFilterFolderId}
                          value={libraryFilterFolder}
                          onChange={(e) => setLibraryFilterFolder(e.target.value)}
                          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white"
                        >
                          <option value="all">All</option>
                          {mediaLibraryFolders.map((folder) => (
                            <option key={folder} value={folder}>
                              {folder}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isLoadingMediaLibrary ? (
                        <p className="mt-3 text-xs text-gray-400">Loading media library...</p>
                      ) : filteredMediaLibraryItems.length === 0 ? (
                        <p className="mt-3 text-xs text-gray-500">
                          No media available for this folder.
                        </p>
                      ) : (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {filteredMediaLibraryItems.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-md border border-gray-700 bg-gray-800/70 p-2"
                            >
                              <div className="mb-2 aspect-video overflow-hidden rounded bg-black">
                                {item.media_type === "video" ? (
                                  <video
                                    src={item.media_url}
                                    muted
                                    playsInline
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <img
                                    src={item.media_url}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>

                              <p className="truncate text-xs text-gray-200">{item.name}</p>

                              <div className="mt-2 flex gap-2">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.96 }}
                                  onMouseEnter={playHoverSound}
                                  onClick={() => {
                                    playClickSound();
                                    setSelectedFeatureMediaUrl(item.media_url);
                                    setMediaFile(null);
                                  }}
                                  className="rounded bg-cyan-700 px-2 py-1 text-[11px] text-white hover:bg-cyan-600"
                                >
                                  Use as Feature
                                </motion.button>

                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.96 }}
                                  onMouseEnter={playHoverSound}
                                  onClick={() => {
                                    playClickSound();
                                    insertLibraryMedia(item);
                                  }}
                                  className="rounded border border-gray-600 px-2 py-1 text-[11px] text-gray-200 hover:border-gray-500"
                                >
                                  Insert in Body
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  </>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor={itemDescriptionId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Description
                      </label>
                      <textarea
                        id={itemDescriptionId}
                        required
                        rows={5}
                        className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <p className="block text-sm font-medium text-gray-300">Tech Stack</p>

                      {availableTechStacks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableTechStacks.map((stack) => (
                            <motion.button
                              key={stack}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onMouseEnter={playHoverSound}
                              onClick={() => {
                                playClickSound();
                                setSelectedStacks((prev) =>
                                  prev.includes(stack)
                                    ? prev.filter((s) => s !== stack)
                                    : [...prev, stack],
                                );
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                selectedStacks.includes(stack)
                                  ? "border-blue-500/60 bg-blue-600/40 text-blue-200"
                                  : "border-gray-600 bg-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                              }`}
                            >
                              {stack}
                            </motion.button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No tech stacks defined yet.</p>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Custom tag (one-off)…"
                          value={customStackInput}
                          onChange={(e) => setCustomStackInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const trimmed = customStackInput.trim();
                              if (trimmed && !selectedStacks.includes(trimmed)) {
                                setSelectedStacks((prev) => [...prev, trimmed]);
                              }
                              setCustomStackInput("");
                            }
                          }}
                          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            const trimmed = customStackInput.trim();
                            if (trimmed && !selectedStacks.includes(trimmed)) {
                              setSelectedStacks((prev) => [...prev, trimmed]);
                            }
                            setCustomStackInput("");
                          }}
                          disabled={!customStackInput.trim()}
                          className="rounded-md bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 disabled:opacity-40"
                        >
                          Add
                        </motion.button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <label
                        htmlFor={itemRepoUrlId}
                        className="block text-sm font-medium text-gray-300"
                      >
                        Import from GitHub Repository
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Prefills title, short description, body (README), repo URL, and tags.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          id={itemRepoUrlId}
                          type="url"
                          placeholder="https://github.com/owner/repo"
                          className="flex-1 rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onMouseEnter={playHoverSound}
                          onClick={() => {
                            playClickSound();
                            void handleImportFromRepo();
                          }}
                          disabled={isImportingRepo || !repoUrl.trim()}
                          className="rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
                        >
                          {isImportingRepo ? "Importing..." : "Import"}
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor={itemGithubUrlId}
                    className="block text-sm font-medium text-gray-300"
                  >
                    GitHub URL (Optional)
                  </label>
                  <input
                    id={itemGithubUrlId}
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor={itemLiveUrlId}
                    className="block text-sm font-medium text-gray-300"
                  >
                    Live URL (Optional)
                  </label>
                  <input
                    id={itemLiveUrlId}
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-600 bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? "Saving..." : isEditing ? "Update Item" : "Save Item"}
              </button>
              <button
                type="button"
                onMouseEnter={playHoverSound}
                onClick={() => {
                  playClickSound();
                  closeModal();
                }}
                disabled={loading}
                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-500 bg-transparent px-4 py-2 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
