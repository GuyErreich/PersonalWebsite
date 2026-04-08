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

import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
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

    // --- Parse request ---
    const body: unknown = await req.json();
    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as Record<string, unknown>).contentType !== "string"
    ) {
      return json({ error: "contentType (string) is required in request body" }, 400);
    }

    const { contentType, fileExt, folderPath } = body as {
      contentType: string;
      fileExt?: string;
      folderPath?: string;
    };

    // Whitelist allowed folder prefixes to prevent path traversal
    const ALLOWED_FOLDERS = ["media", "showreel", "thumbnails"];
    const rawFolder = folderPath ?? "media";
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "media";

    // Normalise fileExt: strip leading dots, allow only alphanumeric chars
    const rawExt = fileExt ?? "";
    const safeExt = rawExt.replace(/^\.+/, "").replace(/[^a-zA-Z0-9]/g, "");
    const ext = safeExt.length > 0 ? `.${safeExt}` : "";
    const key = `${folder}/${crypto.randomUUID()}${ext}`;

    // --- Build presigned URL using server-side R2 credentials ---
    const accountId = Deno.env.get("R2_ACCOUNT_ID") ?? "";
    const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID") ?? "";
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY") ?? "";
    const bucket = Deno.env.get("R2_BUCKET_NAME") ?? "portfolio-media";
    const publicUrl = Deno.env.get("R2_PUBLIC_URL") ?? "";

    if (!accountId || !accessKeyId || !secretAccessKey) {
      return json({ error: "R2 credentials not configured on server" }, 500);
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    // Presigned URL valid for 15 minutes — enough for a video upload
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    return json({ signedUrl, publicUrl: `${publicUrl}/${key}` });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
