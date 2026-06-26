/*
 * Resolve the Origin header for security smoke tests.
 * Loopback origins are never returned — see parse-allowed-origins.mjs.
 *
 * Usage (CI or local):
 *   ALLOWED_ORIGIN=... ALLOWED_ORIGINS=... node scripts/infra/resolve-smoke-allowed-origin.mjs
 */

import { resolveAllowedOrigin } from "./parse-allowed-origins.mjs";

const resolved = resolveAllowedOrigin(process.env.ALLOWED_ORIGIN, process.env.ALLOWED_ORIGINS);

if (!resolved) {
  console.error(
    "No deployable origin resolved from ALLOWED_ORIGIN/ALLOWED_ORIGINS. " +
      "Loopback origins are rejected — use a deployed preview or production URL.",
  );
  process.exit(1);
}

process.stdout.write(`${resolved}\n`);
