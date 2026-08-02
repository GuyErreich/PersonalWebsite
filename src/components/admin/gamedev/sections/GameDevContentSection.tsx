/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { playClickSound, playHoverSound } from "../../../../lib/sound/interactionSounds";
import { MarkdownRenderer } from "../../../MarkdownRenderer";
import { GAMEDEV_BODY_TEMPLATE } from "../gameDevFormConstants";

type BodyEditorTab = "write" | "preview";

interface GameDevContentSectionProps {
  itemBodyId: string;
  itemBodyAssetUploadId: string;
  body: string;
  onBodyChange: (value: string) => void;
  activeBodyTab: BodyEditorTab;
  onActiveBodyTabChange: (tab: BodyEditorTab) => void;
  isComingSoon: boolean;
  isUploadingBodyAsset: boolean;
  bodyAssetInputRef: React.RefObject<HTMLInputElement | null>;
  mediaAccept: string;
  onBodyAssetUpload: (files: FileList | null) => void;
  uploadedBodyMedia: Array<{ url: string; alt: string }>;
  onInsertUploadedMedia: (url: string, alt: string) => void;
}

export const GameDevContentSection = ({
  itemBodyId,
  itemBodyAssetUploadId,
  body,
  onBodyChange,
  activeBodyTab,
  onActiveBodyTabChange,
  isComingSoon,
  isUploadingBodyAsset,
  bodyAssetInputRef,
  mediaAccept,
  onBodyAssetUpload,
  uploadedBodyMedia,
  onInsertUploadedMedia,
}: GameDevContentSectionProps) => (
  <div className="space-y-3">
    <label htmlFor={itemBodyId} className="block text-sm font-medium text-gray-300">
      Body (Markdown)
    </label>

    <div className="flex flex-wrap gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          onBodyChange(body.trim().length > 0 ? body : GAMEDEV_BODY_TEMPLATE);
        }}
        className="rounded-md border border-cyan-500/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/20"
      >
        Insert Starter Template
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onMouseEnter={playHoverSound}
        onClick={() => {
          playClickSound();
          bodyAssetInputRef.current?.click();
        }}
        className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-200 hover:border-white/30 hover:bg-white/10"
      >
        {isUploadingBodyAsset ? "Uploading Media..." : "Upload Media Into Body"}
      </motion.button>

      <input
        id={itemBodyAssetUploadId}
        type="file"
        accept={mediaAccept}
        multiple
        ref={bodyAssetInputRef}
        aria-label="Upload media into body markdown"
        className="hidden"
        onChange={(e) => {
          onBodyAssetUpload(e.currentTarget.files);
          e.currentTarget.value = "";
        }}
      />
    </div>

    <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50">
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
            onActiveBodyTabChange("write");
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
            onActiveBodyTabChange("preview");
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
            required={!isComingSoon}
            rows={14}
            className="block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
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

    <p className="text-xs text-gray-500">
      Supports GitHub-flavored markdown, Mermaid code blocks, syntax-highlighted code fences, styled
      links, emoji, lists, blockquotes, and image/video embeds.
    </p>

    {uploadedBodyMedia.length > 0 ? (
      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
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
                onInsertUploadedMedia(media.url, media.alt);
              }}
              className="flex flex-col items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10 p-3 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-400/20"
            >
              <div className="mb-2 h-10 w-10 rounded bg-cyan-600/40" />
              <span className="line-clamp-2 text-xs text-cyan-200">{media.alt}</span>
              <span className="mt-1 whitespace-nowrap text-[10px] text-cyan-300/60">
                Click to add
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);
