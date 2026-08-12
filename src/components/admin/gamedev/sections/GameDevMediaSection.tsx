/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { seekThumbnailToVideoCenter } from "../../../../lib/media/seekThumbnailToVideoCenter";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { inferMediaTypeFromUrl } from "../../mediaLibrary/mediaUrlDisplayName";
import { SelectedMediaPreview } from "../../mediaLibrary/SelectedMediaPreview";
import type { MediaLibraryRoleFilter } from "../formSections";

interface MediaRoleCardProps {
  title: string;
  description: string;
  previewUrl: string | null;
  previewMediaType?: "image" | "video";
  onPick: () => void;
  onClear: () => void;
  showUrlInput?: boolean;
  urlValue?: string;
  onUrlChange?: (value: string) => void;
  urlPlaceholder?: string;
}

const MediaRoleCard = ({
  title,
  description,
  previewUrl,
  previewMediaType,
  onPick,
  onClear,
  showUrlInput = false,
  urlValue = "",
  onUrlChange,
  urlPlaceholder,
}: MediaRoleCardProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const resolvedType =
    previewMediaType ?? (previewUrl ? inferMediaTypeFromUrl(previewUrl) : "image");

  return (
    <div className="flex flex-col rounded-lg border border-gray-700 bg-gray-900/40 p-3">
      <p className="text-sm font-medium text-gray-200">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>

      <div className="mt-3 aspect-video w-full overflow-hidden rounded bg-black">
        {previewUrl ? (
          resolvedType === "video" ? (
            <video
              src={previewUrl}
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={seekThumbnailToVideoCenter}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">
            No media selected
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onMouseEnter={playHoverSound}
          onClick={() => {
            playClickSound();
            onPick();
          }}
          className="rounded border border-cyan-500/35 bg-cyan-600/20 px-2 py-1 text-[11px] font-medium text-cyan-100 hover:bg-cyan-600/30"
        >
          Pick
        </motion.button>

        {previewUrl ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              onClear();
            }}
            className="rounded border border-gray-600 px-2 py-1 text-[11px] text-gray-300 hover:border-gray-500"
          >
            Clear
          </motion.button>
        ) : null}
      </div>

      {showUrlInput && onUrlChange ? (
        <div className="mt-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={playHoverSound}
            onClick={() => {
              playClickSound();
              setShowAdvanced((current) => !current);
            }}
            className="text-[11px] text-gray-400 hover:text-gray-200"
          >
            {showAdvanced ? "Hide paste URL" : "Paste URL"}
          </motion.button>

          {showAdvanced ? (
            <input
              type="url"
              value={urlValue}
              onChange={(e) => onUrlChange(e.target.value.trim() || "")}
              placeholder={urlPlaceholder}
              className="mt-2 block w-full rounded-md border-gray-600 bg-gray-700 px-2 py-1.5 text-xs text-white"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

interface GameDevMediaSectionProps {
  itemMediaId: string;
  mediaAccept: string;
  maxMediaSizeMb: number;
  selectedHeaderMediaUrl: string | null;
  pendingHeaderPreviewUrl: string | null;
  mediaFile: File | null;
  onHeaderMediaUrlChange: (url: string | null) => void;
  onMediaFileChange: (file: File | null) => void;
  onMediaValidationError: (message: string) => void;
  selectedCardThumbnailUrl: string | null;
  onCardThumbnailUrlChange: (url: string | null) => void;
  selectedHeaderThumbnailUrl: string | null;
  onHeaderThumbnailUrlChange: (url: string | null) => void;
  onOpenMediaLibrary: (role: MediaLibraryRoleFilter) => void;
  allowedMediaMimeTypes: Set<string>;
  maxMediaSizeBytes: number;
}

export const GameDevMediaSection = ({
  itemMediaId,
  mediaAccept,
  maxMediaSizeMb,
  selectedHeaderMediaUrl,
  pendingHeaderPreviewUrl,
  mediaFile,
  onHeaderMediaUrlChange,
  onMediaFileChange,
  onMediaValidationError,
  selectedCardThumbnailUrl,
  onCardThumbnailUrlChange,
  selectedHeaderThumbnailUrl,
  onHeaderThumbnailUrlChange,
  onOpenMediaLibrary,
  allowedMediaMimeTypes,
  maxMediaSizeBytes,
}: GameDevMediaSectionProps) => {
  const headerPreviewUrl =
    mediaFile && pendingHeaderPreviewUrl ? pendingHeaderPreviewUrl : selectedHeaderMediaUrl;

  const headerPreviewType =
    mediaFile && pendingHeaderPreviewUrl
      ? mediaFile.type.toLowerCase().startsWith("video/")
        ? "video"
        : "image"
      : undefined;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Assign hero media for the project page and gallery cards. Use Pick on each role or browse
        the full library below.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MediaRoleCard
          title="Header"
          description="Cinematic hero image or video on the project page."
          previewUrl={headerPreviewUrl}
          previewMediaType={headerPreviewType}
          onPick={() => onOpenMediaLibrary("header")}
          onClear={() => {
            onHeaderMediaUrlChange(null);
            onMediaFileChange(null);
          }}
        />

        <MediaRoleCard
          title="Card thumbnail"
          description="Preview image for project cards in the gallery."
          previewUrl={selectedCardThumbnailUrl}
          onPick={() => onOpenMediaLibrary("thumbnail")}
          onClear={() => onCardThumbnailUrlChange(null)}
          showUrlInput
          urlValue={selectedCardThumbnailUrl ?? ""}
          onUrlChange={(value) => onCardThumbnailUrlChange(value || null)}
          urlPlaceholder="https://..."
        />

        <MediaRoleCard
          title="Header poster"
          description="Poster image when the header is a video."
          previewUrl={selectedHeaderThumbnailUrl}
          onPick={() => onOpenMediaLibrary("poster")}
          onClear={() => onHeaderThumbnailUrlChange(null)}
          showUrlInput
          urlValue={selectedHeaderThumbnailUrl ?? ""}
          onUrlChange={(value) => onHeaderThumbnailUrlChange(value || null)}
          urlPlaceholder="https://..."
        />
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
        <p className="text-sm font-medium text-gray-200">Upload header file</p>
        <p className="mt-1 text-xs text-gray-500">
          Optional direct upload for header media (max {maxMediaSizeMb}MB).
        </p>

        {selectedHeaderMediaUrl && !mediaFile ? (
          <SelectedMediaPreview
            label="Header media"
            url={selectedHeaderMediaUrl}
            onClear={() => onHeaderMediaUrlChange(null)}
          />
        ) : null}

        {mediaFile && pendingHeaderPreviewUrl ? (
          <SelectedMediaPreview
            label="Pending upload"
            url={pendingHeaderPreviewUrl}
            mediaType={mediaFile.type.toLowerCase().startsWith("video/") ? "video" : "image"}
            onClear={() => onMediaFileChange(null)}
          />
        ) : null}

        <input
          id={itemMediaId}
          type="file"
          accept={mediaAccept}
          className="mt-2 block w-full text-white file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          onChange={(e) => {
            const input = e.currentTarget;
            const nextFile = input.files && input.files.length > 0 ? input.files[0] : null;
            if (!nextFile) {
              onMediaFileChange(null);
              input.value = "";
              return;
            }
            if (!allowedMediaMimeTypes.has(nextFile.type.toLowerCase())) {
              onMediaValidationError("Media file type is not allowed.");
              onMediaFileChange(null);
              input.value = "";
              return;
            }
            if (nextFile.size <= 0 || nextFile.size > maxMediaSizeBytes) {
              onMediaValidationError(`Media file is empty or exceeds ${maxMediaSizeMb}MB.`);
              onMediaFileChange(null);
              input.value = "";
              return;
            }
            onMediaFileChange(nextFile);
            onHeaderMediaUrlChange(null);
          }}
        />
      </div>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          onOpenMediaLibrary("all");
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/35 bg-cyan-600/15 px-3 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-600/25 sm:w-auto"
      >
        Browse Media Library
      </motion.button>
    </div>
  );
};
