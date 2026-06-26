/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

// src/lib/storage/r2client.ts
// R2 credentials are NOT held here — they live in Supabase secrets and are
// used exclusively inside the `r2-presign` edge function. The browser only
// ever receives a short-lived presigned PUT URL, never the actual keys.

import { getEdgeFunctionAuthHeaders, resolveEdgeFunctionErrorMessage, supabase } from "../supabase";
import {
  R2_ALLOWED_FOLDERS,
  R2_UPLOAD_FOLDERS,
  R2_UPLOAD_POLICIES,
  type R2UploadFolder,
} from "./r2UploadPolicies";

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
  contentType: string;
}

const getAuthSessionToken = async (actionDescription = "perform this action"): Promise<string> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error(`You must be logged in to ${actionDescription}.`);
  }

  return session.access_token;
};

const requestPresignedUpload = async (
  file: File,
  folderPath: R2UploadFolder,
): Promise<PresignResponse> => {
  const fileExt = assertAllowedUpload(file, folderPath);
  const contentType = file.type.trim().toLowerCase();
  const accessToken = await getAuthSessionToken("upload files");

  let presignRes: Response;
  try {
    presignRes = await fetch(PRESIGN_FUNCTION_URL, {
      method: "POST",
      headers: getEdgeFunctionAuthHeaders(accessToken),
      body: JSON.stringify({
        contentType,
        contentLength: file.size,
        fileExt,
        folderPath,
      }),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown browser network error while calling presign endpoint.";
    throw new Error(
      `Cannot reach upload presign service. Check network/CORS and Supabase function availability (${PRESIGN_FUNCTION_URL}). ${message}`,
    );
  }

  if (!presignRes.ok) {
    let body: unknown = {};
    try {
      body = await presignRes.json();
    } catch {
      /* intentional — body may be empty on error responses */
    }

    const msg = resolveEdgeFunctionErrorMessage(
      presignRes.status,
      body,
      presignRes.statusText,
    );
    throw new Error(`Failed to get presigned URL: ${msg}`);
  }

  const presignBody = (await presignRes.json()) as PresignResponse;
  const signedUrlParsed = new URL(presignBody.signedUrl);
  const publicUrlParsed = new URL(presignBody.publicUrl);

  if (signedUrlParsed.protocol !== "https:" || publicUrlParsed.protocol !== "https:") {
    throw new Error("Presign function returned a non-HTTPS URL.");
  }

  return {
    signedUrl: signedUrlParsed.href,
    publicUrl: publicUrlParsed.href,
    contentType,
  };
};

const buildPresignedPutHeaders = (
  signedUrl: string,
  contentType: string,
): Record<string, string> => {
  const signedHeadersParam = new URL(signedUrl).searchParams.get("X-Amz-SignedHeaders");
  if (!signedHeadersParam) {
    return { "Content-Type": contentType };
  }

  const signed = new Set(
    signedHeadersParam
      .split(";")
      .map((header) => header.trim().toLowerCase())
      .filter(Boolean),
  );

  const headers: Record<string, string> = {};
  if (signed.has("content-type")) {
    headers["Content-Type"] = contentType;
  }

  return headers;
};

const uploadToPresignedUrl = async (
  file: File,
  signedUrl: string,
  contentType: string,
): Promise<void> => {
  let uploadRes: Response;
  const uploadHost = new URL(signedUrl).host;

  try {
    uploadRes = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: buildPresignedPutHeaders(signedUrl, contentType),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown browser network error while uploading to R2.";
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "your site origin";
    throw new Error(
      `Upload to R2 blocked (${uploadHost}). Presign succeeded; the browser PUT failed (${message}). Configure CORS on the R2 bucket matching R2_BUCKET_NAME: AllowedOrigins must include ${siteOrigin}; AllowedHeaders must include content-type (lowercase, not "*"). Run npm run infra:apply-r2-cors or Cloudflare Dashboard → R2 → bucket → Settings → CORS.`,
    );
  }

  if (!uploadRes.ok) {
    let errorText = "";

    try {
      errorText = await uploadRes.text();
    } catch {
      errorText = "";
    }

    const message = errorText.trim() || uploadRes.statusText;
    throw new Error(`Failed to upload to R2 (${uploadRes.status}): ${message}`);
  }
};

const getNormalizedExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return "";
  const rawExt = fileName.slice(dotIndex + 1);
  return rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
};

const assertAllowedUpload = (file: File, folderPath: R2UploadFolder): string => {
  if (!R2_ALLOWED_FOLDERS.has(folderPath)) {
    throw new Error(`Folder "${folderPath}" is not allowed.`);
  }

  const policy = R2_UPLOAD_POLICIES[folderPath];
  const mimeType = file.type.trim().toLowerCase();

  if (!Object.hasOwn(policy.mimeTypeExtensions, mimeType)) {
    throw new Error("File type is not allowed for this upload target.");
  }

  if (file.size <= 0 || file.size > policy.maxBytes) {
    throw new Error("File is empty or exceeds the allowed size limit.");
  }

  const safeExt = getNormalizedExtension(file.name);
  if (!safeExt || safeExt.length > 10) {
    throw new Error("Filename must include a valid extension.");
  }

  const allowedExts = policy.mimeTypeExtensions[mimeType] ?? [];
  if (!allowedExts.includes(safeExt)) {
    throw new Error("File extension is not allowed for this MIME type.");
  }

  return safeExt;
};

/**
 * Uploads a file to Cloudflare R2 via a server-side presigned URL.
 * Credentials never leave the Supabase edge function — only a short-lived
 * signed URL is returned to the browser.
 */
export const uploadToR2 = async (
  file: File,
  folderPath: R2UploadFolder = R2_UPLOAD_FOLDERS.media,
): Promise<string> => {
  const { signedUrl, publicUrl, contentType } = await requestPresignedUpload(file, folderPath);
  await uploadToPresignedUrl(file, signedUrl, contentType);

  return publicUrl;
};

export const deleteFromR2 = async (publicUrl: string): Promise<void> => {
  const parsedPublicUrl = new URL(publicUrl);
  if (parsedPublicUrl.protocol !== "https:") {
    throw new Error("R2 delete URL must be HTTPS.");
  }

  const accessToken = await getAuthSessionToken("perform this action");

  let deleteResponse: Response;
  try {
    deleteResponse = await fetch(PRESIGN_FUNCTION_URL, {
      method: "DELETE",
      headers: getEdgeFunctionAuthHeaders(accessToken),
      body: JSON.stringify({ publicUrl: parsedPublicUrl.href }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown browser network error.";
    throw new Error(`Failed to reach R2 cleanup endpoint. ${message}`);
  }

  if (!deleteResponse.ok) {
    let responseBody: unknown = {};
    try {
      responseBody = await deleteResponse.json();
    } catch {
      /* intentional — body may be empty on error responses */
    }

    const message = resolveEdgeFunctionErrorMessage(
      deleteResponse.status,
      responseBody,
      deleteResponse.statusText,
    );

    throw new Error(`Failed to delete R2 object: ${message}`);
  }
};
