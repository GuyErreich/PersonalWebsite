/**
 * Parse ALLOWED_ORIGINS secret values into a normalized origin set.
 *
 * Supports comma-separated lists and JSON-like arrays copied from dashboards,
 * e.g. `https://a.pages.dev,https://b.pages.dev` or
 * `["https://a.pages.dev","https://b.pages.dev"]`.
 *
 * Security rules (always applied):
 * - Localhost / loopback origins are never accepted (`localhost`, `127.0.0.1`, `0.0.0.0`,
 *   `[::1]`). Every user runs a local server, so they are not a meaningful
 *   origin boundary for edge-function CORS.
 * - Full URLs and domain-only shorthand are mutually exclusive in one secret:
 *   if any `http://` or `https://` URL is present, only URL tokens are parsed;
 *   domain-only tokens in the same value are dropped.
 *
 * Local dev: test against a deployed preview origin (e.g. Pages dev URL), not
 * localhost. See README → ALLOWED_ORIGINS.
 *
 * Keep behavior aligned with scripts/infra/parse-allowed-origins.mjs and
 * scripts/infra/allowed-origins-fixtures.json (run npm run infra:check-allowed-origins).
 */
const normalizeOrigin = (origin: string): string => {
  const trimmed = origin.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }
  return trimmed;
};

const isLocalhostOrigin = (origin: string): boolean => {
  try {
    const { hostname } = new URL(origin);
    const host = hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    const trimmed = origin.trim().toLowerCase();
    return (
      /^localhost(?::\d+)?$/.test(trimmed) ||
      /^127\.0\.0\.1(?::\d+)?$/.test(trimmed) ||
      /^0\.0\.0\.0(?::\d+)?$/.test(trimmed)
    );
  }
};

const withoutLocalhostOrigins = (origins: Iterable<string>): Set<string> =>
  new Set([...origins].filter((origin) => origin.length > 0 && !isLocalhostOrigin(origin)));

export function parseAllowedOrigins(raw: string): Set<string> {
  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return new Set();

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
}
