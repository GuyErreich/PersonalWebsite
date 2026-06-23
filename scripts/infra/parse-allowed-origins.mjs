/**
 * Shared ALLOWED_ORIGINS parsing for Node smoke scripts.
 * Keep behavior aligned with supabase/functions/_shared/allowedOrigins.ts.
 */

export const parseAllowedOrigins = (raw) => {
  if (typeof raw !== "string") return [];

  const normalized = raw.trim().replace(/\\\//g, "/");
  if (!normalized) return [];

  const urlCandidates = normalized.match(/https?:\/\/[^",\s\]]+/g);
  if (urlCandidates && urlCandidates.length > 0) {
    return [...new Set(urlCandidates.map((origin) => origin.trim()).filter(Boolean))];
  }

  const domainCandidates = normalized.match(
    /(?:\*\.)?(?:localhost|[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)(?::\d{2,5})?/g,
  );
  if (domainCandidates && domainCandidates.length > 0) {
    return [
      ...new Set(
        domainCandidates.map((domain) => {
          const host = domain.replace(/^\*\./, "");
          return host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
        }),
      ),
    ];
  }

  return [
    ...new Set(
      normalized
        .split(",")
        .map((origin) => origin.trim().replace(/^["'\[]+|["'\]]+$/g, ""))
        .filter(Boolean),
    ),
  ];
};

export const resolveAllowedOrigin = (singleOrigin, originList) => {
  if (typeof singleOrigin === "string" && singleOrigin.trim().length > 0) {
    return singleOrigin.trim();
  }

  const parsed = parseAllowedOrigins(originList ?? "");
  return parsed[0];
};
