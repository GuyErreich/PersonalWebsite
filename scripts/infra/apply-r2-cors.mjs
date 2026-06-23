/*
 * Apply CORS rules to a Cloudflare R2 bucket (required for browser PUT uploads).
 *
 * Required credentials in .env.local (see .env.example):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Origins (one of):
 *   R2_CORS_ORIGINS — comma-separated list (same format as ALLOWED_ORIGINS)
 *   R2_CORS_FILE    — path to JSON file (default: scripts/infra/r2-cors.json)
 *
 * Usage:
 *   cp scripts/infra/r2-cors.example.json scripts/infra/r2-cors.json
 *   # edit r2-cors.json with your site origin(s)
 *   R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET_NAME=... \
 *     npm run infra:apply-r2-cors
 *
 * Or with env origins only:
 *   R2_CORS_ORIGINS="https://your-site.pages.dev" npm run infra:apply-r2-cors
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PutBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { requireR2Env } from "./load-r2-env.mjs";

const { accountId, accessKeyId, secretAccessKey, bucket } = requireR2Env();
const corsOriginsEnv = process.env.R2_CORS_ORIGINS;
const corsFile = process.env.R2_CORS_FILE ?? "scripts/infra/r2-cors.json";

const loadCorsRules = () => {
  if (typeof corsOriginsEnv === "string" && corsOriginsEnv.trim().length > 0) {
    const origins = corsOriginsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    if (origins.length === 0) {
      throw new Error("R2_CORS_ORIGINS is empty after parsing.");
    }

    return [
      {
        AllowedOrigins: origins,
        AllowedMethods: ["PUT", "GET", "HEAD"],
        // R2 matches preflight literally — use lowercase header names (not "*").
        AllowedHeaders: ["content-type", "content-length"],
        ExposeHeaders: ["ETag"],
        MaxAgeSeconds: 3600,
      },
    ];
  }

  const filePath = resolve(process.cwd(), corsFile);
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`${corsFile} must be a non-empty JSON array of CORS rules.`);
  }

  return parsed;
};

const corsRules = loadCorsRules();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

console.warn(`Applying R2 bucket CORS to "${bucket}"...`);
console.warn(JSON.stringify(corsRules, null, 2));

try {
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: { CORSRules: corsRules },
    }),
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("AccessDenied") || message.includes("Access Denied")) {
    console.error(
      `R2 API token cannot update bucket CORS (AccessDenied). Use Cloudflare Dashboard instead:`,
    );
    console.error(`  R2 → bucket "${bucket}" → Settings → CORS policy`);
    console.error("Paste this JSON (top-level array):");
    console.error(JSON.stringify(corsRules, null, 2));
    process.exit(1);
  }
  throw error;
}

console.warn("R2 bucket CORS applied successfully.");
