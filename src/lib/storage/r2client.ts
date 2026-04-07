// src/lib/storage/r2client.ts
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Usually, in a production setup, generating the presigned URL should happen on a backend server
// so you don't expose your Cloudflare keys to the browser.
// However, since this is a private admin dashboard meant only for you,
// and it's behind a Supabase Auth login, setting it up client-side is acceptable for a personal site as long as the env variables are kept secure.

const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || "";
const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID || "";
const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY || "";
export const r2Bucket = import.meta.env.VITE_R2_BUCKET_NAME || "portfolio-media";
export const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL || "";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Uploads a file directly to Cloudflare R2 from the browser using a presigned URL.
 */
export const uploadToR2 = async (file: File, folderPath: string = "media"): Promise<string> => {
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing.");
  }

  // Generate a unique filename
  const rawExt = file.name.split(".").pop();
  const fileExt = rawExt && rawExt.length > 0 ? `.${rawExt}` : "";
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}${fileExt}`;
  const key = `${folderPath}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: key,
    ContentType: file.type,
  });

  // Generate a presigned URL valid for 1 hour to directly upload from the browser
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

  // Execute the actual upload to the presigned URL
  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload to R2: ${uploadResponse.statusText}`);
  }

  // Return the public URL to access the file
  // Requires you to have a Custom Domain or public R2.dev URL mapped to this bucket
  return `${r2PublicUrl}/${key}`;
};
