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
import { useState } from "react";
import { useDevOpsTechStacks } from "../../hooks/devops/useDevOpsTechStacks";
import { playClickSound, playHoverSound } from "../../lib/sound/interactionSounds";
import { uploadToR2 } from "../../lib/storage/r2client";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
} from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "gamedev" | "devops";
  onSuccess: () => void;
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
const ALLOWED_THUMBNAIL_MIME_TYPES = new Set(
  getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevThumbnails),
);

const MEDIA_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevAssets).join(",");
const THUMBNAIL_ACCEPT = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.gameDevThumbnails).join(",");

const MAX_MEDIA_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevAssets].maxBytes;
const MAX_THUMBNAIL_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.gameDevThumbnails].maxBytes;
const MAX_MEDIA_SIZE_MB = Math.round(MAX_MEDIA_SIZE_BYTES / (1024 * 1024));
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_STACK_LENGTH = 40;

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

export const ItemFormModal = ({ isOpen, onClose, type, onSuccess }: ItemFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { stacks: availableTechStacks } = useDevOpsTechStacks(isOpen && type === "devops");

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  // DevOps tech stack — chip multi-select + optional custom one-off input
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [customStackInput, setCustomStackInput] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();

    if (!normalizedTitle) {
      setError("Title is required.");
      return;
    }
    if (normalizedTitle.length > MAX_TITLE_LENGTH) {
      setError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
      return;
    }

    if (!normalizedDescription) {
      setError("Description is required.");
      return;
    }
    if (normalizedDescription.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
      return;
    }

    const normalizedStacks = Array.from(
      new Set(selectedStacks.map((stack) => stack.trim()).filter((stack) => stack.length > 0)),
    );
    if (normalizedStacks.some((stack) => stack.length > MAX_STACK_LENGTH)) {
      setError(`Each tech stack item must be ${MAX_STACK_LENGTH} characters or fewer.`);
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
      let finalMediaUrl = "";
      let finalThumbnailUrl = null;

      // Handle File Upload for Game Dev Items using Cloudflare R2
      if (type === "gamedev" && mediaFile) {
        // We organize folders by project type
        finalMediaUrl = await uploadToR2(mediaFile, R2_UPLOAD_FOLDERS.gameDevAssets);
      }

      // Handle optional Custom Thumbnail Upload
      if (type === "gamedev" && thumbnailFile) {
        finalThumbnailUrl = await uploadToR2(thumbnailFile, R2_UPLOAD_FOLDERS.gameDevThumbnails);
      }

      let dbError: { message: string } | null = null;

      if (type === "gamedev") {
        if (!finalMediaUrl) throw new Error("Media file is required for Game Dev projects.");
        ({ error: dbError } = await supabase.from("gamedev_items").insert([
          {
            title: normalizedTitle,
            description: normalizedDescription,
            media_url: finalMediaUrl,
            thumbnail_url: finalThumbnailUrl,
            icon_name: selectedIcon,
            github_url: normalizedGithubUrl,
            live_url: normalizedLiveUrl,
          },
        ]));
      } else {
        ({ error: dbError } = await supabase.from("devops_projects").insert([
          {
            title: normalizedTitle,
            description: normalizedDescription,
            tech_stack: normalizedStacks,
            icon_name: selectedIcon,
            github_url: normalizedGithubUrl,
            live_url: normalizedLiveUrl,
          },
        ]));
      }

      if (dbError) throw new Error(dbError.message);

      // Reset form on success
      setTitle("");
      setDescription("");
      setSelectedIcon("gamepad");
      setMediaFile(null);
      setThumbnailFile(null);
      setSelectedStacks([]);
      setCustomStackInput("");
      setGithubUrl("");
      setLiveUrl("");

      onSuccess();
      onClose();
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
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-white mb-4" id="modal-title">
                Add New {type === "gamedev" ? "Game Dev Project" : "DevOps Project"}
              </h3>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <p className="block text-sm font-medium text-gray-300 mb-1">Project Icon</p>
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
                        className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors ${
                          selectedIcon === iconOpt.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
                        }`}
                        title={iconOpt.label}
                      >
                        <iconOpt.icon className="w-5 h-5 mb-1" />
                        <span className="text-[10px] truncate w-full flex justify-center">
                          {iconOpt.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="item-title" className="block text-sm font-medium text-gray-300">
                    Title
                  </label>
                  <input
                    id="item-title"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="item-description"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id="item-description"
                    required
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {type === "gamedev" ? (
                  <>
                    <div>
                      <label
                        htmlFor="item-media"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Upload Media (Image or Video)
                      </label>
                      <input
                        id="item-media"
                        type="file"
                        accept={MEDIA_ACCEPT}
                        required
                        className="mt-1 block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
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
                    <div>
                      <label
                        htmlFor="item-thumbnail"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Custom Thumbnail (Optional)
                      </label>
                      <p className="text-xs text-gray-500 mb-1">
                        If your media is a video, upload an image here to show before it plays.
                      </p>
                      <input
                        id="item-thumbnail"
                        type="file"
                        accept={THUMBNAIL_ACCEPT}
                        className="mt-1 block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                        onChange={(e) => {
                          const input = e.currentTarget;
                          const nextFile =
                            input.files && input.files.length > 0 ? input.files[0] : null;
                          if (!nextFile) {
                            setThumbnailFile(null);
                            input.value = "";
                            return;
                          }
                          if (!ALLOWED_THUMBNAIL_MIME_TYPES.has(nextFile.type.toLowerCase())) {
                            setError("Thumbnail file type is not allowed.");
                            setThumbnailFile(null);
                            input.value = "";
                            return;
                          }
                          if (nextFile.size <= 0 || nextFile.size > MAX_THUMBNAIL_SIZE_BYTES) {
                            setError("Thumbnail file is empty or exceeds 5MB.");
                            setThumbnailFile(null);
                            input.value = "";
                            return;
                          }
                          setError(null);
                          setThumbnailFile(nextFile);
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="block text-sm font-medium text-gray-300">Tech Stack</p>

                    {/* Available stack chips */}
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
                      <p className="text-xs text-gray-500">
                        No tech stacks defined yet. Add them in the &ldquo;Available Tech
                        Stacks&rdquo; section below the project list.
                      </p>
                    )}

                    {/* Custom one-off stack */}
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

                    {/* Selected stack summary */}
                    {selectedStacks.length > 0 && (
                      <p className="text-xs text-gray-400">
                        Selected: <span className="text-blue-300">{selectedStacks.join(", ")}</span>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="item-github-url"
                    className="block text-sm font-medium text-gray-300"
                  >
                    GitHub URL (Optional)
                  </label>
                  <input
                    id="item-github-url"
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="item-live-url"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Live URL (Optional)
                  </label>
                  <input
                    id="item-live-url"
                    type="url"
                    className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-600">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Item"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-500 shadow-sm px-4 py-2 bg-transparent text-base font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
