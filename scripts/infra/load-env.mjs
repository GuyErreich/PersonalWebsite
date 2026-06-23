/*
 * Shared .env file parsing for Node infra/security scripts.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export const parseEnvFile = (filePath) => {
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

export const mergeEnvFiles = () => {
  const root = process.cwd();
  return {
    ...parseEnvFile(resolve(root, ".env")),
    ...parseEnvFile(resolve(root, ".env.local")),
  };
};

/**
 * @param {Record<string, string>} fileEnv
 * @param {{ onKeyRead?: (key: string) => void }} [options]
 */
export const createEnvReader = (fileEnv, { onKeyRead } = {}) => {
  return (keys) => {
    for (const key of keys) {
      if (process.env[key]) {
        onKeyRead?.(key);
        return process.env[key];
      }
      if (fileEnv[key]) {
        onKeyRead?.(key);
        return fileEnv[key];
      }
    }
    return undefined;
  };
};
