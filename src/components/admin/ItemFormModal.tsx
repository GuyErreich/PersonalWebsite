/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

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
import { uploadToR2 } from "../../lib/storage/r2client";
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

export const ItemFormModal = ({ isOpen, onClose, type, onSuccess }: ItemFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("gamepad");
  // For GameDev (Image/Video File), for DevOps (Tech Stack as comma separated string)
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [techStack, setTechStack] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalMediaUrl = "";
      let finalThumbnailUrl = null;

      // Handle File Upload for Game Dev Items using Cloudflare R2
      if (type === "gamedev" && mediaFile) {
        // We organize folders by project type
        finalMediaUrl = await uploadToR2(mediaFile, "gamedev-assets");
      }

      // Handle optional Custom Thumbnail Upload
      if (type === "gamedev" && thumbnailFile) {
        finalThumbnailUrl = await uploadToR2(thumbnailFile, "gamedev-thumbnails");
      }

      const tableName = type === "gamedev" ? "gamedev_items" : "devops_projects";

      const payload: Record<string, unknown> = {
        title,
        description,
        icon_name: selectedIcon,
        github_url: githubUrl || null,
        live_url: liveUrl || null,
      };

      if (type === "gamedev") {
        if (!finalMediaUrl) throw new Error("Media file is required for Game Dev projects.");
        payload.media_url = finalMediaUrl;
        payload.thumbnail_url = finalThumbnailUrl;
      } else {
        payload.tech_stack = techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const { error: dbError } = await supabase.from(tableName).insert([payload]);

      if (dbError) throw dbError;

      // Reset form on success
      setTitle("");
      setDescription("");
      setSelectedIcon("gamepad");
      setMediaFile(null);
      setThumbnailFile(null);
      setTechStack("");
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
                      <button
                        key={iconOpt.id}
                        type="button"
                        onClick={() => setSelectedIcon(iconOpt.id)}
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
                      </button>
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
                        required
                        className="mt-1 block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setMediaFile(e.target.files[0]);
                          }
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
                        accept="image/*"
                        className="mt-1 block w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setThumbnailFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label
                      htmlFor="item-tech-stack"
                      className="block text-sm font-medium text-gray-300"
                    >
                      Tech Stack (comma separated)
                    </label>
                    <input
                      id="item-tech-stack"
                      type="text"
                      required
                      placeholder="e.g. Docker, AWS, Terraform"
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                      value={techStack}
                      onChange={(e) => setTechStack(e.target.value)}
                    />
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
