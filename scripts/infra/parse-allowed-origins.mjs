/**
 * Shared ALLOWED_ORIGINS parsing for Node smoke scripts.
 *
 * Security rules (always applied):
 * - Localhost / loopback origins are never accepted (`localhost`, `127.0.0.1`,
 *   `[::1]`). Every user runs a local server, so they are not a meaningful
 *   origin boundary for edge-function CORS.
 * - Full URLs and domain-only shorthand are mutually exclusive in one secret:
 *   if any `http://` or `https://` URL is present, only URL tokens are parsed;
 *   domain-only tokens in the same value are dropped.
 *
 * Local dev: test against a deployed preview origin (e.g. Pages dev URL), not
 * localhost. See README → ALLOWED_ORIGINS.
 *
 * Keep behavior aligned with supabase/functions/_shared/allowedOrigins.ts and
 * scripts/infra/allowed-origins-fixtures.json (run npm run infra:check-allowed-origins).
 */

const normalizeOrigin = (origin) => {
  const trimmed = origin.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  return trimmed;
};

const isLocalhostOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    const host = hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
  } catch {
    const trimmed = origin.trim().toLowerCase();
    return /^localhost(?::\d+)?$/.test(trimmed) || /^127\.0\.0\.1(?::\d+)?$/.test(trimmed);
  }
};

const withoutLocalhostOrigins = (origins) =>
  [...new Set(origins.filter((origin) => origin.length > 0 && !isLocalhostOrigin(origin)))];

export const parseAllowedOrigins = (raw) => {
  if (typeof raw !== "string") return [];

  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return [];

  const urlCandidates = normalized.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return withoutLocalhostOrigins(
      urlCandidates.map((origin) => normalizeOrigin(origin)).filter(Boolean),
    );
  }

  const domainCandidates = normalized.match(
    /(?:\*\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?::\d{2,5})?/g,
  );
  if (domainCandidates && domainCandidates.length > 0) {
    return withoutLocalhostOrigins(
      domainCandidates.map((domain) => {
        const host = domain.replace(/^\*\./, "");
        return normalizeOrigin(`https://${host}`);
      }),
    );
  }

  return withoutLocalhostOrigins(
    normalized
      .split(",")
      .map((origin) => normalizeOrigin(origin.trim().replace(/^["'[]+|["'\]]+$/g, "")))
      .filter(Boolean),
  );
};

export const resolveAllowedOrigin = (singleOrigin, originList) => {
  if (typeof singleOrigin === "string" && singleOrigin.trim().length > 0) {
    const normalized = normalizeOrigin(singleOrigin);
    return isLocalhostOrigin(normalized) ? undefined : normalized;
  }

  const parsed = parseAllowedOrigins(originList ?? "");
  return parsed[0];
};
