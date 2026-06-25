/**
 * Parse ALLOWED_ORIGINS secret values into a normalized origin set.
 *
 * Supports comma-separated lists and JSON-like arrays copied from dashboards,
 * e.g. `https://a.pages.dev,https://b.pages.dev` or
 * `["https://a.pages.dev","https://b.pages.dev"]`.
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

export function parseAllowedOrigins(raw: string): Set<string> {
  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return new Set();

  const urlCandidates = normalized.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return new Set(
      urlCandidates.map((origin) => normalizeOrigin(origin)).filter(Boolean),
    );
  }

  const domainCandidates = normalized.match(
    /(?:\*\.)?(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{2,5})?/g,
  );
  if (domainCandidates && domainCandidates.length > 0) {
    return new Set(
      domainCandidates.map((domain) => {
        const host = domain.replace(/^\*\./, "");
        const origin = host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
        return normalizeOrigin(origin);
      }),
    );
  }

  return new Set(
    normalized
      .split(",")
      .map((origin) => normalizeOrigin(origin.trim().replace(/^["'[]+|["'\]]+$/g, "")))
      .filter(Boolean),
  );
}
