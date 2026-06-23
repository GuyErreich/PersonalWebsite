/**
 * Parse ALLOWED_ORIGINS secret values into a normalized origin set.
 *
 * Supports comma-separated lists and JSON-like arrays copied from dashboards,
 * e.g. `https://a.pages.dev,https://b.pages.dev` or
 * `["https://a.pages.dev","https://b.pages.dev"]`.
 */
export function parseAllowedOrigins(raw: string): Set<string> {
  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return new Set();

  const urlCandidates = normalized.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return new Set(urlCandidates.map((origin) => origin.trim()).filter(Boolean));
  }

  const domainCandidates = normalized.match(
    /(?:\*\.)?(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{2,5})?/g,
  );
  if (domainCandidates && domainCandidates.length > 0) {
    return new Set(
      domainCandidates.map((domain) => {
        const host = domain.replace(/^\*\./, "");
        return host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
      }),
    );
  }

  return new Set(
    normalized
      .split(",")
      .map((origin) => origin.trim().replace(/^["'\[]+|["'\]]+$/g, ""))
      .filter(Boolean),
  );
}
