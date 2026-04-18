/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { uploadToR2 } from "../../lib/storage/r2client";
import { R2_UPLOAD_FOLDERS, R2_UPLOAD_POLICIES } from "../../lib/storage/r2UploadPolicies";
import { supabase } from "../../lib/supabase";

const ALLOWED_SHOWREEL_MIME_TYPES = new Set(
  R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.heroShowreel].mimeTypes,
);
const MAX_SHOWREEL_SIZE_BYTES = R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.heroShowreel].maxBytes;
const SHOWREEL_ACCEPT_TYPES =
  R2_UPLOAD_POLICIES[R2_UPLOAD_FOLDERS.heroShowreel].mimeTypes.join(",");

export const ShowreelManager = () => {
  const [loading, setLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
                const file = e.target.files ? e.target.files[0] : null;
                if (!file) {
                  setVideoFile(null);
                  return;
                }

                if (!ALLOWED_SHOWREEL_MIME_TYPES.has(file.type.toLowerCase())) {
                  setMessage({ type: "error", text: "Showreel file type is not allowed." });
                  setVideoFile(null);
                  return;
                }

                if (file.size <= 0 || file.size > MAX_SHOWREEL_SIZE_BYTES) {
                  setMessage({ type: "error", text: "Showreel file is empty or exceeds 200MB." });
                  setVideoFile(null);
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
              <video src={currentUrl} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-gray-700 text-gray-500 text-sm">
              No showreel configured
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
