/*
 * Print the current CORS policy on an R2 bucket (for debugging upload failures).
 *
 * Reads credentials from .env.local / .env (R2_* names — see .env.example).
 */

import { GetBucketCorsCommand, S3Client } from "@aws-sdk/client-s3";
import { requireR2Env } from "./load-r2-env.mjs";

const { accountId, accessKeyId, secretAccessKey, bucket } = requireR2Env();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

try {
  const result = await s3.send(new GetBucketCorsCommand({ Bucket: bucket }));
  console.warn(`CORS policy for bucket "${bucket}":`);
  console.warn(JSON.stringify(result.CORSRules ?? [], null, 2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("NoSuchCORSConfiguration") || message.includes("not found")) {
    console.error(
      `No CORS policy on bucket "${bucket}". Browser uploads will fail until CORS is applied.`,
    );
    process.exit(1);
  }
  console.error(message);
  process.exit(1);
}
