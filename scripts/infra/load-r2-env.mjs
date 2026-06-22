/*
 * Resolve R2 credentials from process env or project .env files.
 *
 * Canonical names (match Supabase r2-presign secrets):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * Legacy VITE_R2_* / VITE_CLOUDFLARE_ACCOUNT_ID names are still read with a warning.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_ALIASES = {
  R2_ACCOUNT_ID: ["R2_ACCOUNT_ID", "VITE_CLOUDFLARE_ACCOUNT_ID"],
  R2_ACCESS_KEY_ID: ["R2_ACCESS_KEY_ID", "VITE_R2_ACCESS_KEY_ID"],
  R2_SECRET_ACCESS_KEY: ["R2_SECRET_ACCESS_KEY", "VITE_R2_SECRET_ACCESS_KEY"],
  R2_BUCKET_NAME: ["R2_BUCKET_NAME", "VITE_R2_BUCKET_NAME"],
};

const LEGACY_KEYS = new Set([
  "VITE_CLOUDFLARE_ACCOUNT_ID",
  "VITE_R2_ACCESS_KEY_ID",
  "VITE_R2_SECRET_ACCESS_KEY",
  "VITE_R2_BUCKET_NAME",
  "VITE_R2_PUBLIC_URL",
]);

const parseEnvFile = (filePath) => {
  try {
    const raw = readFileSync(filePath, "utf8");
    const values = {};

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    }

    return values;
  } catch {
    return {};
  }
};

const mergeEnvFiles = () => {
  const root = process.cwd();
  return {
    ...parseEnvFile(resolve(root, ".env")),
    ...parseEnvFile(resolve(root, ".env.local")),
  };
};

const fileEnv = mergeEnvFiles();

let legacyWarningShown = false;

const warnLegacyEnvNames = (key) => {
  if (legacyWarningShown || !LEGACY_KEYS.has(key)) return;
  legacyWarningShown = true;
  console.warn(
    "Using legacy VITE_R2_* / VITE_CLOUDFLARE_* env names. Rename to R2_* (see .env.example). VITE_ secrets must not be used for R2 credentials.",
  );
};

const readValue = (keys) => {
  for (const key of keys) {
    if (process.env[key]) {
      warnLegacyEnvNames(key);
      return process.env[key];
    }
    if (fileEnv[key]) {
      warnLegacyEnvNames(key);
      return fileEnv[key];
    }
  }
  return undefined;
};

export const loadR2Env = () => ({
  accountId: readValue(ENV_ALIASES.R2_ACCOUNT_ID),
  accessKeyId: readValue(ENV_ALIASES.R2_ACCESS_KEY_ID),
  secretAccessKey: readValue(ENV_ALIASES.R2_SECRET_ACCESS_KEY),
  bucket: readValue(ENV_ALIASES.R2_BUCKET_NAME),
});

export const requireR2Env = () => {
  const env = loadR2Env();
  const missing = Object.entries({
    R2_ACCOUNT_ID: env.accountId,
    R2_ACCESS_KEY_ID: env.accessKeyId,
    R2_SECRET_ACCESS_KEY: env.secretAccessKey,
    R2_BUCKET_NAME: env.bucket,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(`Missing required R2 env vars: ${missing.join(", ")}`);
    console.error("Add them to .env.local — see .env.example (R2_* section, not VITE_*).");
    process.exit(1);
  }

  return env;
};
