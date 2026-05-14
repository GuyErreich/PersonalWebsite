/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

import { inferMediaTypeFromFile } from "../gamedev";
import { supabase } from "../supabase";
import { uploadToR2 } from "./r2client";
import type { R2UploadFolder } from "./r2UploadPolicies";

export interface MediaLibraryItem {
  id: string;
  name: string;
  media_url: string;
  media_type: "video" | "image";
  content_hash: string;
  folder_origin: string | null;
  file_size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export const stripFileExtension = (filename: string): string => {
  const stripped = filename.replace(/\.[^.]+$/, "").trim();
  return stripped.length > 0 ? stripped : "Untitled media";
};

const toHexString = (bytes: Uint8Array): string =>
  Array.from(bytes)
    .map((byteValue) => byteValue.toString(16).padStart(2, "0"))
    .join("");

const MAX_CLIENT_HASH_BYTES = 200 * 1024 * 1024;

export const hashFileSha256 = async (file: File): Promise<string> => {
  if (file.size > MAX_CLIENT_HASH_BYTES) {
    const maxMegabytes = Math.round(MAX_CLIENT_HASH_BYTES / (1024 * 1024));
    throw new Error(
      `File is too large for client-side hashing (${maxMegabytes}MB max). Please use a smaller file.`,
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", fileBuffer);
  return toHexString(new Uint8Array(digest));
};

export const findDuplicateByHash = async (file: File): Promise<MediaLibraryItem | null> => {
  const contentHash = await hashFileSha256(file);

  const { data, error } = await supabase
    .from("media_library")
    .select("*")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as MediaLibraryItem) : null;
};

interface UploadOrReuseMediaLibraryItemArgs {
  file: File;
  uploadFolder: R2UploadFolder;
  folderOrigin?: string | null;
  preferredName?: string;
}

export const uploadOrReuseMediaLibraryItem = async ({
  file,
  uploadFolder,
  folderOrigin,
  preferredName,
}: UploadOrReuseMediaLibraryItemArgs): Promise<{ item: MediaLibraryItem; reused: boolean }> => {
  const contentHash = await hashFileSha256(file);

  const { data: existingLibraryItem, error: existingItemError } = await supabase
    .from("media_library")
    .select("*")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (existingItemError) {
    throw new Error(existingItemError.message);
  }

  if (existingLibraryItem) {
    const existingItem = existingLibraryItem as MediaLibraryItem;
    return { item: existingItem, reused: true };
  }

  const uploadedUrl = await uploadToR2(file, uploadFolder);
  const parsedUpload = new URL(uploadedUrl);
  if (parsedUpload.protocol !== "https:") {
    throw new Error("Upload returned a non-HTTPS URL.");
  }

  const { data: insertedItem, error: insertError } = await supabase
    .from("media_library")
    .insert([
      {
        name: (preferredName ?? "").trim() || stripFileExtension(file.name),
        media_url: parsedUpload.href,
        media_type: inferMediaTypeFromFile(file),
        content_hash: contentHash,
        folder_origin:
          folderOrigin === undefined || folderOrigin === null ? uploadFolder : folderOrigin.trim(),
        file_size_bytes: file.size,
      },
    ])
    .select("*")
    .single();

  if (insertError || !insertedItem) {
    if (insertError?.code === "23505") {
      const { data: conflictExisting, error: conflictLookupError } = await supabase
        .from("media_library")
        .select("*")
        .eq("content_hash", contentHash)
        .maybeSingle();

      if (conflictLookupError) {
        throw new Error(conflictLookupError.message);
      }

      if (conflictExisting) {
        return { item: conflictExisting as MediaLibraryItem, reused: true };
      }
    }

    throw new Error(insertError?.message ?? "Unable to store media in library.");
  }

  return { item: insertedItem as MediaLibraryItem, reused: false };
};
