/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { Upload } from "lucide-react";
import {
  getMimeTypesForFolder,
  R2_UPLOAD_FOLDERS,
  type R2UploadFolder,
} from "../../../lib/storage/r2UploadPolicies";

const UPLOAD_FOLDER_OPTIONS: Array<{ value: R2UploadFolder; label: string }> = [
  { value: R2_UPLOAD_FOLDERS.media, label: "General Media" },
  { value: R2_UPLOAD_FOLDERS.gameDevAssets, label: "GameDev Assets" },
  { value: R2_UPLOAD_FOLDERS.heroShowreel, label: "Hero Showreel" },
  { value: R2_UPLOAD_FOLDERS.gameDevThumbnails, label: "GameDev Thumbnails" },
];

interface Props {
  uploadFolder: R2UploadFolder;
  setUploadFolder: (folder: R2UploadFolder) => void;
  libraryFolderLabel: string;
  setLibraryFolderLabel: (label: string) => void;
  onUpload: (files: FileList | null) => void;
}

export const MediaUploadPanel = ({
  uploadFolder,
  setUploadFolder,
  libraryFolderLabel,
  setLibraryFolderLabel,
  onUpload,
}: Props) => (
  <div className="mb-6 rounded-lg border border-gray-700 bg-gray-900/30 p-4">
    <h3 className="mb-3 text-sm font-medium text-gray-200">Upload To Library</h3>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="text-xs text-gray-400">
        R2 Upload Target
        <select
          value={uploadFolder}
          onChange={(e) => setUploadFolder(e.target.value as R2UploadFolder)}
          className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          {UPLOAD_FOLDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-gray-400">
        Library Folder Label
        <input
          value={libraryFolderLabel}
          onChange={(e) => setLibraryFolderLabel(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"
          placeholder="e.g. showreel, devops, ui"
        />
      </label>

      <label className="text-xs text-gray-400">
        Files
        <input
          type="file"
          multiple
          accept={getMimeTypesForFolder(uploadFolder).join(",")}
          onChange={(e) => {
            onUpload(e.currentTarget.files);
            e.currentTarget.value = "";
          }}
          className="mt-1 block w-full text-xs text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-cyan-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-cyan-600"
        />
      </label>
    </div>

    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
      <Upload className="h-3.5 w-3.5" />
      Dedup is by content hash. Same file bytes will be reused instead of re-uploaded.
    </div>
  </div>
);
