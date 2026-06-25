/**
 * Shared ALLOWED_ORIGINS parsing for Node smoke scripts.
 *
 * Format rule (intentional security guardrail): full URLs and domain-only
 * shorthand are mutually exclusive in a single secret value. If any `http://` or
 * `https://` URL is present, only URL tokens are parsed — domain-only tokens
 * (e.g. `localhost:5173`) are dropped so prod secrets cannot accidentally pick
 * up localhost shorthand. For local dev, use a branch-only secret with full
 * origins (`http://localhost:5173`, …); see README → ALLOWED_ORIGINS.
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

export const parseAllowedOrigins = (raw) => {
  if (typeof raw !== "string") return [];

  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return [];

  const urlCandidates = normalized.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return [...new Set(urlCandidates.map((origin) => normalizeOrigin(origin)).filter(Boolean))];
  }

  const domainCandidates = normalized.match(
    /(?:\*\.)?(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{2,5})?/g,
  );
  if (domainCandidates && domainCandidates.length > 0) {
    return [
      ...new Set(
        domainCandidates.map((domain) => {
          const host = domain.replace(/^\*\./, "");
          const origin = host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
          return normalizeOrigin(origin);
        }),
      ),
    ];
  }

  return [
    ...new Set(
      normalized
        .split(",")
        .map((origin) => normalizeOrigin(origin.trim().replace(/^["'[]+|["'\]]+$/g, "")))
        .filter(Boolean),
    ),
  ];
};

export const resolveAllowedOrigin = (singleOrigin, originList) => {
  if (typeof singleOrigin === "string" && singleOrigin.trim().length > 0) {
    return normalizeOrigin(singleOrigin);
  }

  const parsed = parseAllowedOrigins(originList ?? "");
  return parsed[0];
};
