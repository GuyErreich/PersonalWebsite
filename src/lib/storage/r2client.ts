/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

// src/lib/storage/r2client.ts
// R2 credentials are NOT held here — they live in Supabase secrets and are
// used exclusively inside the `r2-presign` edge function. The browser only
// ever receives a short-lived presigned PUT URL, never the actual keys.

import { supabase } from "../supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL is not set. Check your .env configuration.");
}
const PRESIGN_FUNCTION_URL = new URL(
  "/functions/v1/r2-presign",
  supabaseUrl.replace(/\/$/, ""),
).toString();

interface PresignResponse {
  signedUrl: string;
  publicUrl: string;
}

/**
 * Uploads a file to Cloudflare R2 via a server-side presigned URL.
 * Credentials never leave the Supabase edge function — only a short-lived
 * signed URL is returned to the browser.
 */
export const uploadToR2 = async (file: File, folderPath: string = "media"): Promise<string> => {
  // Get the caller's current session token to authenticate with the edge function
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error("You must be logged in to upload files.");
  }

  const rawExt = file.name.split(".").pop();
  const fileExt = rawExt && rawExt.length > 0 ? rawExt : "";

  // Ask the edge function to generate a presigned URL (credentials stay server-side)
  const presignRes = await fetch(PRESIGN_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ contentType: file.type, fileExt, folderPath }),
  });

  if (!presignRes.ok) {
    const body: unknown = await presignRes.json().catch(() => ({}));
    const msg =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as Record<string, unknown>).error)
        : presignRes.statusText;
    throw new Error(`Failed to get presigned URL: ${msg}`);
  }

  const { signedUrl, publicUrl } = (await presignRes.json()) as PresignResponse;

  // Upload the file directly to R2 using the short-lived presigned URL
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) {
    throw new Error(`Failed to upload to R2: ${uploadRes.statusText}`);
  }

  return publicUrl;
};
