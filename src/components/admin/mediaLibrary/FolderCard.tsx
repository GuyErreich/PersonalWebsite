/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { motion } from "framer-motion";
import { Folder } from "lucide-react";
import { type DragEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { playClickSound, playHoverSound } from "../../../lib/sound/interactionSounds";
import type { FolderEntry } from "./types";

interface Props {
  entry: FolderEntry;
  onNavigate: (path: string) => void;
  onClearSearch: () => void;
  onContextMenu: (e: MouseEvent<HTMLButtonElement>) => void;
  onDropMedia: (itemId: string, folderPath: string) => void;
  onDropFolder: (folderPath: string, targetFolderPath: string) => void;
  onDropExternalFiles: (files: FileList, folderPath: string) => void;
}

export const FolderCard = ({
  entry,
  onNavigate,
  onClearSearch,
  onContextMenu,
  onDropMedia,
  onDropFolder,
  onDropExternalFiles,
}: Props) => {
  const [isDropActive, setIsDropActive] = useState(false);
  const [dropLabel, setDropLabel] = useState("Move Here");
  const [isClickAnimating, setIsClickAnimating] = useState(false);
  const dragDepthRef = useRef(0);
  const clickAnimationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (clickAnimationTimeoutRef.current !== null) {
        window.clearTimeout(clickAnimationTimeoutRef.current);
      }
    };
  }, []);

  const triggerClickAnimation = () => {
    if (clickAnimationTimeoutRef.current !== null) {
      window.clearTimeout(clickAnimationTimeoutRef.current);
    }

    setIsClickAnimating(true);
    clickAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsClickAnimating(false);
      clickAnimationTimeoutRef.current = null;
    }, 140);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    if (e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDropActive(false);
      setDropLabel("Move Here");
      onDropExternalFiles(e.dataTransfer.files, entry.path);
      return;
    }

    const mediaItemId = e.dataTransfer.getData("application/x-media-item-id");
    if (mediaItemId) {
      e.preventDefault();
      e.stopPropagation();
      dragDepthRef.current = 0;
      setIsDropActive(false);
      onDropMedia(mediaItemId, entry.path);
      setDropLabel("Move Here");
      return;
    }

    const sourceFolderPath = e.dataTransfer.getData("application/x-folder-path");
    if (!sourceFolderPath) {
      setDropLabel("Move Here");
      return;
    }

    if (entry.isVirtual) {
      e.preventDefault();
      e.stopPropagation();
      setDropLabel("Move Here");
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDropActive(false);
    onDropFolder(sourceFolderPath, entry.path);
    setDropLabel("Move Here");
  };

  const openFolder = () => {
    onNavigate(entry.path);
    onClearSearch();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.95 }}
        animate={isClickAnimating ? { scale: [1, 0.97, 1], y: [0, 1, 0] } : { scale: 1, y: 0 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        onMouseEnter={playHoverSound}
        draggable={!entry.isVirtual}
        onDragStartCapture={(e) => {
          if (entry.isVirtual) {
            e.preventDefault();
            return;
          }

          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("application/x-folder-path", entry.path);
        }}
        onDragEndCapture={() => {
          dragDepthRef.current = 0;
          setIsDropActive(false);
          setDropLabel("Move Here");
        }}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setDropLabel("Upload To This Folder");
            setIsDropActive(true);
          } else if (e.dataTransfer.types.includes("application/x-media-item-id")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDropLabel("Move Item Here");
            setIsDropActive(true);
          } else if (e.dataTransfer.types.includes("application/x-folder-path")) {
            if (entry.isVirtual) {
              return;
            }

            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDropLabel("Move Folder Here");
            setIsDropActive(true);
          }
        }}
        onDragEnter={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            dragDepthRef.current += 1;
            setDropLabel("Upload To This Folder");
            setIsDropActive(true);
          } else if (e.dataTransfer.types.includes("application/x-media-item-id")) {
            dragDepthRef.current += 1;
            setDropLabel("Move Item Here");
            setIsDropActive(true);
          } else if (e.dataTransfer.types.includes("application/x-folder-path")) {
            if (entry.isVirtual) {
              return;
            }

            dragDepthRef.current += 1;
            setDropLabel("Move Folder Here");
            setIsDropActive(true);
          }
        }}
        onDragLeave={() => {
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) {
            setIsDropActive(false);
            setDropLabel("Move Here");
          }
        }}
        onDrop={handleDrop}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e);
        }}
        onClick={() => {
          playClickSound();
          triggerClickAnimation();
          openFolder();
        }}
        className={`relative flex h-36 w-44 items-center justify-center overflow-hidden rounded-xl border text-left transition-all ${
          isDropActive
            ? "border-cyan-300/80 bg-cyan-400/15 shadow-[0_0_0_2px_rgba(103,232,249,0.45),0_0_26px_rgba(34,211,238,0.28)]"
            : "border-transparent hover:border-amber-300/30 hover:bg-amber-200/5"
        }`}
        aria-label={`Open folder: ${entry.name}`}
      >
        <Folder
          className={`h-24 w-24 drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)] ${
            isDropActive ? "text-cyan-300" : "text-amber-400"
          }`}
        />

        <div
          className={`pointer-events-none absolute inset-0 flex items-end justify-center transition-opacity ${
            isDropActive ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="mb-3 rounded-md border border-cyan-200/80 bg-cyan-500/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-50">
            {dropLabel}
          </span>
        </div>
      </motion.button>

      <p className="w-44 truncate text-center text-xs font-medium text-gray-200">{entry.name}</p>
    </div>
  );
};
