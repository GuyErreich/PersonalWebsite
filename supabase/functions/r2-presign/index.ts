/*
 * Copyright (c) 2026 Guy Erreich
 *
 * SPDX-License-Identifier: MIT
 */

// Supabase Edge Function — r2-presign
// Generates a short-lived presigned PUT URL for Cloudflare R2.
// R2 credentials live in Supabase secrets (never shipped to the browser).
//
// Required Supabase secrets (set via `supabase secrets set`):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET_NAME, R2_PUBLIC_URL
//   ALLOWED_ORIGINS  — comma-separated list of allowed frontend origins
//                      e.g. "https://abc.pages.dev,https://yourdomain.com"

import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.1026.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.1026.0";
import { createClient } from "npm:@supabase/supabase-js@2.102.1";

// Allowed origins for CORS — configured per environment via the ALLOWED_ORIGINS secret.
// Set it to a comma-separated list, e.g.:
//   supabase secrets set ALLOWED_ORIGINS="https://abc.pages.dev,https://yourdomain.com"
const rawOrigins = Deno.env.get("ALLOWED_ORIGINS") ?? "";
if (!rawOrigins) {
  throw new Error("ALLOWED_ORIGINS secret is not set");
}
const ALLOWED_ORIGINS = new Set(
  rawOrigins
    .split(",")
    .map((o: string) => o.trim())
    .filter(Boolean),
);

// UPLOAD POLICY DUPLICATION NOTICE:
// This object mirrors the shared client contract in `src/lib/storage/r2UploadPolicies.ts`:
// - mimeTypeExtensions (MIME type → allowed file extensions mapping)
// - maxBytes
//
// Edge Functions cannot import client TypeScript modules, so FOLDER_POLICIES must stay in sync
// with the client-side upload policies.
//
// **Critical:** Keep mimeTypeExtensions in sync with the client-side R2_UPLOAD_POLICIES constant.
// If they diverge, uploads will fail in confusing ways:
//   - Client accepts a file → server rejects with 400 "not allowed"
//   - Or vice-versa → security issue
//
// Maintenance:
// 1. Update BOTH files when adding a new folder, MIME type, or extension
// 2. Add test coverage in scripts/security/r2-presign-smoke.mjs that validates
//    server policy acceptance against known client uploads
// 3. Keep this comment updated with the client path
const FOLDER_POLICIES: Record<
  string,
  {
    mimeTypeExtensions: Record<string, readonly string[]>;
    maxBytes: number;
  }
> = {
  media: {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 100 * 1024 * 1024,
  },
  "hero-showreel": {
    mimeTypeExtensions: {
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 200 * 1024 * 1024,
  },
  "gamedev-assets": {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
      "video/mp4": ["mp4"],
      "video/webm": ["webm"],
      "video/ogg": ["ogg"],
      "video/quicktime": ["mov"],
    },
    maxBytes: 100 * 1024 * 1024,
  },
  "gamedev-thumbnails": {
    mimeTypeExtensions: {
      "image/jpeg": ["jpg", "jpeg"],
      "image/png": ["png"],
      "image/webp": ["webp"],
      "image/gif": ["gif"],
      "image/avif": ["avif"],
    },
    maxBytes: 5 * 1024 * 1024,
  },
};

function corsHeaders(origin: string): Record<string, string> | null {
  if (!ALLOWED_ORIGINS.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") ?? "";
  const CORS = corsHeaders(origin);

  // Reject requests from origins not in the allowlist.
  // Return 403 with no ACAO header — the browser will block the response.
  if (!CORS) {
    return new Response(null, { status: 403 });
  }

  // json() is defined here so it closes over CORS and always includes the
  // correct per-request Access-Control-Allow-Origin header.
  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // --- Auth: verify the caller has a valid Supabase session ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Invalid Authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return json({ error: "Supabase configuration missing on server" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const roleValue = user.app_metadata?.role ?? user.app_metadata?.roles;
    const isAdminRole = (r: unknown) => typeof r === "string" && /^admin$/.test(r);
    const isAdmin = Array.isArray(roleValue) ? roleValue.some(isAdminRole) : isAdminRole(roleValue);
    if (!isAdmin) {
      return json({ error: "Forbidden" }, 403);
    }

    // --- Parse request ---
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const bodyRecord = body as Record<string, unknown>;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof bodyRecord.contentType !== "string" ||
      typeof bodyRecord.contentLength !== "number" ||
      (bodyRecord.fileExt !== undefined && typeof bodyRecord.fileExt !== "string") ||
      (bodyRecord.folderPath !== undefined && typeof bodyRecord.folderPath !== "string")
    ) {
      return json(
        {
          error:
            "contentType must be a string; contentLength must be a number; fileExt/folderPath must be strings when provided",
        },
        400,
      );
    }

    const { contentType, contentLength, fileExt, folderPath } = bodyRecord as {
      contentType: string;
      contentLength: number;
      fileExt?: string;
      folderPath?: string;
    };

    // Whitelist allowed folder prefixes to prevent path traversal.
    // Use FOLDER_POLICIES as the canonical source to avoid drift.
    const ALLOWED_FOLDERS = Object.keys(FOLDER_POLICIES);
    const rawFolder = folderPath ?? "media";
    if (!ALLOWED_FOLDERS.includes(rawFolder)) {
      return json({ error: `Folder "${rawFolder}" is not allowed` }, 400);
    }
    const folder = rawFolder as keyof typeof FOLDER_POLICIES;

    // Normalise fileExt: strip leading dots, allow only alphanumeric chars
    const rawExt = fileExt ?? "";
    const safeExt = rawExt.replace(/^\.+/, "").replace(/[^a-zA-Z0-9]/g, "");
    if (safeExt.length > 10) {
      return json({ error: "Invalid file extension" }, 400);
    }
    const extNoDot = safeExt.toLowerCase();
    const normalizedContentType = contentType.trim().toLowerCase();
    const policy = FOLDER_POLICIES[folder];

    if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > policy.maxBytes) {
      return json({ error: "File is empty or exceeds allowed size for this upload target" }, 400);
    }

    // Validate MIME type and ensure extension is allowed for that specific MIME type
    if (!Object.hasOwn(policy.mimeTypeExtensions, normalizedContentType)) {
      return json({ error: "File type not allowed" }, 400);
    }
    const allowedExtsForMime = policy.mimeTypeExtensions[normalizedContentType] ?? [];
    if (!extNoDot || !allowedExtsForMime.includes(extNoDot)) {
      return json({ error: "File extension is not allowed for this MIME type" }, 400);
    }

    const ext = extNoDot.length > 0 ? `.${extNoDot}` : "";
    const key = `${folder}/${crypto.randomUUID()}${ext}`;

    // --- Build presigned URL using server-side R2 credentials ---
    const accountId = Deno.env.get("R2_ACCOUNT_ID") ?? "";
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
    const bucket = Deno.env.get("R2_BUCKET_NAME") ?? "portfolio-media";
    const publicUrl = Deno.env.get("R2_PUBLIC_URL");

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return json({ error: "R2 credentials not configured on server" }, 500);
    }
    if (!publicUrl) {
      return json({ error: "R2_PUBLIC_URL is not configured on server" }, 500);
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: normalizedContentType,
      ContentLength: contentLength,
    });

    // Presigned URL valid for 15 minutes — enough for a video upload
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    return json({ signedUrl, publicUrl: `${publicUrl}/${key}` });
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return json({ error: "Internal server error" }, 500);
  }
});
