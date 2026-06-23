/*
 * R2 S3 client tuned for browser PUT uploads via presigned URLs.
 *
 * AWS SDK v3 adds default CRC32 checksums that end up in the presigned URL
 * (x-amz-checksum-crc32) but browsers cannot reproduce those headers, so PUTs
 * fail with CORS/403 even when bucket CORS is correct.
 */

import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3.1026.0";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3.1026.0";

const CHECKSUM_HEADER_PREFIX = "x-amz-checksum-";

export const createR2PresignClient = (
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
): S3Client => {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // Avoid automatic CRC32 checksum params in presigned URLs (browser-incompatible).
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });

  client.middlewareStack.add(
    (next) => async (args) => {
      const request = args.request as { headers?: Record<string, string> };
      const headers = request.headers;
      if (headers) {
        for (const key of Object.keys(headers)) {
          const lower = key.toLowerCase();
          if (lower.startsWith(CHECKSUM_HEADER_PREFIX) || lower === "x-amz-sdk-checksum-algorithm") {
            delete headers[key];
          }
        }
      }
      return next(args);
    },
    { step: "build", name: "stripChecksumHeadersForBrowserPresign" },
  );

  return client;
};

export const createBrowserPresignedPutUrl = async (input: {
  client: S3Client;
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds?: number;
}): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: input.bucket,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });

  return getSignedUrl(input.client, command, {
    expiresIn: input.expiresInSeconds ?? 900,
    signableHeaders: new Set(["content-type"]),
  });
};
