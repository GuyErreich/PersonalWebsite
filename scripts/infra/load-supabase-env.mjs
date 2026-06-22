/*
 * Resolve Supabase credentials from process env or project .env files.
 *
 * Browser app uses VITE_SUPABASE_* (Vite only exposes VITE_ to import.meta.env).
 * Node scripts prefer SUPABASE_* but fall back to VITE_SUPABASE_* from .env.local.
 *
 * Never use VITE_ prefix for SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENV_ALIASES = {
  SUPABASE_URL: ["SUPABASE_URL", "VITE_SUPABASE_URL"],
  SUPABASE_ANON_KEY: ["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"],
  SUPABASE_SERVICE_ROLE_KEY: ["SUPABASE_SERVICE_ROLE_KEY"],
};

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

const fileEnv = {
  ...parseEnvFile(resolve(process.cwd(), ".env")),
  ...parseEnvFile(resolve(process.cwd(), ".env.local")),
};

const readValue = (keys) => {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
    if (fileEnv[key]) return fileEnv[key];
  }
  return undefined;
};

export const loadSupabaseEnv = () => ({
  supabaseUrl: readValue(ENV_ALIASES.SUPABASE_URL),
  supabaseAnonKey: readValue(ENV_ALIASES.SUPABASE_ANON_KEY),
  supabaseServiceRoleKey: readValue(ENV_ALIASES.SUPABASE_SERVICE_ROLE_KEY),
});

export const requireSupabaseEnv = ({ requireServiceRole = false } = {}) => {
  const env = loadSupabaseEnv();
  const required = {
    SUPABASE_URL: env.supabaseUrl,
    SUPABASE_ANON_KEY: env.supabaseAnonKey,
    ...(requireServiceRole ? { SUPABASE_SERVICE_ROLE_KEY: env.supabaseServiceRoleKey } : {}),
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(`Missing required Supabase env vars: ${missing.join(", ")}`);
    console.error(
      "Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local (browser + scripts), or SUPABASE_* for Node-only.",
    );
    process.exit(1);
  }

  return env;
};
