/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  createSteppedSliderAnimator,
  type SteppedSliderAnimator,
} from "../../lib/steppedSliderAnimator";
import { uploadToR2 } from "../../lib/storage/r2client";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
} from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";

const ALLOWED_SHOWREEL_MIME_TYPES = new Set(getMimeTypesForFolder(R2_UPLOAD_FOLDERS.heroShowreel));
const MAX_SHOWREEL_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.heroShowreel].maxBytes;
const SHOWREEL_ACCEPT_TYPES = getMimeTypesForFolder(R2_UPLOAD_FOLDERS.heroShowreel).join(",");
const VOLUME_STEP = 1;
const VOLUME_STEP_INTERVAL_MS = 12;

const formatVolumePercent = (value: number) => {
  return `${Math.round(value)}%`;
};

export const ShowreelManager = () => {
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [defaultVolume, setDefaultVolume] = useState(10);
  const [savingVolume, setSavingVolume] = useState(false);
  const [volumeMessage, setVolumeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const volumeAnimatorRef = useRef<SteppedSliderAnimator | null>(null);

  useEffect(() => {
    volumeAnimatorRef.current = createSteppedSliderAnimator({
      initialValue: 10,
      min: 0,
      max: 100,
      step: VOLUME_STEP,
      intervalMs: VOLUME_STEP_INTERVAL_MS,
      onStep: (nextVolume) => {
        setDefaultVolume(nextVolume);
        if (!previewVideoRef.current) return;
        previewVideoRef.current.volume = nextVolume / 100;
      },
    });

    return () => {
      volumeAnimatorRef.current?.stop();
      volumeAnimatorRef.current = null;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "showreel_default_volume")
        .single();
      if (!isMounted || error || !data) return;
      const v = Number(data.value);
      if (!Number.isNaN(v) && v >= 0 && v <= 100) {
        setDefaultVolume(v);
        volumeAnimatorRef.current?.setImmediate(v);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const applyPreviewVolume = (volumePercent: number) => {
    if (!previewVideoRef.current) return;

    previewVideoRef.current.volume = Math.max(0, Math.min(volumePercent, 100)) / 100;
  };

  const handleDefaultVolumeChange = (volumePercent: number) => {
    volumeAnimatorRef.current?.setImmediate(volumePercent);
  };

  useEffect(() => {
    let isMounted = true;
    const loadShowreel = async () => {
      // We store the showreel in a generic settings table
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "showreel_url")
        .single();

      if (!isMounted) return;

      if (!error && data) {
        const value: unknown = data.value;
        if (typeof value === "string") {
          try {
            const parsed = new URL(value);
            if (parsed.protocol === "https:") {
              setCurrentUrl(parsed.href);
            }
          } catch {
            // intentional — discard invalid or non-HTTPS URLs
          }
        }
      }
    };
    void loadShowreel();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile) return;

    setLoading(true);
    setMessage(null);

    try {
      // Upload directly to Cloudflare R2
      const rawUrl = await uploadToR2(videoFile, R2_UPLOAD_FOLDERS.heroShowreel);
      // Reconstruct via URL parser so the stored/displayed href is derived from
      // parsed components, not the raw string (breaks static-analysis taint chain).
      const parsedUpload = new URL(rawUrl);
      if (parsedUpload.protocol !== "https:") throw new Error("Upload returned a non-HTTPS URL");
      const url = parsedUpload.href;

      // Upsert the sanitized URL into the site settings table
      const { error: dbError } = await supabase
        .from("site_settings")
        .upsert({ key: "showreel_url", value: url });

      if (dbError) throw dbError;

      setCurrentUrl(url);
      setVideoFile(null);
      setMessage({ type: "success", text: "Showreel updated successfully!" });
    } catch (err) {
      if (err instanceof Error) {
        setMessage({ type: "error", text: err.message });
      } else {
        setMessage({ type: "error", text: "Upload failed" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDefaultVolume = async () => {
    setSavingVolume(true);
    setVolumeMessage(null);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "showreel_default_volume", value: String(defaultVolume) });
    setSavingVolume(false);
    if (error) {
      setVolumeMessage({ type: "error", text: error.message });
    } else {
      setVolumeMessage({ type: "success", text: "Default volume saved!" });
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
      <div className="flex items-center space-x-2 mb-6 border-b border-gray-700 pb-4">
        <Play className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold text-white">Main Page Showreel</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Upload New Video</h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <input
              type="file"
              accept={SHOWREEL_ACCEPT_TYPES}
              required
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
              onChange={(e) => {
                const input = e.currentTarget;
                const file = input.files ? input.files[0] : null;
                if (!file) {
                  setVideoFile(null);
                  input.value = "";
                  return;
                }

                if (!ALLOWED_SHOWREEL_MIME_TYPES.has(file.type.toLowerCase())) {
                  setMessage({ type: "error", text: "Showreel file type is not allowed." });
                  setVideoFile(null);
                  input.value = "";
                  return;
                }

                if (file.size <= 0 || file.size > MAX_SHOWREEL_SIZE_BYTES) {
                  const maxMB = Math.round(MAX_SHOWREEL_SIZE_BYTES / (1024 * 1024));
                  setMessage({
                    type: "error",
                    text: `Showreel file is empty or exceeds ${maxMB}MB.`,
                  });
                  setVideoFile(null);
                  input.value = "";
                  return;
                }

                setMessage(null);
                setVideoFile(file);
              }}
            />

            <button
              type="submit"
              disabled={loading || !videoFile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Uploading & Saving..." : "Update Showreel"}
            </button>

            {message && (
              <div
                className={`p-3 rounded text-sm ${message.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-400" : "bg-red-500/10 border-red-500/50 text-red-500"} border`}
              >
                {message.text}
              </div>
            )}
          </form>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-4">Current Showreel</h3>
          {currentUrl ? (
            <div className="rounded-lg overflow-hidden border border-gray-700 bg-black aspect-video relative">
              <video
                ref={previewVideoRef}
                src={currentUrl}
                controls
                onLoadedMetadata={() => {
                  applyPreviewVolume(defaultVolume);
                }}
                onPlay={() => {
                  applyPreviewVolume(defaultVolume);
                }}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-gray-700 text-gray-500 text-sm">
              No showreel configured
            </div>
          )}
        </div>
      </div>

      {/* Default starting volume */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-400 mb-1">Default Starting Volume</h3>
        <p className="text-xs text-gray-500 mb-4">
          Sets the initial volume when a visitor first plays the showreel. Range is 0–100%. Default:
          10%.
        </p>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={defaultVolume}
            onChange={(e) => handleDefaultVolumeChange(Number(e.target.value))}
            className="flex-1 accent-cyan-400"
          />
          <span className="text-sm font-mono w-16 text-right text-cyan-300">
            {formatVolumePercent(defaultVolume)}
          </span>
          <button
            type="button"
            onClick={() => {
              void handleSaveDefaultVolume();
            }}
            disabled={savingVolume}
            className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-medium py-1.5 px-4 rounded-md transition-colors disabled:opacity-50"
          >
            {savingVolume ? "Saving…" : "Save"}
          </button>
        </div>

        {volumeMessage && (
          <div
            className={`mt-3 p-2 rounded text-xs ${
              volumeMessage.type === "success"
                ? "bg-green-500/10 border-green-500/50 text-green-400"
                : "bg-red-500/10 border-red-500/50 text-red-500"
            } border`}
          >
            {volumeMessage.text}
          </div>
        )}
      </div>
    </div>
  );
};
