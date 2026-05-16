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
  const normalizedName = (preferredName ?? "").trim() || stripFileExtension(file.name);
  const normalizedFolderOrigin =
    folderOrigin === undefined || folderOrigin === null ? uploadFolder : folderOrigin.trim();
  const inferredMediaType = inferMediaTypeFromFile(file);

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

  const { data: reservedItem, error: reserveError } = await supabase
    .from("media_library")
    .insert([
      {
        name: normalizedName,
        media_url: `https://pending-upload.local/${crypto.randomUUID()}`,
        media_type: inferredMediaType,
        content_hash: contentHash,
        folder_origin: normalizedFolderOrigin,
        file_size_bytes: file.size,
      },
    ])
    .select("*")
    .single();

  if (reserveError || !reservedItem) {
    if (reserveError?.code === "23505") {
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

    throw new Error(reserveError?.message ?? "Unable to reserve media library record.");
  }

  let parsedUpload: URL;

  try {
    const uploadedUrl = await uploadToR2(file, uploadFolder);
    parsedUpload = new URL(uploadedUrl);
  } catch (uploadError) {
    const { error: cleanupError } = await supabase
      .from("media_library")
      .delete()
      .eq("id", reservedItem.id)
      .eq("content_hash", contentHash);

    if (cleanupError) {
      const uploadMessage = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      throw new Error(`${uploadMessage} Cleanup failed: ${cleanupError.message}`);
    }

    throw uploadError;
  }

  if (parsedUpload.protocol !== "https:") {
    const { error: cleanupError } = await supabase
      .from("media_library")
      .delete()
      .eq("id", reservedItem.id);
    if (cleanupError) {
      throw new Error(`Upload returned a non-HTTPS URL. Cleanup failed: ${cleanupError.message}`);
    }

    throw new Error("Upload returned a non-HTTPS URL.");
  }

  const { data: insertedItem, error: insertError } = await supabase
    .from("media_library")
    .update({ media_url: parsedUpload.href })
    .eq("id", reservedItem.id)
    .select("*")
    .single();

  if (insertError || !insertedItem) {
    const { error: cleanupError } = await supabase
      .from("media_library")
      .delete()
      .eq("id", reservedItem.id);
    if (cleanupError) {
      throw new Error(
        `${insertError?.message ?? "Unable to store media in library."} Cleanup failed: ${cleanupError.message}`,
      );
    }

    throw new Error(insertError?.message ?? "Unable to store media in library.");
  }

  return { item: insertedItem as MediaLibraryItem, reused: false };
};
